import 'server-only';

import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { savedItems, saves, teams } from '@/lib/db/schema';
import { getUserWithTeam } from '@/lib/db/queries';
import {
  createSaveForTeam,
  scheduleSaveProcessing,
} from '@/lib/saves/create-save-for-team';
import { buildCanonicalKeyFromUrl } from './canonical-key';
import {
  enrichmentStatusForDmPreview,
  type SaveReplyKind,
} from './faye-replies';
import {
  evaluateMergeCandidate,
  isMergeConfirmationText,
  markPendingMergeConfirmation,
  clearPendingMergeConfirmation,
} from './merge-follow-up-link';
import { resolveInstagramContentFromEvent } from './resolve-instagram-content';
import {
  extractDirectMediaFromEvent,
  extractInstagramPostUrlFromEvent,
} from './extract-reel-url';
import {
  findAwaitingLinkSaves,
  findUserSaveByCanonicalKey,
  touchUserSave,
  updateSaveEnrichment,
} from './save-queries';
import type { DmSharePreview } from './shared-post-types';
import {
  inferUrlPipelineKind,
  isFeedPostUrl,
} from '@/lib/instagram-pipeline/post-url';
import type { NormalizedInstagramEvent } from './types';

export type InstagramSaveResult =
  | { status: 'ignored' }
  | { status: 'quota_exceeded' }
  | { status: 'error'; message: string }
  | {
      status: 'saved';
      saveId: number;
      postUrl: string | null;
      processing: 'cache' | 'queued' | 'skipped' | 'none';
      skipReply?: boolean;
      replyKind?: SaveReplyKind;
      partialPreview?: boolean;
    }
  | {
      status: 'duplicate';
      saveId: number;
      replyKind: SaveReplyKind;
      skipReply?: boolean;
    };

function titleForPostUrl(postUrl: string) {
  if (inferUrlPipelineKind(postUrl) === 'reel') {
    return 'Instagram reel';
  }
  return 'Instagram post';
}

function contentTypeForPostUrl(postUrl: string) {
  if (inferUrlPipelineKind(postUrl) === 'reel') {
    return 'reel';
  }
  if (isFeedPostUrl(postUrl)) {
    return 'post';
  }
  return 'shared_post';
}

function replyKindForPermalink(
  postUrl: string,
  processing: 'cache' | 'queued' | 'skipped' | 'none',
  options?: {
    mergeSuccess?: boolean;
    mergeUncertain?: boolean;
    mergeSeparate?: boolean;
  }
): SaveReplyKind {
  if (options?.mergeSuccess) return 'merge_success';
  if (options?.mergeUncertain) return 'merge_uncertain';
  if (options?.mergeSeparate) return 'merge_separate';
  if (processing === 'cache') {
    return inferUrlPipelineKind(postUrl) === 'reel'
      ? 'global_cached'
      : 'global_cached';
  }
  return inferUrlPipelineKind(postUrl) === 'reel' ? 'reel_queued' : 'post_queued';
}

async function findSavedItemForSave(saveId: number) {
  const [item] = await db
    .select()
    .from(savedItems)
    .where(sql`${savedItems.metadata}->>'saveId' = ${String(saveId)}`)
    .orderBy(desc(savedItems.createdAt))
    .limit(1);

  return item ?? null;
}

async function upgradeSaveWithPermalink(params: {
  saveId: number;
  postUrl: string;
  teamId: number;
  userId: number;
  event: NormalizedInstagramEvent;
  replyKind: SaveReplyKind;
}) {
  const canonicalKey = buildCanonicalKeyFromUrl(params.postUrl);
  await updateSaveEnrichment(params.saveId, {
    enrichmentStatus: 'pending',
    canonicalKey,
    sourceUrl: params.postUrl,
    metadata: {
      upgradedFromMessageId: params.event.message_id,
    },
  });

  const savedItem = await findSavedItemForSave(params.saveId);
  if (savedItem) {
    await db
      .update(savedItems)
      .set({
        sourceUrl: params.postUrl,
        canonicalKey,
        enrichmentStatus: 'pending',
      })
      .where(eq(savedItems.id, savedItem.id));
  }

  const processing = await scheduleSaveProcessing({
    saveId: params.saveId,
    teamId: params.teamId,
    userId: params.userId,
    sourceUrl: params.postUrl,
    savedItemId: savedItem?.id,
    instagramMessageId: params.event.message_id,
    instagramSenderId: params.event.sender_igsid,
  });

  if (processing.source === 'cache' && processing.record) {
    return {
      status: 'saved' as const,
      saveId: params.saveId,
      postUrl: params.postUrl,
      processing: 'cache' as const,
      replyKind: 'global_cached' as const,
    };
  }

  return {
    status: 'saved' as const,
    saveId: params.saveId,
    postUrl: params.postUrl,
    processing:
      processing.source === 'cache' ||
      processing.source === 'queued' ||
      processing.source === 'skipped'
        ? processing.source
        : ('none' as const),
    replyKind: params.replyKind,
    skipReply: processing.source === 'cache',
  };
}

async function handleMergeConfirmation(params: {
  event: NormalizedInstagramEvent;
  fyndlaterUserId: number;
  teamId: number;
}): Promise<InstagramSaveResult | null> {
  if (!isMergeConfirmationText(params.event.text)) {
    return null;
  }

  const pending = await findAwaitingLinkSaves(params.fyndlaterUserId);
  for (const save of pending) {
    const metadata = (save.metadata ?? {}) as Record<string, unknown>;
    const pendingMerge = metadata.pendingMerge as
      | { candidateUrl?: string; expiresAt?: string }
      | undefined;
    if (!pendingMerge?.candidateUrl) continue;

    if (
      pendingMerge.expiresAt &&
      new Date(pendingMerge.expiresAt).getTime() < Date.now()
    ) {
      continue;
    }

    await clearPendingMergeConfirmation(save.id);
    return upgradeSaveWithPermalink({
      saveId: save.id,
      postUrl: pendingMerge.candidateUrl,
      teamId: params.teamId,
      userId: params.fyndlaterUserId,
      event: params.event,
      replyKind: 'merge_success',
    });
  }

  return null;
}

function buildPreviewInput(
  dmPreview: DmSharePreview | null,
  directMedia: ReturnType<typeof extractDirectMediaFromEvent>
): DmSharePreview | null {
  if (dmPreview) return dmPreview;
  if (!directMedia) return null;
  return {
    previewUrl: directMedia.previewUrl,
    attachmentType: directMedia.attachmentType,
  };
}

export async function saveInstagramContent(params: {
  event: NormalizedInstagramEvent;
  fyndlaterUserId: number;
}): Promise<InstagramSaveResult> {
  const { event, fyndlaterUserId } = params;
  const membership = await getUserWithTeam(fyndlaterUserId);

  if (!membership?.teamId) {
    return { status: 'error', message: 'No team found for linked user' };
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, membership.teamId))
    .limit(1);

  if (!team) {
    return { status: 'error', message: 'Team not found' };
  }

  const mergeConfirm = await handleMergeConfirmation({
    event,
    fyndlaterUserId,
    teamId: team.id,
  });
  if (mergeConfirm) {
    return mergeConfirm;
  }

  const resolved = await resolveInstagramContentFromEvent(event);
  const text = event.text?.trim() ?? null;
  const postUrl =
    resolved?.kind === 'permalink'
      ? resolved.postUrl
      : extractInstagramPostUrlFromEvent(event);
  const dmPreview = resolved?.kind === 'dm_preview' ? resolved.preview : null;
  const directMedia =
    !postUrl && !dmPreview ? extractDirectMediaFromEvent(event) : null;
  const previewInput = buildPreviewInput(dmPreview, directMedia);

  if (!postUrl && !previewInput && !text) {
    return { status: 'ignored' };
  }

  const canonicalKey = postUrl ? buildCanonicalKeyFromUrl(postUrl) : null;

  if (canonicalKey) {
    const existing = await findUserSaveByCanonicalKey(
      fyndlaterUserId,
      canonicalKey
    );
    if (existing && existing.status === 'ready') {
      await touchUserSave(existing.id);
      return {
        status: 'duplicate',
        saveId: existing.id,
        replyKind: 'duplicate_user',
      };
    }
  }

  let mergeReplyKind: SaveReplyKind | undefined;

  if (postUrl) {
    const merge = await evaluateMergeCandidate({
      userId: fyndlaterUserId,
      postUrl,
    });

    if (merge.action === 'upgrade') {
      return upgradeSaveWithPermalink({
        saveId: merge.targetSaveId,
        postUrl,
        teamId: team.id,
        userId: fyndlaterUserId,
        event,
        replyKind: 'merge_success',
      });
    }

    if (merge.action === 'confirm') {
      await markPendingMergeConfirmation(merge.targetSaveId, postUrl);
      return {
        status: 'saved',
        saveId: merge.targetSaveId,
        postUrl,
        processing: 'none',
        replyKind: 'merge_uncertain',
      };
    }

    if (merge.action === 'separate') {
      mergeReplyKind = 'merge_separate';
    }
  }

  const enrichmentStatus = postUrl
    ? 'pending'
    : previewInput
      ? enrichmentStatusForDmPreview()
      : 'full';

  const [savedItem] = await db
    .insert(savedItems)
    .values({
      fyndlaterUserId,
      sourceChannel: 'instagram',
      sourceMessageId: event.message_id,
      sourceUrl: postUrl ?? previewInput?.previewUrl ?? null,
      contentType: postUrl
        ? contentTypeForPostUrl(postUrl)
        : previewInput
          ? directMedia
            ? 'image'
            : 'shared_post'
          : 'text',
      title: postUrl
        ? titleForPostUrl(postUrl)
        : previewInput?.caption?.slice(0, 255) ||
          (directMedia ? 'Shared image' : 'Shared Instagram post'),
      summary:
        text ??
        previewInput?.caption ??
        (directMedia
          ? 'Faye is analyzing this image.'
          : 'Faye is organizing this save.'),
      rawText: text,
      canonicalKey,
      enrichmentStatus,
      embeddingStatus: 'pending',
      metadata: previewInput
        ? {
            igPostMediaId: previewInput.mediaId,
            attachmentType: previewInput.attachmentType,
            previewCaption: previewInput.caption,
          }
        : null,
    })
    .returning();

  try {
    const save =
      postUrl || previewInput
        ? await createSaveForTeam({
            teamId: team.id,
            userId: fyndlaterUserId,
            planName: team.planName,
            canonicalKey,
            enrichmentStatus,
            metadata: previewInput
              ? {
                  igPostMediaId: previewInput.mediaId,
                  attachmentType: previewInput.attachmentType,
                  previewCaption: previewInput.caption,
                  sourceMessageId: event.message_id,
                }
              : { sourceMessageId: event.message_id },
            input: postUrl
              ? { kind: 'link', url: postUrl, note: text ?? undefined }
              : {
                  kind: 'link',
                  url: previewInput!.previewUrl,
                  note: previewInput!.caption ?? text ?? undefined,
                },
          })
        : await createSaveForTeam({
            teamId: team.id,
            userId: fyndlaterUserId,
            planName: team.planName,
            enrichmentStatus: 'full',
            status: 'ready',
            metadata: { sourceMessageId: event.message_id },
            input: { kind: 'note', text: text! },
          });

    await db
      .update(savedItems)
      .set({
        metadata: { ...(savedItem.metadata ?? {}), saveId: save.id },
      })
      .where(eq(savedItems.id, savedItem.id));

    const processing =
      postUrl || previewInput
        ? await scheduleSaveProcessing({
            saveId: save.id,
            teamId: team.id,
            userId: fyndlaterUserId,
            sourceUrl: postUrl,
            dmPreview: previewInput ?? undefined,
            savedItemId: savedItem.id,
            instagramMessageId: event.message_id,
            instagramSenderId: event.sender_igsid,
          })
        : { source: 'skipped' as const };

    if (processing.source === 'cache') {
      return {
        status: 'saved',
        saveId: save.id,
        postUrl,
        processing: 'cache',
        replyKind: 'global_cached',
      };
    }

    let replyKind: SaveReplyKind | undefined = mergeReplyKind;
    if (!replyKind) {
      if (previewInput && !directMedia) {
        replyKind = 'shared_carousel_preview';
      } else if (directMedia) {
        replyKind = 'direct_image';
      } else if (postUrl) {
        replyKind = replyKindForPermalink(postUrl, processing.source);
      } else if (text) {
        replyKind = 'text_note';
      }
    }

    console.info('[meta] Saved Instagram content', {
      saveId: save.id,
      savedItemId: savedItem.id,
      postUrl,
      dmPreview: Boolean(previewInput && !directMedia),
      directMedia: Boolean(directMedia),
      processing: processing.source,
      enrichmentStatus,
      sender: event.sender_igsid,
    });

    return {
      status: 'saved',
      saveId: save.id,
      postUrl,
      partialPreview: Boolean(previewInput && !directMedia),
      processing:
        processing.source === 'queued' || processing.source === 'skipped'
          ? processing.source
          : 'none',
      replyKind,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Save failed';
    if (message.includes('save limit')) {
      return { status: 'quota_exceeded' };
    }
    console.error('[meta] Failed to save Instagram content:', message);
    return { status: 'error', message };
  }
}

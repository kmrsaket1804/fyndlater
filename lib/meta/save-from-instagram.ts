import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { savedItems, teams } from '@/lib/db/schema';
import { getUserWithTeam } from '@/lib/db/queries';
import {
  createSaveForTeam,
  scheduleSaveProcessing,
} from '@/lib/saves/create-save-for-team';
import {
  extractInstagramPostUrlFromEvent,
} from './extract-reel-url';
import { resolveInstagramPostUrlFromEvent } from './resolve-post-url';
import { notifyPostReady } from './reel-notifications';
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

  const postUrl = await resolveInstagramPostUrlFromEvent(event);
  const text = event.text?.trim() ?? null;

  if (!postUrl && !text) {
    if (event.attachments.length) {
      console.warn('[meta] Could not resolve shared post URL from attachments', {
        messageId: event.message_id,
        attachmentTypes: event.attachments.map((attachment) => attachment.type),
      });
      return {
        status: 'error',
        message: 'Could not resolve shared post URL from Instagram attachment',
      };
    }
    return { status: 'ignored' };
  }

  const [savedItem] = await db
    .insert(savedItems)
    .values({
      fyndlaterUserId,
      sourceChannel: 'instagram',
      sourceMessageId: event.message_id,
      sourceUrl: postUrl,
      contentType: postUrl
        ? contentTypeForPostUrl(postUrl)
        : event.message_type === 'shared_post'
          ? 'shared_post'
          : 'text',
      title: postUrl ? titleForPostUrl(postUrl) : 'Instagram message',
      summary: text ?? 'Faye is organizing this save.',
      rawText: text,
      embeddingStatus: 'pending',
    })
    .returning();

  try {
    const save = postUrl
      ? await createSaveForTeam({
          teamId: team.id,
          userId: fyndlaterUserId,
          planName: team.planName,
          input: { kind: 'link', url: postUrl, note: text ?? undefined },
        })
      : await createSaveForTeam({
          teamId: team.id,
          userId: fyndlaterUserId,
          planName: team.planName,
          input: { kind: 'note', text: text! },
        });

    const processing = postUrl
      ? await scheduleSaveProcessing({
          saveId: save.id,
          teamId: team.id,
          userId: fyndlaterUserId,
          sourceUrl: postUrl,
          savedItemId: savedItem.id,
          instagramMessageId: event.message_id,
          instagramSenderId: event.sender_igsid,
        })
      : { source: 'skipped' as const };

    if (processing.source === 'cache') {
      await notifyPostReady({
        senderIgsid: event.sender_igsid,
        instagramMessageId: event.message_id,
        record: processing.record,
        fromCache: true,
      });
    }

    console.info('[meta] Saved Instagram content', {
      saveId: save.id,
      savedItemId: savedItem.id,
      postUrl,
      processing: processing.source,
      sender: event.sender_igsid,
    });

    return {
      status: 'saved',
      saveId: save.id,
      postUrl,
      processing:
        processing.source === 'cache' ||
        processing.source === 'queued' ||
        processing.source === 'skipped'
          ? processing.source
          : 'none',
      skipReply: processing.source === 'cache',
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

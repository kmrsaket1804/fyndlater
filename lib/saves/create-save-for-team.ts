import { db } from '@/lib/db/drizzle';
import { saves } from '@/lib/db/schema';
import { getUsageSummary } from '@/lib/db/dashboard-queries';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  schedulePostProcessing,
  scheduleDmPreviewProcessing,
} from '@/lib/instagram-pipeline/schedule';
import { isInstagramPostUrl } from '@/lib/instagram-pipeline/post-url';
import type { DmSharePreview } from '@/lib/meta/shared-post-types';
import type { EnrichmentStatus } from '@/lib/meta/canonical-key';
import { PROCESSING_VERSION } from '@/lib/meta/canonical-key';
import type { CreateSaveInput } from './create-save';

function inferTypeFromUrl(url: string): 'reel' | 'post' | 'link' {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com/reel') || lower.includes('/reels/')) {
    return 'reel';
  }
  if (
    lower.includes('instagram.com/p/') ||
    lower.includes('instagram.com/tv/')
  ) {
    return 'post';
  }
  return 'link';
}

function buildSaveFields(input: CreateSaveInput) {
  if (input.kind === 'link') {
    const type = inferTypeFromUrl(input.url);
    let title = 'Saved link';
    try {
      const host = new URL(input.url).hostname.replace(/^www\./, '');
      title =
        type === 'reel' ? 'Saved Instagram reel' : `Saved from ${host}`;
    } catch {
      title = type === 'reel' ? 'Saved Instagram reel' : 'Saved link';
    }
    return {
      type,
      title,
      description:
        input.note?.trim() ||
        'Faye is summarizing this save. Check back in a moment.',
      source: input.url.includes('instagram.com') ? 'Instagram' : 'Link',
      sourceUrl: input.url,
      imageUrl: null as string | null,
    };
  }

  if (input.kind === 'note') {
    const text = input.text.trim();
    const title =
      text.length > 80 ? `${text.slice(0, 77)}...` : text || 'New note';
    return {
      type: 'link' as const,
      title,
      description: 'Faye is organizing this note.',
      source: 'Note',
      sourceUrl: null as string | null,
      imageUrl: null as string | null,
    };
  }

  return {
    type: 'screenshot' as const,
    title: input.title?.trim() || 'New screenshot',
    description: 'Faye is analyzing this screenshot.',
    source: 'Screenshot',
    sourceUrl: null as string | null,
    imageUrl: input.imageUrl,
  };
}

export async function createSaveForTeam(params: {
  teamId: number;
  userId: number;
  input: CreateSaveInput;
  planName?: string | null;
  canonicalKey?: string | null;
  enrichmentStatus?: EnrichmentStatus;
  metadata?: Record<string, unknown>;
  status?: 'processing' | 'ready' | 'failed';
}) {
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, params.teamId))
    .limit(1);

  if (!team) {
    throw new Error('Team not found');
  }

  const usage = await getUsageSummary(params.teamId, params.planName ?? team.planName);
  if (usage.savesUsed >= usage.savesLimit) {
    throw new Error(
      `You've reached your monthly save limit (${usage.savesLimit}). Upgrade to Pro for more.`
    );
  }

  const fields = buildSaveFields(params.input);

  const [created] = await db
    .insert(saves)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      type: fields.type,
      title: fields.title,
      description: fields.description,
      source: fields.source,
      sourceUrl: fields.sourceUrl,
      imageUrl: fields.imageUrl,
      canonicalKey: params.canonicalKey ?? null,
      enrichmentStatus: params.enrichmentStatus ?? 'pending',
      processingVersion: PROCESSING_VERSION,
      metadata: params.metadata ?? null,
      status: params.status ?? 'processing',
    })
    .returning();

  return created;
}

export async function scheduleSaveProcessing(params: {
  saveId: number;
  teamId: number;
  userId?: number;
  sourceUrl: string | null;
  dmPreview?: DmSharePreview;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
  upgradeExisting?: boolean;
}) {
  if (params.sourceUrl && isInstagramPostUrl(params.sourceUrl)) {
    return schedulePostProcessing({
      postUrl: params.sourceUrl,
      saveId: params.saveId,
      teamId: params.teamId,
      userId: params.userId,
      savedItemId: params.savedItemId,
      instagramMessageId: params.instagramMessageId,
      instagramSenderId: params.instagramSenderId,
    });
  }

  if (params.dmPreview) {
    return scheduleDmPreviewProcessing({
      preview: params.dmPreview,
      saveId: params.saveId,
      teamId: params.teamId,
      userId: params.userId,
      savedItemId: params.savedItemId,
      instagramMessageId: params.instagramMessageId,
      instagramSenderId: params.instagramSenderId,
    });
  }

  return { source: 'skipped' as const };
}

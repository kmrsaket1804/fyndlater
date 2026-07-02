import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { saveTags, savedItems, saves } from '@/lib/db/schema';
import { findDisplayUrl } from './apify';
import { upsertCachedReelRecord } from './cache';
import type { FinalRecord } from './types';

function titleFromRecord(record: FinalRecord) {
  const summary = record.visualAnalysis.summary.trim();
  if (summary) {
    return summary.length > 255 ? `${summary.slice(0, 252)}...` : summary;
  }

  const caption = record.metadata.caption?.trim();
  if (caption) {
    return caption.length > 255 ? `${caption.slice(0, 252)}...` : caption;
  }

  return 'Instagram reel';
}

function imageUrlFromRecord(record: FinalRecord) {
  const displayUrl = findDisplayUrl(record.metadata.raw);
  return displayUrl ?? null;
}

export async function applyReelResultToSave(
  saveId: number,
  record: FinalRecord,
  options?: {
    fromCache?: boolean;
    savedItemId?: number;
    instagramMessageId?: string;
  }
) {
  const summary = record.visualAnalysis.summary.trim();
  const title = titleFromRecord(record);
  const imageUrl = imageUrlFromRecord(record);

  await db
    .update(saves)
    .set({
      title,
      description: summary || record.metadata.caption || null,
      imageUrl,
      canonicalKey: record.metadata.shortcode
        ? `instagram:reel:${record.metadata.shortcode}`
        : null,
      enrichmentStatus: 'full',
      status: 'ready',
      updatedAt: new Date(),
    })
    .where(eq(saves.id, saveId));

  const tags = Array.from(
    new Set(
      record.visualAnalysis.tags
        .map((tag) => tag.trim().slice(0, 50))
        .filter(Boolean)
    )
  ).slice(0, 20);

  if (tags.length) {
    await db
      .insert(saveTags)
      .values(tags.map((tag) => ({ saveId, tag })))
      .onConflictDoNothing();
  }

  console.info('[reel-pipeline] Applied reel result to save', {
    saveId,
    title,
    tagCount: tags.length,
    llmCostUsd: record.llmUsage.totals.costUsd,
    fromCache: options?.fromCache ?? false,
  });

  const shortcode = record.metadata.shortcode;
  if (shortcode && !options?.fromCache) {
    await upsertCachedReelRecord(shortcode, record.reelUrl, record);
  }

  await syncSavedItemFromRecord(record, options);
}

async function syncSavedItemFromRecord(
  record: FinalRecord,
  options?: {
    savedItemId?: number;
    instagramMessageId?: string;
  }
) {
  const summary = record.visualAnalysis.summary.trim();
  const title = titleFromRecord(record);
  const tags = Array.from(
    new Set(
      record.visualAnalysis.tags
        .map((tag) => tag.trim().slice(0, 50))
        .filter(Boolean)
    )
  ).slice(0, 20);

  const patch = {
    title,
    summary: summary || record.metadata.caption || null,
    tags,
    sourceUrl: record.reelUrl,
    contentType: 'reel' as const,
    embeddingStatus: 'ready' as const,
  };

  if (options?.savedItemId) {
    await db
      .update(savedItems)
      .set(patch)
      .where(eq(savedItems.id, options.savedItemId));
    return;
  }

  if (options?.instagramMessageId) {
    await db
      .update(savedItems)
      .set(patch)
      .where(eq(savedItems.sourceMessageId, options.instagramMessageId));
  }
}

export async function markSaveReelFailed(saveId: number, errorMessage: string) {
  await db
    .update(saves)
    .set({
      status: 'failed',
      description: errorMessage.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(saves.id, saveId));

  console.error('[reel-pipeline] Marked save as failed', { saveId, errorMessage });
}

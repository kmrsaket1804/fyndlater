import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { saveTags, savedItems, saves } from '@/lib/db/schema';
import { findDisplayUrl } from '../reel-pipeline/apify';
import type { FinalRecord } from '../reel-pipeline/types';
import { upsertCachedPostRecord } from './cache';
import {
  isProcessedPostRecord,
  postUrlFromRecord,
  type ProcessedSaveRecord,
} from './router';
import type { ProcessedPostRecord, SavePostMetadata } from './types';

function titleFromSummary(summary: string, caption?: string | null) {
  const text = summary.trim() || caption?.trim() || '';
  if (!text) return 'Instagram post';
  return text.length > 255 ? `${text.slice(0, 252)}...` : text;
}

function tagsFromAnalysis(tags: string[]) {
  return Array.from(
    new Set(tags.map((tag) => tag.trim().slice(0, 50)).filter(Boolean))
  ).slice(0, 20);
}

function buildSaveMetadata(record: ProcessedPostRecord): SavePostMetadata {
  return {
    postKind: record.postKind,
    shortcode: record.metadata.shortcode,
    slideCount: record.slides?.length ?? record.metadata.slideCount,
    slides: record.slides?.map((slide) => ({
      index: slide.index,
      shortCode: slide.shortCode,
      type: slide.type,
      displayUrl: slide.displayUrl,
      alt: slide.alt,
      description: slide.analysis?.description,
      visibleText: slide.analysis?.visibleText,
      tags: slide.analysis?.tags,
    })),
  };
}

function imageUrlFromRecord(record: ProcessedSaveRecord) {
  if (isProcessedPostRecord(record)) {
    const firstSlide = record.slides?.[0]?.displayUrl;
    if (firstSlide) return firstSlide;
    return findDisplayUrl(record.metadata.raw) ?? null;
  }

  return findDisplayUrl(record.metadata.raw) ?? null;
}

function contentTypeFromRecord(record: ProcessedSaveRecord) {
  if (!isProcessedPostRecord(record)) return 'reel' as const;
  if (record.postKind === 'carousel') return 'carousel' as const;
  if (record.postKind === 'image') return 'image' as const;
  return 'post' as const;
}

export async function applyPostResultToSave(
  saveId: number,
  record: ProcessedSaveRecord,
  options?: {
    fromCache?: boolean;
    savedItemId?: number;
    instagramMessageId?: string;
  }
) {
  if (!isProcessedPostRecord(record)) {
    return applyReelCompat(saveId, record, options);
  }

  const summary = record.visualAnalysis.summary.trim();
  const title = titleFromSummary(summary, record.metadata.caption);
  const imageUrl = imageUrlFromRecord(record);
  const metadata = buildSaveMetadata(record);
  const saveType =
    record.postKind === 'carousel' || record.postKind === 'image'
      ? 'post'
      : 'reel';

  await db
    .update(saves)
    .set({
      type: saveType,
      title,
      description: summary || record.metadata.caption || null,
      imageUrl,
      metadata,
      status: 'ready',
      updatedAt: new Date(),
    })
    .where(eq(saves.id, saveId));

  const tags = tagsFromAnalysis(record.visualAnalysis.tags);
  if (tags.length) {
    await db
      .insert(saveTags)
      .values(tags.map((tag) => ({ saveId, tag })))
      .onConflictDoNothing();
  }

  const shortcode = record.metadata.shortcode;
  if (shortcode && !options?.fromCache) {
    await upsertCachedPostRecord(shortcode, record.postUrl, record);
  }

  await syncSavedItem(record, options, { title, summary, tags, metadata });

  console.info('[instagram-pipeline] Applied post result to save', {
    saveId,
    postKind: record.postKind,
    title,
    tagCount: tags.length,
    slideCount: record.slides?.length,
    llmCostUsd: record.llmUsage.totals.costUsd,
    fromCache: options?.fromCache ?? false,
  });
}

async function applyReelCompat(
  saveId: number,
  record: FinalRecord,
  options?: {
    fromCache?: boolean;
    savedItemId?: number;
    instagramMessageId?: string;
  }
) {
  const { applyReelResultToSave } = await import('../reel-pipeline/apply-to-save');
  await applyReelResultToSave(saveId, record, options);
}

async function syncSavedItem(
  record: ProcessedPostRecord,
  options: { savedItemId?: number; instagramMessageId?: string } | undefined,
  patch: {
    title: string;
    summary: string;
    tags: string[];
    metadata: SavePostMetadata;
  }
) {
  const itemPatch = {
    title: patch.title,
    summary: patch.summary || record.metadata.caption || null,
    tags: patch.tags,
    sourceUrl: postUrlFromRecord(record),
    contentType: contentTypeFromRecord(record),
    metadata: patch.metadata,
    embeddingStatus: 'ready' as const,
  };

  if (options?.savedItemId) {
    await db
      .update(savedItems)
      .set(itemPatch)
      .where(eq(savedItems.id, options.savedItemId));
    return;
  }

  if (options?.instagramMessageId) {
    await db
      .update(savedItems)
      .set(itemPatch)
      .where(eq(savedItems.sourceMessageId, options.instagramMessageId));
  }
}

export async function markSavePostFailed(saveId: number, errorMessage: string) {
  await db
    .update(saves)
    .set({
      status: 'failed',
      description: errorMessage.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(eq(saves.id, saveId));

  console.error('[instagram-pipeline] Marked save as failed', {
    saveId,
    errorMessage,
  });
}

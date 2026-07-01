import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reelProcessingCache } from '@/lib/db/schema';
import type { FinalRecord } from '../reel-pipeline/types';
import {
  isProcessedPostRecord,
  type ProcessedSaveRecord,
} from './router';
import type { ProcessedPostRecord } from './types';

export async function getCachedPostRecord(
  shortcode: string
): Promise<ProcessedSaveRecord | null> {
  const [row] = await db
    .select()
    .from(reelProcessingCache)
    .where(eq(reelProcessingCache.shortcode, shortcode))
    .limit(1);

  if (!row?.record) {
    return null;
  }

  return row.record as ProcessedSaveRecord;
}

export async function upsertCachedPostRecord(
  shortcode: string,
  postUrl: string,
  record: ProcessedSaveRecord
) {
  await db
    .insert(reelProcessingCache)
    .values({
      shortcode,
      reelUrl: postUrl,
      record,
      processedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: reelProcessingCache.shortcode,
      set: {
        reelUrl: postUrl,
        record,
        processedAt: new Date(),
      },
    });
}

export function cachedRecordToProcessedPost(
  record: ProcessedSaveRecord
): ProcessedPostRecord | null {
  if (isProcessedPostRecord(record)) {
    return record;
  }
  return null;
}

export function cachedRecordToReel(record: ProcessedSaveRecord): FinalRecord | null {
  if (isProcessedPostRecord(record)) {
    return null;
  }
  return record;
}

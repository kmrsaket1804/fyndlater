import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { reelProcessingCache } from '@/lib/db/schema';
import type { FinalRecord } from './types';

export async function getCachedReelRecord(
  shortcode: string
): Promise<FinalRecord | null> {
  const [row] = await db
    .select()
    .from(reelProcessingCache)
    .where(eq(reelProcessingCache.shortcode, shortcode))
    .limit(1);

  if (!row?.record) {
    return null;
  }

  return row.record as FinalRecord;
}

export async function upsertCachedReelRecord(
  shortcode: string,
  reelUrl: string,
  record: FinalRecord
) {
  await db
    .insert(reelProcessingCache)
    .values({
      shortcode,
      reelUrl,
      record,
      processedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: reelProcessingCache.shortcode,
      set: {
        reelUrl,
        record,
        processedAt: new Date(),
      },
    });
}

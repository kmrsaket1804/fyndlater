import 'server-only';

import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { savedItems, saves } from '@/lib/db/schema';
import type { EnrichmentStatus } from './canonical-key';

const MERGE_WINDOW_MS = 10 * 60 * 1000;

export async function findUserSaveByCanonicalKey(
  userId: number,
  canonicalKey: string
) {
  const [row] = await db
    .select()
    .from(saves)
    .where(and(eq(saves.userId, userId), eq(saves.canonicalKey, canonicalKey)))
    .orderBy(desc(saves.updatedAt))
    .limit(1);

  return row ?? null;
}

export async function findAwaitingLinkSaves(
  userId: number,
  withinMs = MERGE_WINDOW_MS
) {
  const since = new Date(Date.now() - withinMs);

  return db
    .select()
    .from(saves)
    .where(
      and(
        eq(saves.userId, userId),
        eq(saves.enrichmentStatus, 'awaiting_link'),
        gte(saves.createdAt, since)
      )
    )
    .orderBy(desc(saves.createdAt));
}

export async function findSavedItemForSave(saveId: number) {
  const [item] = await db
    .select()
    .from(savedItems)
    .where(
      sql`${savedItems.metadata}->>'saveId' = ${String(saveId)} OR ${savedItems.sourceMessageId} IS NOT NULL`
    )
    .orderBy(desc(savedItems.createdAt))
    .limit(1);

  return item ?? null;
}

export async function findSavedItemByMessageId(messageId: string) {
  const [item] = await db
    .select()
    .from(savedItems)
    .where(eq(savedItems.sourceMessageId, messageId))
    .limit(1);

  return item ?? null;
}

export async function updateSaveEnrichment(
  saveId: number,
  patch: {
    enrichmentStatus?: EnrichmentStatus;
    canonicalKey?: string | null;
    sourceUrl?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  const [current] = await db
    .select({ metadata: saves.metadata })
    .from(saves)
    .where(eq(saves.id, saveId))
    .limit(1);

  await db
    .update(saves)
    .set({
      enrichmentStatus: patch.enrichmentStatus,
      canonicalKey: patch.canonicalKey,
      sourceUrl: patch.sourceUrl,
      metadata: patch.metadata
        ? { ...(current?.metadata ?? {}), ...patch.metadata }
        : undefined,
      updatedAt: new Date(),
    })
    .where(eq(saves.id, saveId));
}

export async function touchUserSave(saveId: number) {
  await db
    .update(saves)
    .set({ updatedAt: new Date() })
    .where(eq(saves.id, saveId));
}

export { MERGE_WINDOW_MS };

import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { savedItems, saves, type SaveStatus } from '@/lib/db/schema';

export async function getSaveStatus(
  saveId: number
): Promise<SaveStatus | null> {
  const [row] = await db
    .select({ status: saves.status })
    .from(saves)
    .where(eq(saves.id, saveId))
    .limit(1);

  return (row?.status as SaveStatus | undefined) ?? null;
}

export function isTerminalSaveStatus(status: SaveStatus | null) {
  return status === 'ready' || status === 'failed';
}

/** Marks a save failed only if it is still processing. Returns true when updated. */
export async function markSaveFailedIfProcessing(
  saveId: number,
  errorMessage: string
) {
  const [updated] = await db
    .update(saves)
    .set({
      status: 'failed',
      description: errorMessage.slice(0, 500),
      updatedAt: new Date(),
    })
    .where(and(eq(saves.id, saveId), eq(saves.status, 'processing')))
    .returning({ id: saves.id });

  if (updated) {
    await db
      .update(savedItems)
      .set({ embeddingStatus: 'failed' })
      .where(sql`${savedItems.metadata}->>'saveId' = ${String(saveId)}`);
  }

  return Boolean(updated);
}

export async function cancelPendingSave(saveId: number, reason: string) {
  return markSaveFailedIfProcessing(saveId, reason);
}

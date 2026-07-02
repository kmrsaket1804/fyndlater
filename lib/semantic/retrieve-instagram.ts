import 'server-only';

import { sql, eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { savedItems } from '@/lib/db/schema';
import {
  extractRetrieveQuery,
  formatRetrievalReply,
  retrieveUserSaves,
} from './retrieve';
import { isSemanticRetrievalConfigured } from './config';

export async function retrieveInstagramContent(params: {
  fyndlaterUserId: number;
  text: string | null;
}) {
  const query = extractRetrieveQuery(params.text);
  if (!query) {
    return {
      status: 'ignored' as const,
      reply:
        'Ask me naturally — for example, "Find the packaging reel I saved" or "Show me recipe posts".',
    };
  }

  if (!isSemanticRetrievalConfigured()) {
    return {
      status: 'unavailable' as const,
      reply:
        'Search is warming up ✨ I can still save reels and posts for you — try again shortly.',
    };
  }

  const results = await retrieveUserSaves({
    userId: params.fyndlaterUserId,
    query,
    limit: 5,
  });

  return {
    status: 'ok' as const,
    query,
    results,
    reply: formatRetrievalReply(query, results),
  };
}

export async function findSavedItemIdForSave(saveId: number) {
  const [item] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(sql`${savedItems.metadata}->>'saveId' = ${String(saveId)}`)
    .limit(1);

  if (item) {
    return item.id;
  }

  const [fallback] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(eq(savedItems.metadata, { saveId }))
    .limit(1);

  return fallback?.id;
}

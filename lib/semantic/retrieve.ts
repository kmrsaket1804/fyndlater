import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { saveTags, saves } from '@/lib/db/schema';
import { isSemanticRetrievalConfigured } from './config';
import { embedQuery } from './embeddings';
import { instagramPostPathFromUrl } from '@/lib/meta/instagram-dm-url';
import { searchUserSaveVectors } from './qdrant';

export type RetrievedSave = {
  saveId: number;
  score: number;
  title: string;
  description: string | null;
  sourceUrl: string | null;
  type: string;
  tags: string[];
};

function extractRetrieveQuery(text: string | null): string | null {
  if (!text?.trim()) {
    return null;
  }

  let query = text.trim();
  const lower = query.toLowerCase();

  const prefixes = [
    'what did i save about',
    'what did i save',
    'where is',
    'find me',
    'find the',
    'find my',
    'find',
    'show me',
    'show my',
    'show',
    'search for',
    'search',
    'get me',
    'get my',
    'get',
  ];

  for (const prefix of prefixes) {
    if (lower.startsWith(prefix)) {
      query = query.slice(prefix.length).trim();
      break;
    }
  }

  query = query.replace(/^my\s+/i, '').replace(/\?+$/, '').trim();
  return query || text.trim();
}

export { extractRetrieveQuery };

export async function retrieveUserSaves(params: {
  userId: number;
  query: string;
  limit?: number;
}): Promise<RetrievedSave[]> {
  if (!isSemanticRetrievalConfigured()) {
    return [];
  }

  const query = params.query.trim();
  if (!query) {
    return [];
  }

  const vector = await embedQuery(query);
  const hits = await searchUserSaveVectors({
    userId: params.userId,
    vector,
    limit: Math.max(12, (params.limit ?? 5) * 4),
  });

  const grouped = new Map<number, number>();
  for (const hit of hits) {
    const payload = hit.payload ?? {};
    const saveId = Number(payload.user_save_id);
    if (!saveId || Number.isNaN(saveId)) {
      continue;
    }
    const score = hit.score ?? 0;
    const current = grouped.get(saveId);
    if (current === undefined || score > current) {
      grouped.set(saveId, score);
    }
  }

  const ranked = [...grouped.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, params.limit ?? 5);

  if (!ranked.length) {
    return [];
  }

  const saveIds = ranked.map(([saveId]) => saveId);
  const rows = await db
    .select()
    .from(saves)
    .where(
      and(
        inArray(saves.id, saveIds),
        eq(saves.userId, params.userId),
        isNull(saves.deletedAt)
      )
    );

  const tagRows = await db
    .select()
    .from(saveTags)
    .where(inArray(saveTags.saveId, saveIds));

  const tagsBySave = new Map<number, string[]>();
  for (const row of tagRows) {
    const list = tagsBySave.get(row.saveId) ?? [];
    list.push(row.tag);
    tagsBySave.set(row.saveId, list);
  }

  const byId = new Map(rows.map((row) => [row.id, row]));

  return ranked
    .map(([saveId, score]) => {
      const row = byId.get(saveId);
      if (!row || row.status !== 'ready') {
        return null;
      }
      return {
        saveId,
        score,
        title: row.title,
        description: row.description,
        sourceUrl: row.sourceUrl,
        type: row.type,
        tags: tagsBySave.get(saveId) ?? [],
      };
    })
    .filter((row): row is RetrievedSave => row !== null);
}

export function formatRetrievalReply(
  query: string,
  results: RetrievedSave[]
): string {
  if (!results.length) {
    return `I couldn't find anything saved that matches "${query}" yet ✨ Try another phrase or save more to Faye first.`;
  }

  const lines = ['Found it ✨ Here are the closest saves:', ''];
  for (const [index, result] of results.slice(0, 3).entries()) {
    const snippet =
      result.description?.trim() ||
      result.tags.slice(0, 3).join(', ') ||
      result.type;
    lines.push(`${index + 1}. "${truncate(result.title, 90)}"`);
    lines.push(`   ${truncate(snippet, 120)}`);
    const postPath = result.sourceUrl
      ? instagramPostPathFromUrl(result.sourceUrl, result.type)
      : null;
    if (postPath) {
      lines.push(`   ${truncate(postPath, 80)}`);
    }
    lines.push('');
  }

  return truncate(lines.join('\n').trim(), 950);
}

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

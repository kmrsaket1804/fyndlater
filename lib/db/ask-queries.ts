import { and, desc, eq, gte, ilike, inArray, or } from 'drizzle-orm';
import { db } from './drizzle';
import {
  collections,
  retrievals,
  saveCollections,
  saves,
  saveTags,
  savedSearches,
} from './schema';
import { getTeamForUser, getUser } from './queries';
import {
  formatSaveType,
  formatShortDate,
} from '@/lib/dashboard/format';
import type { AskPageData, ChatMessage, SaveItem } from '@/lib/dashboard/types';
import { getSearchSuggestions } from './dashboard-queries';

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'i',
  'my',
  'me',
  'that',
  'this',
  'from',
  'about',
  'find',
  'show',
  'get',
  'saved',
  'save',
  'last',
  'week',
  'ideas',
  'for',
]);

function parseQueryHints(query: string) {
  const lower = query.toLowerCase();
  const withinLastWeek =
    lower.includes('last week') ||
    lower.includes('this week') ||
    lower.includes('recent');
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  return { withinLastWeek, weekStart };
}

function tokenizeQuery(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

async function loadSaveItem(saveId: number, teamId: number): Promise<SaveItem | null> {
  const [row] = await db
    .select()
    .from(saves)
    .where(and(eq(saves.id, saveId), eq(saves.teamId, teamId)))
    .limit(1);

  if (!row) return null;

  const tags = await db
    .select({ tag: saveTags.tag })
    .from(saveTags)
    .where(eq(saveTags.saveId, saveId));

  const [collection] = await db
    .select({ name: collections.name })
    .from(saveCollections)
    .innerJoin(collections, eq(saveCollections.collectionId, collections.id))
    .where(eq(saveCollections.saveId, saveId))
    .limit(1);

  return {
    id: row.id,
    type: formatSaveType(row.type),
    title: row.title,
    description: row.description ?? '',
    tags: tags.map((t) => t.tag),
    collection: collection?.name ?? 'Uncategorized',
    savedAt: formatShortDate(row.createdAt),
    source: row.source,
    image: row.imageUrl,
    status: row.status,
  };
}

async function rankSavesForQuery(teamId: number, query: string) {
  const tokens = tokenizeQuery(query);
  const { withinLastWeek, weekStart } = parseQueryHints(query);

  const conditions = tokens.flatMap((token) => [
    ilike(saves.title, `%${token}%`),
    ilike(saves.description, `%${token}%`),
  ]);

  const candidateRows =
    tokens.length > 0
      ? await db
          .select()
          .from(saves)
          .where(
            and(
              eq(saves.teamId, teamId),
              eq(saves.status, 'ready'),
              or(...conditions)
            )
          )
          .orderBy(desc(saves.createdAt))
          .limit(40)
      : await db
          .select()
          .from(saves)
          .where(and(eq(saves.teamId, teamId), eq(saves.status, 'ready')))
          .orderBy(desc(saves.createdAt))
          .limit(20);

  if (candidateRows.length === 0) return [];

  const saveIds = candidateRows.map((s) => s.id);
  const tagRows = await db
    .select({ saveId: saveTags.saveId, tag: saveTags.tag })
    .from(saveTags)
    .where(inArray(saveTags.saveId, saveIds));

  const collectionRows = await db
    .select({
      saveId: saveCollections.saveId,
      name: collections.name,
    })
    .from(saveCollections)
    .innerJoin(collections, eq(saveCollections.collectionId, collections.id))
    .where(inArray(saveCollections.saveId, saveIds));

  const tagsBySave = new Map<number, string[]>();
  for (const row of tagRows) {
    const list = tagsBySave.get(row.saveId) ?? [];
    list.push(row.tag);
    tagsBySave.set(row.saveId, list);
  }

  const collectionBySave = new Map<number, string>();
  for (const row of collectionRows) {
    if (!collectionBySave.has(row.saveId)) {
      collectionBySave.set(row.saveId, row.name);
    }
  }

  const scored = candidateRows
    .map((row) => {
      const title = row.title.toLowerCase();
      const description = (row.description ?? '').toLowerCase();
      const tags = (tagsBySave.get(row.id) ?? []).map((t) => t.toLowerCase());
      const collection = (collectionBySave.get(row.id) ?? '').toLowerCase();
      const haystack = [title, description, collection, ...tags].join(' ');

      let score = 0;
      for (const token of tokens) {
        if (title.includes(token)) score += 5;
        if (tags.some((tag) => tag.includes(token))) score += 4;
        if (collection.includes(token)) score += 3;
        if (description.includes(token)) score += 2;
        if (haystack.includes(token)) score += 1;
      }

      if (withinLastWeek && row.createdAt >= weekStart) score += 2;

      return { row, score, tags, collection: collectionBySave.get(row.id) };
    })
    .filter((item) => item.score > 0 || tokens.length === 0)
    .sort((a, b) => b.score - a.score || b.row.createdAt.getTime() - a.row.createdAt.getTime());

  return scored.map(({ row, tags, collection }) => ({
    id: row.id,
    type: formatSaveType(row.type),
    title: row.title,
    description: row.description ?? '',
    tags,
    collection: collection ?? 'Uncategorized',
    savedAt: formatShortDate(row.createdAt),
    source: row.source,
    image: row.imageUrl,
    status: row.status,
  }));
}

function formatChatTime(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

async function retrievalToMessages(
  retrieval: typeof retrievals.$inferSelect,
  teamId: number
): Promise<ChatMessage[]> {
  const createdAt = formatChatTime(retrieval.createdAt);
  const userMessage: ChatMessage = {
    id: `q-${retrieval.id}`,
    role: 'user',
    text: retrieval.query,
    createdAt,
  };

  const assistantMessage: ChatMessage = {
    id: `a-${retrieval.id}`,
    role: 'assistant',
    text: retrieval.responseText ?? 'Here is what I found in your saves.',
    createdAt,
  };

  if (retrieval.saveId) {
    const save = await loadSaveItem(retrieval.saveId, teamId);
    if (save) assistantMessage.save = save;
  }

  return [userMessage, assistantMessage];
}

export async function getAskChatHistory(teamId: number, limit = 30) {
  const rows = await db
    .select()
    .from(retrievals)
    .where(eq(retrievals.teamId, teamId))
    .orderBy(desc(retrievals.createdAt))
    .limit(limit);

  const chronological = [...rows].reverse();
  const messages: ChatMessage[] = [];

  for (const retrieval of chronological) {
    messages.push(...(await retrievalToMessages(retrieval, teamId)));
  }

  return messages;
}

export async function getLatestChatPreview(
  teamId: number
): Promise<ChatMessage[]> {
  const messages = await getAskChatHistory(teamId, 1);
  if (messages.length === 0) {
    return [
      {
        id: 'welcome',
        role: 'assistant',
        text: 'Ask me to find anything you have saved — try "packaging reel" or "recipes from last week".',
      },
    ];
  }
  return messages.slice(-2);
}

export async function getAskPageData(): Promise<AskPageData> {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const team = await getTeamForUser();
  if (!team) throw new Error('Team not found');

  const [messages, suggestions] = await Promise.all([
    getAskChatHistory(team.id),
    getSearchSuggestions(team.id),
  ]);

  if (messages.length === 0) {
    messages.push({
      id: 'welcome',
      role: 'assistant',
      text: 'Hi! I\'m Faye. Ask me to find anything you\'ve saved — try "packaging reel" or "travel ideas for Bali".',
    });
  }

  return { messages, suggestions };
}

export async function askFaye(query: string) {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const team = await getTeamForUser();
  if (!team) throw new Error('Team not found');

  const trimmed = query.trim();
  if (!trimmed) throw new Error('Query is required');

  const matches = await rankSavesForQuery(team.id, trimmed);
  const topMatch = matches[0];

  let responseText: string;
  if (topMatch) {
    responseText = `Here's the ${topMatch.type.toLowerCase()} you saved — "${topMatch.title}".`;
  } else {
    responseText =
      "I couldn't find a match in your saves yet. Try different keywords or save something to Faye first.";
  }

  const [retrieval] = await db
    .insert(retrievals)
    .values({
      teamId: team.id,
      userId: user.id,
      saveId: topMatch?.id ?? null,
      query: trimmed,
      responseText,
    })
    .returning();

  const existingSearch = await db
    .select()
    .from(savedSearches)
    .where(
      and(
        eq(savedSearches.teamId, team.id),
        ilike(savedSearches.query, trimmed)
      )
    )
    .limit(1);

  if (existingSearch[0]) {
    await db
      .update(savedSearches)
      .set({ lastUsedAt: new Date() })
      .where(eq(savedSearches.id, existingSearch[0].id));
  }

  const messages = await retrievalToMessages(retrieval, team.id);

  return {
    messages,
    matches: matches.slice(0, 3),
  };
}

export async function findSimilarSaves(teamId: number, saveId: number, limit = 3) {
  const base = await loadSaveItem(saveId, teamId);
  if (!base) return [];

  const query = [...base.tags, base.collection, base.title].join(' ');
  const matches = await rankSavesForQuery(teamId, query);
  return matches.filter((s) => s.id !== saveId).slice(0, limit);
}

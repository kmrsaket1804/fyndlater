import {
  and,
  count,
  desc,
  eq,
  gte,
  inArray,
  lt,
} from 'drizzle-orm';
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
  formatPercentChange,
  formatSaveType,
  formatShortDate,
  getSavesLimit,
} from '@/lib/dashboard/format';
import type {
  CollectionItem,
  DashboardHomeData,
  HighlightItem,
  SaveItem,
  StatItem,
  UsageSummary,
} from '@/lib/dashboard/types';
import { getLatestChatPreview } from './ask-queries';

async function requireTeamId() {
  const team = await getTeamForUser();
  if (!team) {
    throw new Error('Team not found');
  }
  return team;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

async function mapSaveRows(
  rows: {
    id: number;
    type: string;
    title: string;
    description: string | null;
    source: string;
    imageUrl: string | null;
    status: string;
    createdAt: Date;
    collectionName: string | null;
  }[],
  tagMap: Map<number, string[]>
): Promise<SaveItem[]> {
  return rows.map((row) => ({
    id: row.id,
    type: formatSaveType(row.type),
    title: row.title,
    description: row.description ?? '',
    tags: tagMap.get(row.id) ?? [],
    collection: row.collectionName ?? 'Uncategorized',
    savedAt: formatShortDate(row.createdAt),
    source: row.source,
    image: row.imageUrl,
    status: row.status,
  }));
}

async function getTagsForSaves(saveIds: number[]) {
  const tagMap = new Map<number, string[]>();
  if (saveIds.length === 0) return tagMap;

  const tags = await db
    .select({ saveId: saveTags.saveId, tag: saveTags.tag })
    .from(saveTags)
    .where(inArray(saveTags.saveId, saveIds));

  for (const { saveId, tag } of tags) {
    const existing = tagMap.get(saveId) ?? [];
    existing.push(tag);
    tagMap.set(saveId, existing);
  }

  return tagMap;
}

async function getSaveRows(teamId: number, limit?: number) {
  let saveQuery = db
    .select()
    .from(saves)
    .where(eq(saves.teamId, teamId))
    .orderBy(desc(saves.createdAt));

  if (limit) {
    saveQuery = saveQuery.limit(limit) as typeof saveQuery;
  }

  const saveRows = await saveQuery;
  if (saveRows.length === 0) return [];

  const saveIds = saveRows.map((s) => s.id);
  const collectionLinks = await db
    .select({
      saveId: saveCollections.saveId,
      name: collections.name,
    })
    .from(saveCollections)
    .innerJoin(collections, eq(saveCollections.collectionId, collections.id))
    .where(inArray(saveCollections.saveId, saveIds));

  const collectionBySave = new Map<number, string>();
  for (const link of collectionLinks) {
    if (!collectionBySave.has(link.saveId)) {
      collectionBySave.set(link.saveId, link.name);
    }
  }

  return saveRows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    source: row.source,
    imageUrl: row.imageUrl,
    status: row.status,
    createdAt: row.createdAt,
    collectionName: collectionBySave.get(row.id) ?? null,
  }));
}

export async function getRecentSaves(teamId: number, limit = 4) {
  const rows = await getSaveRows(teamId, limit);
  const tagMap = await getTagsForSaves(rows.map((r) => r.id));
  return mapSaveRows(rows, tagMap);
}

export async function getAllSaves(teamId: number) {
  const rows = await getSaveRows(teamId);
  const tagMap = await getTagsForSaves(rows.map((r) => r.id));
  return mapSaveRows(rows, tagMap);
}

export async function getCollectionsForTeam(teamId: number): Promise<CollectionItem[]> {
  const teamCollections = await db
    .select()
    .from(collections)
    .where(eq(collections.teamId, teamId))
    .orderBy(collections.name);

  const results: CollectionItem[] = [];

  for (const collection of teamCollections) {
    const [countResult] = await db
      .select({ value: count() })
      .from(saveCollections)
      .where(eq(saveCollections.collectionId, collection.id));

    const previewRows = await db
      .select({ imageUrl: saves.imageUrl, title: saves.title })
      .from(saveCollections)
      .innerJoin(saves, eq(saveCollections.saveId, saves.id))
      .where(eq(saveCollections.collectionId, collection.id))
      .orderBy(desc(saves.createdAt))
      .limit(3);

    const previews = previewRows.map((row) => {
      if (row.imageUrl) return row.imageUrl;
      return row.title.slice(0, 1).toUpperCase();
    });

    results.push({
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      count: countResult?.value ?? 0,
      icon: collection.icon ?? '📁',
      gradient: collection.gradient ?? 'from-gray-400 to-gray-500',
      previews,
    });
  }

  return results;
}

export async function getDashboardStats(teamId: number): Promise<StatItem[]> {
  const weekStart = startOfWeek();
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const [savesThisWeek] = await db
    .select({ value: count() })
    .from(saves)
    .where(and(eq(saves.teamId, teamId), gte(saves.createdAt, weekStart)));

  const [savesLastWeek] = await db
    .select({ value: count() })
    .from(saves)
    .where(
      and(
        eq(saves.teamId, teamId),
        gte(saves.createdAt, lastWeekStart),
        lt(saves.createdAt, weekStart)
      )
    );

  const [collectionCount] = await db
    .select({ value: count() })
    .from(collections)
    .where(eq(collections.teamId, teamId));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const [retrievalsThisWeek] = await db
    .select({ value: count() })
    .from(retrievals)
    .where(
      and(eq(retrievals.teamId, teamId), gte(retrievals.createdAt, sevenDaysAgo))
    );

  const [retrievalsLastWeek] = await db
    .select({ value: count() })
    .from(retrievals)
    .where(
      and(
        eq(retrievals.teamId, teamId),
        gte(retrievals.createdAt, fourteenDaysAgo),
        lt(retrievals.createdAt, sevenDaysAgo)
      )
    );

  const [processingCount] = await db
    .select({ value: count() })
    .from(saves)
    .where(and(eq(saves.teamId, teamId), eq(saves.status, 'processing')));

  const thisWeekSaves = savesThisWeek?.value ?? 0;
  const lastWeekSaves = savesLastWeek?.value ?? 0;
  const thisWeekRetrievals = retrievalsThisWeek?.value ?? 0;
  const lastWeekRetrievals = retrievalsLastWeek?.value ?? 0;

  return [
    {
      label: 'Items saved this week',
      value: String(thisWeekSaves),
      change: formatPercentChange(thisWeekSaves, lastWeekSaves),
      icon: '📥',
    },
    {
      label: 'Collections',
      value: String(collectionCount?.value ?? 0),
      change: `${collectionCount?.value ?? 0} total`,
      icon: '📁',
    },
    {
      label: 'Recent retrievals',
      value: String(thisWeekRetrievals),
      change: formatPercentChange(thisWeekRetrievals, lastWeekRetrievals),
      icon: '🔍',
    },
    {
      label: 'Processing',
      value: String(processingCount?.value ?? 0),
      change:
        (processingCount?.value ?? 0) === 1
          ? '1 in progress'
          : `${processingCount?.value ?? 0} in progress`,
      icon: '⏳',
    },
  ];
}

export async function getMemoryHighlights(teamId: number): Promise<HighlightItem[]> {
  const weekStart = startOfWeek();

  const collectionCounts = await db
    .select({
      name: collections.name,
      icon: collections.icon,
      count: count(),
    })
    .from(saveCollections)
    .innerJoin(collections, eq(saveCollections.collectionId, collections.id))
    .innerJoin(saves, eq(saveCollections.saveId, saves.id))
    .where(and(eq(collections.teamId, teamId), gte(saves.createdAt, weekStart)))
    .groupBy(collections.id, collections.name, collections.icon)
    .orderBy(desc(count()))
    .limit(2);

  const tagCounts = await db
    .select({
      tag: saveTags.tag,
      count: count(),
    })
    .from(saveTags)
    .innerJoin(saves, eq(saveTags.saveId, saves.id))
    .where(and(eq(saves.teamId, teamId), gte(saves.createdAt, weekStart)))
    .groupBy(saveTags.tag)
    .orderBy(desc(count()))
    .limit(2);

  const colors = [
    'bg-violet-50 text-violet-700',
    'bg-blue-50 text-blue-700',
    'bg-orange-50 text-orange-700',
    'bg-pink-50 text-pink-700',
  ];

  const highlights: HighlightItem[] = [];

  for (const [index, row] of collectionCounts.entries()) {
    if ((row.count ?? 0) < 1) continue;
    highlights.push({
      id: `collection-${row.name}`,
      text: `You saved ${row.count} item${row.count === 1 ? '' : 's'} in ${row.name} this week`,
      icon: row.icon ?? '📁',
      color: colors[index % colors.length],
    });
  }

  for (const [index, row] of tagCounts.entries()) {
    if ((row.count ?? 0) < 1) continue;
    highlights.push({
      id: `tag-${row.tag}`,
      text: `${row.count} save${row.count === 1 ? '' : 's'} tagged "${row.tag}" this week`,
      icon: '🏷️',
      color: colors[(index + 2) % colors.length],
    });
  }

  if (highlights.length === 0) {
    return [
      {
        id: 'empty',
        text: 'Save something to Faye to see memory highlights here',
        icon: '✨',
        color: 'bg-violet-50 text-violet-700',
      },
    ];
  }

  return highlights.slice(0, 4);
}

export async function getSearchSuggestions(teamId: number) {
  const searches = await db
    .select({ query: savedSearches.query })
    .from(savedSearches)
    .where(eq(savedSearches.teamId, teamId))
    .orderBy(desc(savedSearches.lastUsedAt), desc(savedSearches.createdAt))
    .limit(4);

  return searches.map((s) => s.query);
}

export async function getUsageSummary(
  teamId: number,
  planName?: string | null
): Promise<UsageSummary> {
  const monthStart = startOfMonth();
  const [used] = await db
    .select({ value: count() })
    .from(saves)
    .where(and(eq(saves.teamId, teamId), gte(saves.createdAt, monthStart)));

  return {
    savesUsed: used?.value ?? 0,
    savesLimit: getSavesLimit(planName),
    planName: planName || 'Free Trial',
  };
}

export async function getSavedSearchesForTeam(teamId: number) {
  return db
    .select()
    .from(savedSearches)
    .where(eq(savedSearches.teamId, teamId))
    .orderBy(desc(savedSearches.lastUsedAt), desc(savedSearches.createdAt));
}

export async function getDashboardHomeData(): Promise<DashboardHomeData> {
  const user = await getUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  const team = await requireTeamId();
  const teamId = team.id;

  const [
    stats,
    recentSaves,
    collectionsList,
    highlights,
    searchSuggestions,
    chatMessages,
    usage,
  ] = await Promise.all([
    getDashboardStats(teamId),
    getRecentSaves(teamId, 4),
    getCollectionsForTeam(teamId),
    getMemoryHighlights(teamId),
    getSearchSuggestions(teamId),
    getLatestChatPreview(teamId),
    getUsageSummary(teamId, team.planName),
  ]);

  return {
    stats,
    recentSaves,
    collections: collectionsList,
    highlights,
    searchSuggestions,
    chatMessages,
    usage,
  };
}

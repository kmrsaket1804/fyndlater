import { db } from '@/lib/db/drizzle';
import { saves } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { getUsageSummary, getRecentSaves } from '@/lib/db/dashboard-queries';
import type { SaveItem } from '@/lib/dashboard/types';

export type CreateSaveLinkInput = {
  kind: 'link';
  url: string;
  note?: string;
};

export type CreateSaveNoteInput = {
  kind: 'note';
  text: string;
};

export type CreateSaveScreenshotInput = {
  kind: 'screenshot';
  imageUrl: string;
  title?: string;
};

export type CreateSaveInput =
  | CreateSaveLinkInput
  | CreateSaveNoteInput
  | CreateSaveScreenshotInput;

const MAX_IMAGE_DATA_URL_LENGTH = 3_000_000;

function inferTypeFromUrl(url: string): 'reel' | 'post' | 'link' {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com/reel') || lower.includes('/reels/')) {
    return 'reel';
  }
  if (
    lower.includes('instagram.com/p/') ||
    lower.includes('instagram.com/tv/')
  ) {
    return 'post';
  }
  return 'link';
}

function inferSourceFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (host.includes('instagram.com')) return 'Instagram';
    return host;
  } catch {
    return 'Link';
  }
}

function titleFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    const label = parsed.hostname.replace(/^www\./, '');
    return `Saved from ${label}`;
  } catch {
    return 'Saved link';
  }
}

function buildSaveFields(input: CreateSaveInput) {
  if (input.kind === 'link') {
    const type = inferTypeFromUrl(input.url);
    const source = inferSourceFromUrl(input.url);
    return {
      type,
      title: titleFromUrl(input.url),
      description:
        input.note?.trim() ||
        'Faye is summarizing this save. Check back in a moment.',
      source,
      sourceUrl: input.url,
      imageUrl: null as string | null,
    };
  }

  if (input.kind === 'note') {
    const text = input.text.trim();
    const title =
      text.length > 80 ? `${text.slice(0, 77)}...` : text || 'New note';
    return {
      type: 'link' as const,
      title,
      description: 'Faye is organizing this note.',
      source: 'Note',
      sourceUrl: null as string | null,
      imageUrl: null as string | null,
    };
  }

  if (input.imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Image is too large. Please use a file under 2 MB.');
  }

  return {
    type: 'screenshot' as const,
    title: input.title?.trim() || 'New screenshot',
    description: 'Faye is analyzing this screenshot.',
    source: 'Screenshot',
    sourceUrl: null as string | null,
    imageUrl: input.imageUrl,
  };
}

export async function createSave(
  input: CreateSaveInput
): Promise<SaveItem> {
  const user = await getUser();
  if (!user) throw new Error('Unauthorized');

  const team = await getTeamForUser();
  if (!team) throw new Error('Team not found');

  const usage = await getUsageSummary(team.id, team.planName);
  if (usage.savesUsed >= usage.savesLimit) {
    throw new Error(
      `You've reached your monthly save limit (${usage.savesLimit}). Upgrade to Pro for more.`
    );
  }

  const fields = buildSaveFields(input);

  const [created] = await db
    .insert(saves)
    .values({
      teamId: team.id,
      userId: user.id,
      type: fields.type,
      title: fields.title,
      description: fields.description,
      source: fields.source,
      sourceUrl: fields.sourceUrl,
      imageUrl: fields.imageUrl,
      status: 'processing',
    })
    .returning();

  const recent = await getRecentSaves(team.id, 1);
  const saved = recent.find((s) => s.id === created.id);

  if (!saved) {
    throw new Error('Failed to load created save');
  }

  return saved;
}

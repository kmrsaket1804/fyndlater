import { getTeamForUser, getUser } from '@/lib/db/queries';
import { getRecentSaves, getUsageSummary } from '@/lib/db/dashboard-queries';
import {
  createSaveForTeam,
  scheduleSaveProcessing,
} from '@/lib/saves/create-save-for-team';
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

  if (input.kind === 'screenshot' && input.imageUrl.length > MAX_IMAGE_DATA_URL_LENGTH) {
    throw new Error('Image is too large. Please use a file under 2 MB.');
  }

  const created = await createSaveForTeam({
    teamId: team.id,
    userId: user.id,
    planName: team.planName,
    input,
  });

  if (input.kind === 'link') {
    try {
      await scheduleSaveProcessing({
        saveId: created.id,
        teamId: team.id,
        userId: user.id,
        sourceUrl: input.url,
      });
    } catch (error) {
      console.error('[reel-pipeline] Failed to schedule save:', error);
    }
  }

  const recent = await getRecentSaves(team.id, 1);
  const saved = recent.find((s) => s.id === created.id);

  if (!saved) {
    throw new Error('Failed to load created save');
  }

  return saved;
}

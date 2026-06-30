import 'server-only';

import { applyReelResultToSave } from './apply-to-save';
import { isReelPipelineConfigured } from './config';
import { getCachedReelRecord } from './cache';
import { enqueueReelProcessing } from './enqueue';
import { extractShortcode, normalizeReelUrl } from './reel-url';

export type ReelScheduleResult =
  | { source: 'cache'; shortcode: string }
  | { source: 'queued'; shortcode?: string; jobId: string; messageId: string }
  | { source: 'skipped' };

/** Apply cached analysis or enqueue a new pipeline job for this save. */
export async function scheduleReelProcessing(params: {
  reelUrl: string;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
}): Promise<ReelScheduleResult> {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[reel-pipeline] Skipping schedule — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return { source: 'skipped' };
  }

  const reelUrl = normalizeReelUrl(params.reelUrl);
  const shortcode = extractShortcode(reelUrl);

  if (shortcode) {
    const cached = await getCachedReelRecord(shortcode);
    if (cached) {
      await applyReelResultToSave(params.saveId, cached, {
        fromCache: true,
        savedItemId: params.savedItemId,
        instagramMessageId: params.instagramMessageId,
      });
      console.info('[reel-pipeline] Reused cached reel analysis', {
        saveId: params.saveId,
        shortcode,
      });
      return { source: 'cache', shortcode };
    }
  }

  const queued = await enqueueReelProcessing({
    ...params,
    reelUrl,
  });

  if (!queued) {
    return { source: 'skipped' };
  }

  return {
    source: 'queued',
    shortcode,
    jobId: queued.jobId,
    messageId: queued.messageId ?? queued.jobId,
  };
}

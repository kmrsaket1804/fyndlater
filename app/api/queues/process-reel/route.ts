import { handleCallback } from '@vercel/queue';
import {
  applyReelResultToSave,
  markSaveReelFailed,
} from '@/lib/reel-pipeline/apply-to-save';
import { getCachedReelRecord } from '@/lib/reel-pipeline/cache';
import { processReelJob } from '@/lib/reel-pipeline/graph';
import type { ReelQueueMessage } from '@/lib/reel-pipeline/queue';
import { extractShortcode } from '@/lib/reel-pipeline/reel-url';

export const runtime = 'nodejs';
export const maxDuration = 300;

export const POST = handleCallback(async (message: ReelQueueMessage) => {
  if (!message?.reelUrl) throw new Error('Queue message missing reelUrl');
  if (!message.jobId) throw new Error('Queue message missing jobId');
  if (!message.saveId) throw new Error('Queue message missing saveId');

  try {
    const shortcode =
      message.dedupeKey ?? extractShortcode(message.reelUrl) ?? undefined;

    if (shortcode) {
      const cached = await getCachedReelRecord(shortcode);
      if (cached) {
        await applyReelResultToSave(message.saveId, cached, {
          fromCache: true,
          savedItemId: message.savedItemId,
          instagramMessageId: message.instagramMessageId,
        });
        console.info('[reel-pipeline] Consumer reused cached reel', {
          saveId: message.saveId,
          shortcode,
        });
        return;
      }
    }

    const record = await processReelJob(message.reelUrl, {
      jobId: message.jobId,
    });
    await applyReelResultToSave(message.saveId, record, {
      savedItemId: message.savedItemId,
      instagramMessageId: message.instagramMessageId,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Reel processing failed';
    await markSaveReelFailed(message.saveId, errorMessage);
    throw error;
  }
});

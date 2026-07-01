import { handleCallback } from '@vercel/queue';
import { notifyReelFailed, notifyReelReady } from '@/lib/meta/reel-notifications';
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

async function notifyIfInstagram(message: ReelQueueMessage, record: Parameters<typeof notifyReelReady>[0]['record'], fromCache?: boolean) {
  if (!message.instagramSenderId) {
    return;
  }

  await notifyReelReady({
    senderIgsid: message.instagramSenderId,
    instagramMessageId: message.instagramMessageId,
    record,
    fromCache,
  });
}

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
        await notifyIfInstagram(message, cached, true);
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
    await notifyIfInstagram(message, record);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Reel processing failed';
    await markSaveReelFailed(message.saveId, errorMessage);

    if (message.instagramSenderId) {
      await notifyReelFailed({
        senderIgsid: message.instagramSenderId,
        instagramMessageId: message.instagramMessageId,
        errorMessage,
        reelUrl: message.reelUrl,
      });
    }

    throw error;
  }
});

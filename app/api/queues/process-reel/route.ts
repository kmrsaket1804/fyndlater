import { handleCallback } from '@vercel/queue';
import { notifyPostFailed, notifyPostReady } from '@/lib/meta/reel-notifications';
import {
  applyPostResultToSave,
  markSavePostFailed,
} from '@/lib/instagram-pipeline/apply-to-save';
import { getCachedPostRecord } from '@/lib/instagram-pipeline/cache';
import { processInstagramPostJob } from '@/lib/instagram-pipeline/router';
import { extractShortcode } from '@/lib/instagram-pipeline/post-url';
import type { PostQueueMessage } from '@/lib/reel-pipeline/queue';

export const runtime = 'nodejs';
export const maxDuration = 300;

function postUrlFromMessage(message: PostQueueMessage) {
  return message.postUrl ?? message.reelUrl;
}

async function notifyIfInstagram(
  message: PostQueueMessage,
  record: Parameters<typeof notifyPostReady>[0]['record'],
  fromCache?: boolean
) {
  if (!message.instagramSenderId) {
    return;
  }

  await notifyPostReady({
    senderIgsid: message.instagramSenderId,
    instagramMessageId: message.instagramMessageId,
    record,
    fromCache,
  });
}

export const POST = handleCallback(async (message: PostQueueMessage) => {
  const postUrl = postUrlFromMessage(message);
  if (!postUrl) throw new Error('Queue message missing postUrl');
  if (!message.jobId) throw new Error('Queue message missing jobId');
  if (!message.saveId) throw new Error('Queue message missing saveId');

  try {
    const shortcode =
      message.dedupeKey ?? extractShortcode(postUrl) ?? undefined;

    if (shortcode) {
      const cached = await getCachedPostRecord(shortcode);
      if (cached) {
        await applyPostResultToSave(message.saveId, cached, {
          fromCache: true,
          savedItemId: message.savedItemId,
          instagramMessageId: message.instagramMessageId,
        });
        console.info('[instagram-pipeline] Consumer reused cached post', {
          saveId: message.saveId,
          shortcode,
        });
        await notifyIfInstagram(message, cached, true);
        return;
      }
    }

    const record = await processInstagramPostJob(postUrl, {
      jobId: message.jobId,
    });
    await applyPostResultToSave(message.saveId, record, {
      savedItemId: message.savedItemId,
      instagramMessageId: message.instagramMessageId,
    });
    await notifyIfInstagram(message, record);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Post processing failed';
    await markSavePostFailed(message.saveId, errorMessage);

    if (message.instagramSenderId) {
      await notifyPostFailed({
        senderIgsid: message.instagramSenderId,
        instagramMessageId: message.instagramMessageId,
        errorMessage,
        postUrl,
      });
    }

    throw error;
  }
});

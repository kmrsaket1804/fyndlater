import { handleCallback } from '@vercel/queue';
import { notifyPostFailed, notifyPostReady } from '@/lib/meta/reel-notifications';
import {
  applyPostResultToSave,
} from '@/lib/instagram-pipeline/apply-to-save';
import { getCachedPostRecord } from '@/lib/instagram-pipeline/cache';
import { processDmPreviewJob } from '@/lib/instagram-pipeline/preview-graph';
import { processInstagramPostJob } from '@/lib/instagram-pipeline/router';
import { extractShortcode } from '@/lib/instagram-pipeline/post-url';
import type { PostQueueMessage } from '@/lib/reel-pipeline/queue';
import {
  getSaveStatus,
  isTerminalSaveStatus,
  markSaveFailedIfProcessing,
} from '@/lib/saves/save-processing';

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
    partialPreview: Boolean(message.dmPreview),
  });
}

async function handleQueueMessage(message: PostQueueMessage) {
  const postUrl = postUrlFromMessage(message);
  if (!postUrl && !message.dmPreview) {
    throw new Error('Queue message missing postUrl or dmPreview');
  }
  if (!message.jobId) throw new Error('Queue message missing jobId');
  if (!message.saveId) throw new Error('Queue message missing saveId');

  const existingStatus = await getSaveStatus(message.saveId);
  if (isTerminalSaveStatus(existingStatus)) {
    console.info('[queue] Skipping already terminal save', {
      saveId: message.saveId,
      status: existingStatus,
      jobId: message.jobId,
    });
    return;
  }

  if (message.dmPreview) {
    const record = await processDmPreviewJob(message.dmPreview, {
      jobId: message.jobId,
    });
    await applyPostResultToSave(message.saveId, record, {
      savedItemId: message.savedItemId,
      instagramMessageId: message.instagramMessageId,
    });
    await notifyIfInstagram(message, record);
    return;
  }

  const shortcode =
    message.dedupeKey ?? extractShortcode(postUrl!) ?? undefined;

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

  const record = await processInstagramPostJob(postUrl!, {
    jobId: message.jobId,
  });
  await applyPostResultToSave(message.saveId, record, {
    savedItemId: message.savedItemId,
    instagramMessageId: message.instagramMessageId,
  });
  await notifyIfInstagram(message, record);
}

export const POST = handleCallback(async (message: PostQueueMessage) => {
  try {
    await handleQueueMessage(message);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Post processing failed';

    const newlyFailed = await markSaveFailedIfProcessing(
      message.saveId,
      errorMessage
    );

    if (!newlyFailed) {
      console.warn('[queue] Processing failed after save already terminal', {
        saveId: message.saveId,
        errorMessage,
      });
      return;
    }

    if (message.instagramSenderId) {
      await notifyPostFailed({
        senderIgsid: message.instagramSenderId,
        instagramMessageId: message.instagramMessageId,
        errorMessage,
        postUrl: postUrlFromMessage(message) ?? undefined,
      });
    }

    console.error('[queue] Job failed (acknowledged, no retry)', {
      saveId: message.saveId,
      jobId: message.jobId,
      errorMessage,
    });
  }
});

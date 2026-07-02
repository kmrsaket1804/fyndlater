import 'server-only';

import { randomUUID } from 'node:crypto';
import { send } from '@vercel/queue';
import { isReelPipelineConfigured } from '../reel-pipeline/config';
import type { DmSharePreview } from '../meta/shared-post-types';
import { REEL_JOBS_TOPIC, type PostQueueMessage } from '../reel-pipeline/queue';
import { extractShortcode, normalizeInstagramPostUrl } from './post-url';

export async function enqueuePostProcessing(params: {
  postUrl: string;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
}) {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[instagram-pipeline] Skipping enqueue — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return null;
  }

  const postUrl = normalizeInstagramPostUrl(params.postUrl);
  const jobId = randomUUID();
  const dedupeKey = extractShortcode(postUrl);
  const message: PostQueueMessage = {
    postUrl,
    reelUrl: postUrl,
    jobId,
    saveId: params.saveId,
    teamId: params.teamId,
    userId: params.userId,
    dedupeKey,
    savedItemId: params.savedItemId,
    instagramMessageId: params.instagramMessageId,
    instagramSenderId: params.instagramSenderId,
  };

  const idempotencyKey = `save:${params.saveId}:${dedupeKey ?? jobId}`;

  const { messageId } = await send(REEL_JOBS_TOPIC, message, {
    idempotencyKey,
  });

  console.info('[instagram-pipeline] Enqueued post job', {
    saveId: params.saveId,
    jobId,
    messageId,
    dedupeKey,
    postUrl,
  });

  return { messageId, jobId, dedupeKey };
}

export async function enqueueDmPreviewProcessing(params: {
  preview: DmSharePreview;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
}) {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[instagram-pipeline] Skipping preview enqueue — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return null;
  }

  const jobId = randomUUID();
  const dedupeKey = params.preview.mediaId
    ? `dm-preview:${params.preview.mediaId}`
    : undefined;

  const message: PostQueueMessage = {
    dmPreview: params.preview,
    jobId,
    saveId: params.saveId,
    teamId: params.teamId,
    userId: params.userId,
    dedupeKey,
    savedItemId: params.savedItemId,
    instagramMessageId: params.instagramMessageId,
    instagramSenderId: params.instagramSenderId,
  };

  const idempotencyKey = `save:${params.saveId}:${dedupeKey ?? jobId}`;

  const { messageId } = await send(REEL_JOBS_TOPIC, message, {
    idempotencyKey,
  });

  console.info('[instagram-pipeline] Enqueued DM preview job', {
    saveId: params.saveId,
    jobId,
    messageId,
    mediaId: params.preview.mediaId,
    attachmentType: params.preview.attachmentType,
  });

  return { messageId, jobId, dedupeKey };
}

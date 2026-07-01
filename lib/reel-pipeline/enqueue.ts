import 'server-only';

import { randomUUID } from 'node:crypto';
import { send } from '@vercel/queue';
import { isReelPipelineConfigured } from './config';
import { REEL_JOBS_TOPIC, type ReelQueueMessage } from './queue';
import { extractShortcode, normalizeReelUrl } from './reel-url';

export async function enqueueReelProcessing(params: {
  reelUrl: string;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
}) {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[reel-pipeline] Skipping enqueue — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return null;
  }

  const reelUrl = normalizeReelUrl(params.reelUrl);
  const jobId = randomUUID();
  const dedupeKey = extractShortcode(reelUrl);
  const message: ReelQueueMessage = {
    reelUrl,
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

  console.info('[reel-pipeline] Enqueued reel job', {
    saveId: params.saveId,
    jobId,
    messageId,
    dedupeKey,
  });

  return { messageId, jobId, dedupeKey };
}

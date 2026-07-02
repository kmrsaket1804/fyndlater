import 'server-only';

import { applyPostResultToSave } from './apply-to-save';
import { getCachedPostRecord } from './cache';
import { enqueueDmPreviewProcessing, enqueuePostProcessing } from './enqueue';
import type { DmSharePreview } from '../meta/shared-post-types';
import { extractShortcode, normalizeInstagramPostUrl } from './post-url';
import { isProcessedPostRecord, type ProcessedSaveRecord } from './router';
import { isReelPipelineConfigured } from '../reel-pipeline/config';

export type PostScheduleResult =
  | { source: 'cache'; shortcode: string; record: ProcessedSaveRecord }
  | { source: 'queued'; shortcode?: string; jobId: string; messageId: string }
  | { source: 'skipped' };

/** Apply cached analysis or enqueue a pipeline job for any Instagram post URL. */
export async function schedulePostProcessing(params: {
  postUrl: string;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
}): Promise<PostScheduleResult> {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[instagram-pipeline] Skipping schedule — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return { source: 'skipped' };
  }

  const postUrl = normalizeInstagramPostUrl(params.postUrl);
  const shortcode = extractShortcode(postUrl);

  if (shortcode) {
    const cached = await getCachedPostRecord(shortcode);
    if (cached) {
      await applyPostResultToSave(params.saveId, cached, {
        fromCache: true,
        savedItemId: params.savedItemId,
        instagramMessageId: params.instagramMessageId,
      });
      console.info('[instagram-pipeline] Reused cached post analysis', {
        saveId: params.saveId,
        shortcode,
        postKind: isProcessedPostRecord(cached) ? cached.postKind : 'reel',
      });
      return { source: 'cache', shortcode, record: cached };
    }
  }

  const queued = await enqueuePostProcessing({
    ...params,
    postUrl,
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

/** Enqueue vision analysis for an Instagram DM share preview (CDN image only). */
export async function scheduleDmPreviewProcessing(params: {
  preview: DmSharePreview;
  saveId: number;
  teamId: number;
  userId?: number;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
}): Promise<PostScheduleResult> {
  if (!isReelPipelineConfigured()) {
    console.warn(
      '[instagram-pipeline] Skipping preview schedule — APIFY_TOKEN or OPENAI_API_KEY not set'
    );
    return { source: 'skipped' };
  }

  const queued = await enqueueDmPreviewProcessing(params);
  if (!queued) {
    return { source: 'skipped' };
  }

  return {
    source: 'queued',
    shortcode: params.preview.mediaId,
    jobId: queued.jobId,
    messageId: queued.messageId ?? queued.jobId,
  };
}

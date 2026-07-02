import 'server-only';

import path from 'node:path';
import { processReelJob } from '../reel-pipeline/graph';
import type { FinalRecord } from '@/lib/reel-pipeline/types';
import { ensureDir, writeJson } from '../reel-pipeline/utils';
import { getRunsDir } from '../reel-pipeline/runs-dir';
import { detectPostKind } from './apify-post';
import { processCarouselJob } from './carousel-graph';
import { processImageJob } from './image-graph';
import { inferUrlPipelineKind, normalizeInstagramPostUrl } from './post-url';
import {
  isProcessedPostRecord,
  postUrlFromRecord,
  type ProcessedSaveRecord,
} from './processed-save';
import { scrapeInstagramPostViaApify } from './scrape';
import type { PostKind, ProcessedPostRecord } from './types';

export type { ProcessedSaveRecord } from './processed-save';
export { isProcessedPostRecord, postUrlFromRecord } from './processed-save';

export function postKindFromRecord(record: ProcessedSaveRecord): PostKind {
  if (isProcessedPostRecord(record)) {
    return record.postKind;
  }
  return 'reel';
}

export async function processInstagramPostJob(
  postUrl: string,
  options?: { jobId?: string }
): Promise<ProcessedSaveRecord> {
  const normalized = normalizeInstagramPostUrl(postUrl);
  const urlKind = inferUrlPipelineKind(normalized);

  if (urlKind === 'reel') {
    return processReelJob(normalized, { jobId: options?.jobId });
  }

  const jobId = options?.jobId;
  const runDir = path.join(getRunsDir(), jobId ?? 'prefetch');
  if (jobId) {
    await ensureDir(runDir);
  }

  const apifyItems = await scrapeInstagramPostViaApify(
    normalized,
    jobId ? runDir : path.join(getRunsDir(), 'prefetch')
  );
  if (!apifyItems.length) {
    throw new Error('Apify returned no dataset items');
  }

  const kind = detectPostKind(apifyItems[0]);
  if (jobId) {
    await writeJson(path.join(runDir, 'apify-items.json'), apifyItems);
  }

  if (kind === 'carousel') {
    return processCarouselJob(normalized, { jobId, apifyItems });
  }

  if (kind === 'image') {
    return processImageJob(normalized, { jobId, apifyItems });
  }

  return processReelJob(normalized, { jobId });
}

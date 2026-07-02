import 'server-only';

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { scrapeInstagramPostViaApify } from '@/lib/instagram-pipeline/scrape';
import { getRunsDir } from '@/lib/reel-pipeline/runs-dir';
import { asString } from '@/lib/reel-pipeline/utils';
import { buildCanonicalKeyFromUrl } from './canonical-key';
import {
  confidenceFromScore,
  scoreMergeMatch,
  type MergeConfidence,
} from './merge-scoring';
import {
  findAwaitingLinkSaves,
  MERGE_WINDOW_MS,
  updateSaveEnrichment,
} from './save-queries';
import { normalizeInstagramPostUrl } from '@/lib/instagram-pipeline/post-url';

export type { MergeConfidence } from './merge-scoring';
export { isMergeConfirmationText } from './merge-scoring';

export type MergeCandidateResult =
  | { action: 'none' }
  | {
      action: 'upgrade';
      targetSaveId: number;
      confidence: MergeConfidence;
      score: number;
    }
  | {
      action: 'confirm';
      targetSaveId: number;
      candidateUrl: string;
      confidence: MergeConfidence;
      score: number;
    }
  | {
      action: 'separate';
      confidence: MergeConfidence;
      score: number;
    };

export async function evaluateMergeCandidate(params: {
  userId: number;
  postUrl: string;
}): Promise<MergeCandidateResult> {
  const pending = await findAwaitingLinkSaves(params.userId);
  if (!pending.length) {
    return { action: 'none' };
  }

  const postUrl = normalizeInstagramPostUrl(params.postUrl);
  const canonicalKey = buildCanonicalKeyFromUrl(postUrl);
  if (!canonicalKey) {
    return { action: 'none' };
  }

  let apifyCaption: string | null = null;
  try {
    const runDir = path.join(getRunsDir(), `merge-${randomUUID()}`);
    const items = await scrapeInstagramPostViaApify(postUrl, runDir);
    const item = items[0];
    if (item) {
      apifyCaption =
        asString(item.caption)?.trim() ||
        asString(item.title)?.trim() ||
        asString(item.description)?.trim() ||
        null;
    }
  } catch (error) {
    console.warn('[meta] Merge scoring Apify fetch failed', error);
  }

  const target = pending[0];
  const metadata = (target.metadata ?? {}) as Record<string, unknown>;
  const previewCaption =
    (metadata.previewCaption as string | undefined) ??
    target.description ??
    null;
  const previewSummary = (metadata.previewSummary as string | undefined) ?? null;
  const minutesSincePreview =
    (Date.now() - new Date(target.createdAt).getTime()) / 60_000;

  const score = scoreMergeMatch({
    previewCaption,
    previewSummary,
    apifyCaption,
    minutesSincePreview,
    pendingCount: pending.length,
  });
  const confidence = confidenceFromScore(score);

  if (pending.length > 1 && confidence !== 'high') {
    return { action: 'separate', confidence, score };
  }

  if (confidence === 'high') {
    return {
      action: 'upgrade',
      targetSaveId: target.id,
      confidence,
      score,
    };
  }

  if (confidence === 'medium') {
    return {
      action: 'confirm',
      targetSaveId: target.id,
      candidateUrl: postUrl,
      confidence,
      score,
    };
  }

  return { action: 'separate', confidence, score };
}

export async function markPendingMergeConfirmation(
  saveId: number,
  candidateUrl: string
) {
  await updateSaveEnrichment(saveId, {
    metadata: {
      pendingMerge: {
        candidateUrl,
        expiresAt: new Date(Date.now() + MERGE_WINDOW_MS).toISOString(),
      },
    },
  });
}

export async function clearPendingMergeConfirmation(saveId: number) {
  await updateSaveEnrichment(saveId, {
    metadata: {
      pendingMerge: null,
    },
  });
}

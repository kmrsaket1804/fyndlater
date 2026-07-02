import type { ProcessedSaveRecord } from '@/lib/instagram-pipeline/router';
import {
  isProcessedPostRecord,
  postKindFromRecord,
  postUrlFromRecord,
} from '@/lib/instagram-pipeline/router';
import { extractShortcode } from '@/lib/instagram-pipeline/post-url';
import { instagramPostPathFromUrl } from './instagram-dm-url';
import { userFacingProcessingError } from './user-facing-errors';
import { sendInstagramMessage } from './send-message';

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function titleFromRecord(record: ProcessedSaveRecord) {
  const summary = record.visualAnalysis.summary.trim();
  if (summary) {
    return truncate(summary, 120);
  }

  const caption = record.metadata.caption?.trim();
  if (caption) {
    return truncate(caption, 120);
  }

  const kind = postKindFromRecord(record);
  if (kind === 'carousel') return 'Your carousel';
  if (kind === 'image') return 'Your image post';
  return 'Your reel';
}

function tagsFromRecord(record: ProcessedSaveRecord) {
  return Array.from(
    new Set(
      record.visualAnalysis.tags.map((tag) => tag.trim()).filter(Boolean)
    )
  ).slice(0, 5);
}

function readyHeader(record: ProcessedSaveRecord, fromCache?: boolean) {
  const kind = postKindFromRecord(record);
  if (kind === 'carousel') {
    const slideCount = isProcessedPostRecord(record)
      ? record.slides?.length ?? record.metadata.slideCount
      : undefined;
    const countLabel = slideCount ? `${slideCount}-slide ` : '';
    return fromCache
      ? "Done ✨ I already knew this one, so I've added it to your memory."
      : `Done ✨ Your ${countLabel}carousel is saved and analyzed.`;
  }

  if (kind === 'image') {
    return fromCache
      ? "Done ✨ I already knew this one, so I've added it to your memory."
      : 'Done ✨ Your image post is saved and analyzed.';
  }

  return fromCache
    ? "Done ✨ I already knew this one, so I've added it to your memory."
    : 'Done ✨ Your reel is saved and analyzed.';
}

export function formatPostReadyMessage(
  record: ProcessedSaveRecord,
  options?: { fromCache?: boolean; partialPreview?: boolean }
) {
  const title = titleFromRecord(record);
  const tags = tagsFromRecord(record);
  const shortcode = extractShortcode(postUrlFromRecord(record));
  const kind = postKindFromRecord(record);

  const header = options?.partialPreview
    ? 'Done ✨ Saved from what Instagram shared. Send the post link anytime if you want the full version too.'
    : readyHeader(record, options?.fromCache);

  const lines = [header, '', `"${title}"`];

  if (tags.length) {
    lines.push('', `Tags: ${tags.join(', ')}`);
  }

  if (shortcode) {
    const path = instagramPostPathFromUrl(postUrlFromRecord(record), kind);
    if (path) {
      lines.push('', `Post: ${path}`);
    }
  }

  return truncate(lines.join('\n'), 950);
}

export function formatPostFailedMessage(
  errorMessage?: string,
  postKind?: 'reel' | 'image' | 'carousel'
) {
  const label =
    postKind === 'carousel'
      ? 'carousel'
      : postKind === 'image'
        ? 'image post'
        : 'reel';

  const detail = userFacingProcessingError(errorMessage);

  const lines = [
    `Couldn't finish analyzing this ${label} ✨`,
    detail ? `\n${detail}` : '',
    '\nTry sending it again in a moment.',
  ];

  return truncate(lines.join(''), 950);
}

export function formatPostContextLabel(record: ProcessedSaveRecord) {
  const shortcode = extractShortcode(postUrlFromRecord(record));
  const kind = postKindFromRecord(record);

  if (shortcode) {
    if (kind === 'reel') return `Re: reel /${shortcode}`;
    if (kind === 'carousel') return `Re: carousel /${shortcode}`;
    return `Re: post /${shortcode}`;
  }

  return `Re: ${titleFromRecord(record)}`;
}

export async function notifyPostReady(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  record: ProcessedSaveRecord;
  fromCache?: boolean;
  partialPreview?: boolean;
}) {
  const text = formatPostReadyMessage(params.record, {
    fromCache: params.fromCache,
    partialPreview: params.partialPreview,
  });

  return sendInstagramMessage(params.senderIgsid, text, {
    replyToMessageId: params.instagramMessageId,
    contextLabel: formatPostContextLabel(params.record),
  });
}

export async function notifyPostFailed(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  errorMessage?: string;
  postUrl?: string;
  postKind?: 'reel' | 'image' | 'carousel';
}) {
  const shortcode = params.postUrl
    ? extractShortcode(params.postUrl)
    : undefined;
  const kind = params.postKind ?? 'reel';
  const contextLabel = shortcode
    ? kind === 'reel'
      ? `Re: reel /${shortcode}`
      : kind === 'carousel'
        ? `Re: carousel /${shortcode}`
        : `Re: post /${shortcode}`
    : kind === 'carousel'
      ? 'Re: your carousel'
      : kind === 'image'
        ? 'Re: your image post'
        : 'Re: your reel';

  return sendInstagramMessage(
    params.senderIgsid,
    formatPostFailedMessage(params.errorMessage, kind),
    {
      replyToMessageId: params.instagramMessageId,
      contextLabel,
    }
  );
}

/** @deprecated Use notifyPostReady */
export async function notifyReelReady(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  record: ProcessedSaveRecord;
  fromCache?: boolean;
}) {
  return notifyPostReady(params);
}

/** @deprecated Use notifyPostFailed */
export async function notifyReelFailed(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  errorMessage?: string;
  reelUrl?: string;
}) {
  return notifyPostFailed({
    ...params,
    postUrl: params.reelUrl,
  });
}

/** @deprecated Use formatPostReadyMessage */
export function formatReelReadyMessage(
  record: ProcessedSaveRecord,
  options?: { fromCache?: boolean }
) {
  return formatPostReadyMessage(record, options);
}

/** @deprecated Use formatPostFailedMessage */
export function formatReelFailedMessage(errorMessage?: string) {
  return formatPostFailedMessage(errorMessage, 'reel');
}

/** @deprecated Use formatPostContextLabel */
export function formatReelContextLabel(record: ProcessedSaveRecord) {
  return formatPostContextLabel(record);
}

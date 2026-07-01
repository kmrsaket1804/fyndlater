import type { FinalRecord } from '@/lib/reel-pipeline/types';
import { extractShortcode } from '@/lib/reel-pipeline/reel-url';
import { sendInstagramMessage } from './send-message';

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function titleFromRecord(record: FinalRecord) {
  const summary = record.visualAnalysis.summary.trim();
  if (summary) {
    return truncate(summary, 120);
  }

  const caption = record.metadata.caption?.trim();
  if (caption) {
    return truncate(caption, 120);
  }

  return 'Your reel';
}

function tagsFromRecord(record: FinalRecord) {
  return Array.from(
    new Set(
      record.visualAnalysis.tags
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  ).slice(0, 5);
}

export function formatReelReadyMessage(
  record: FinalRecord,
  options?: { fromCache?: boolean }
) {
  const title = titleFromRecord(record);
  const tags = tagsFromRecord(record);
  const shortcode = extractShortcode(record.reelUrl);
  const header = options?.fromCache
    ? 'Done ✨ I already had this reel — added to your library.'
    : 'Done ✨ Your reel is saved and analyzed.';

  const lines = [header, '', `"${title}"`];

  if (tags.length) {
    lines.push('', `Tags: ${tags.join(', ')}`);
  }

  if (shortcode) {
    lines.push('', `Reel: instagram.com/reel/${shortcode}`);
  }

  return truncate(lines.join('\n'), 950);
}

export function formatReelFailedMessage(errorMessage?: string) {
  const detail = errorMessage?.trim()
    ? truncate(errorMessage.trim(), 160)
    : null;

  const lines = [
    "Couldn't finish analyzing this reel ✨",
    detail ? `\n${detail}` : '',
    '\nTry sending it again in a moment.',
  ];

  return truncate(lines.join(''), 950);
}

export function formatReelContextLabel(record: FinalRecord) {
  const shortcode = extractShortcode(record.reelUrl);
  if (shortcode) {
    return `Re: reel /${shortcode}`;
  }
  return `Re: ${titleFromRecord(record)}`;
}

export async function notifyReelReady(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  record: FinalRecord;
  fromCache?: boolean;
}) {
  const text = formatReelReadyMessage(params.record, {
    fromCache: params.fromCache,
  });

  return sendInstagramMessage(params.senderIgsid, text, {
    replyToMessageId: params.instagramMessageId,
    contextLabel: formatReelContextLabel(params.record),
  });
}

export async function notifyReelFailed(params: {
  senderIgsid: string;
  instagramMessageId?: string;
  errorMessage?: string;
  reelUrl?: string;
}) {
  const shortcode = params.reelUrl
    ? extractShortcode(params.reelUrl)
    : undefined;
  const contextLabel = shortcode
    ? `Re: reel /${shortcode}`
    : 'Re: your reel';

  return sendInstagramMessage(
    params.senderIgsid,
    formatReelFailedMessage(params.errorMessage),
    {
      replyToMessageId: params.instagramMessageId,
      contextLabel,
    }
  );
}

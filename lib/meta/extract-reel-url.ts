import type { NormalizedInstagramEvent } from './types';

const REEL_URL_REGEX =
  /https?:\/\/(?:www\.)?instagram\.com\/reel\/[A-Za-z0-9_-]+\/?/gi;

const REEL_SHORTCODE_REGEX = /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i;

function reelUrlFromShortcode(shortcode: string) {
  return `https://www.instagram.com/reel/${shortcode}/`;
}

function normalizeExtractedUrl(url: string) {
  return url.replace(/\?.*$/, '').replace(/\/$/, '') + '/';
}

function extractFromText(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(REEL_URL_REGEX);
  if (!match?.[0]) return null;
  return normalizeExtractedUrl(match[0]);
}

function extractFromPayload(payload: Record<string, unknown> | undefined) {
  if (!payload) return null;

  const urlCandidates = [
    payload.url,
    payload.link,
    payload.permalink,
    payload.share_url,
    payload.reel_url,
  ];

  for (const candidate of urlCandidates) {
    if (typeof candidate === 'string' && REEL_SHORTCODE_REGEX.test(candidate)) {
      return normalizeExtractedUrl(candidate);
    }
  }

  const shortcode =
    (typeof payload.reel_video_id === 'string' && payload.reel_video_id) ||
    (typeof payload.shortcode === 'string' && payload.shortcode) ||
    (typeof payload.id === 'string' && payload.id);

  if (shortcode && /^[A-Za-z0-9_-]+$/.test(shortcode)) {
    return reelUrlFromShortcode(shortcode);
  }

  return null;
}

/** Extract an Instagram reel URL from DM text or shared-post attachments. */
export function extractReelUrlFromInstagramEvent(
  event: NormalizedInstagramEvent
): string | null {
  const fromText = extractFromText(event.text);
  if (fromText) return fromText;

  for (const attachment of event.attachments) {
    if (attachment.url) {
      const fromAttachmentUrl = extractFromText(attachment.url);
      if (fromAttachmentUrl) return fromAttachmentUrl;
    }

    const fromPayload = extractFromPayload(attachment.payload);
    if (fromPayload) return fromPayload;
  }

  return null;
}

export function isSaveableInstagramContent(event: NormalizedInstagramEvent) {
  if (extractReelUrlFromInstagramEvent(event)) {
    return true;
  }

  if (event.message_type === 'shared_post') {
    return true;
  }

  if (event.text?.trim()) {
    return true;
  }

  return ['image', 'video', 'audio'].includes(event.message_type);
}

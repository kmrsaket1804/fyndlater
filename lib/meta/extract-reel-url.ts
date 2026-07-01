import type { NormalizedInstagramEvent } from './types';

const INSTAGRAM_POST_URL_REGEX =
  /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[A-Za-z0-9_-]+\/?/gi;

const INSTAGRAM_SHORTCODE_REGEX =
  /instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i;

function postUrlFromShortcode(shortcode: string, kind: 'reel' | 'p' | 'tv' = 'p') {
  return `https://www.instagram.com/${kind}/${shortcode}/`;
}

function normalizeExtractedUrl(url: string) {
  return url.replace(/\?.*$/, '').replace(/\/$/, '') + '/';
}

function extractFromText(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(INSTAGRAM_POST_URL_REGEX);
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
    payload.media_url,
  ];

  for (const candidate of urlCandidates) {
    if (typeof candidate === 'string' && INSTAGRAM_SHORTCODE_REGEX.test(candidate)) {
      return normalizeExtractedUrl(candidate);
    }
  }

  const shortcode =
    (typeof payload.reel_video_id === 'string' && payload.reel_video_id) ||
    (typeof payload.shortcode === 'string' && payload.shortcode) ||
    (typeof payload.id === 'string' && payload.id);

  if (shortcode && /^[A-Za-z0-9_-]+$/.test(shortcode)) {
    const productType =
      typeof payload.product_type === 'string'
        ? payload.product_type.toLowerCase()
        : '';
    const kind =
      productType.includes('reel') || productType.includes('clip')
        ? 'reel'
        : 'p';
    return postUrlFromShortcode(shortcode, kind);
  }

  return null;
}

/** Extract an Instagram post URL (/p/, /reel/, /tv/) from DM text or attachments. */
export function extractInstagramPostUrlFromEvent(
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

/** @deprecated Use extractInstagramPostUrlFromEvent */
export function extractReelUrlFromInstagramEvent(
  event: NormalizedInstagramEvent
): string | null {
  return extractInstagramPostUrlFromEvent(event);
}

export function isSaveableInstagramContent(event: NormalizedInstagramEvent) {
  if (extractInstagramPostUrlFromEvent(event)) {
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

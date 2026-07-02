import type { InstagramAttachment, NormalizedInstagramEvent } from './types';

const INSTAGRAM_POST_URL_REGEX =
  /https?:\/\/(?:www\.)?instagram\.com\/(?:reel|p|tv)\/[A-Za-z0-9_-]+\/?/gi;

const INSTAGRAM_SHORTCODE_REGEX =
  /instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i;

const LOOKASIDE_ASSET_REGEX = /[?&]asset_id=(\d+)/i;

function postUrlFromShortcode(
  shortcode: string,
  kind: 'reel' | 'p' | 'tv' = 'p'
) {
  return `https://www.instagram.com/${kind}/${shortcode}/`;
}

export function normalizeExtractedUrl(url: string) {
  return url.replace(/\?.*$/, '').replace(/\/$/, '') + '/';
}

function looksLikeInstagramShortcode(value: string) {
  return (
    /^[A-Za-z0-9_-]{5,15}$/.test(value) &&
    !/^\d+$/.test(value) &&
    /[A-Za-z]/.test(value)
  );
}

function extractFromText(text: string | null): string | null {
  if (!text) return null;
  const match = text.match(INSTAGRAM_POST_URL_REGEX);
  if (!match?.[0]) return null;
  return normalizeExtractedUrl(match[0]);
}

export function isInstagramPermalink(url: string) {
  return INSTAGRAM_SHORTCODE_REGEX.test(url);
}

export function extractDirectMediaFromEvent(event: NormalizedInstagramEvent) {
  for (const attachment of event.attachments) {
    const type = attachment.type.toLowerCase();
    if (!['image', 'video'].includes(type)) {
      continue;
    }

    const mediaUrl =
      readString(attachment.payload?.url) ?? readString(attachment.url);
    if (!mediaUrl || isInstagramPermalink(mediaUrl)) {
      continue;
    }

    return {
      previewUrl: mediaUrl,
      attachmentType: type,
    };
  }

  return null;
}

export function extractDmSharePreviewFromEvent(
  event: NormalizedInstagramEvent
) {
  for (const attachment of event.attachments) {
    const type = attachment.type.toLowerCase();
    if (!['ig_post', 'post', 'share'].includes(type)) {
      continue;
    }

    const payload = attachment.payload;
    const previewUrl =
      readString(payload?.url) ?? readString(attachment.url);
    if (!previewUrl || isInstagramPermalink(previewUrl)) {
      continue;
    }

    return {
      previewUrl,
      caption: readString(payload?.title),
      mediaId:
        readString(payload?.ig_post_media_id) ??
        readString(payload?.id) ??
        mediaIdFromUrl(previewUrl),
      attachmentType: type,
    };
  }

  return null;
}

function mediaIdFromUrl(url: string): string | undefined {
  const assetMatch = url.match(LOOKASIDE_ASSET_REGEX);
  if (assetMatch?.[1]) {
    return assetMatch[1];
  }
  return undefined;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
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
    payload.href,
  ];

  for (const candidate of urlCandidates) {
    const url = readString(candidate);
    if (!url) continue;

    if (isInstagramPermalink(url)) {
      return normalizeExtractedUrl(url);
    }
  }

  const shortcode =
    readString(payload.shortcode) ?? readString(payload.short_code);

  if (shortcode && looksLikeInstagramShortcode(shortcode)) {
    const productType = readString(payload.product_type)?.toLowerCase() ?? '';
    const kind =
      productType.includes('reel') || productType.includes('clip')
        ? 'reel'
        : 'p';
    return postUrlFromShortcode(shortcode, kind);
  }

  const reelVideoId = readString(payload.reel_video_id);
  if (reelVideoId && looksLikeInstagramShortcode(reelVideoId)) {
    return postUrlFromShortcode(reelVideoId, 'reel');
  }

  return null;
}

function extractMediaIdFromAttachment(
  attachment: InstagramAttachment
): string | undefined {
  const payload = attachment.payload;
  if (!payload) {
    return attachment.url ? mediaIdFromUrl(attachment.url) : undefined;
  }

  const idCandidates = [
    payload.id,
    payload.ig_post_media_id,
    payload.media_id,
    payload.asset_id,
    payload.reel_video_id,
  ];

  for (const candidate of idCandidates) {
    const value = readString(candidate);
    if (value && /^\d+$/.test(value)) {
      return value;
    }
  }

  const url = readString(payload.url) ?? readString(attachment.url);
  if (url) {
    return mediaIdFromUrl(url);
  }

  return undefined;
}

/** Extract a direct instagram.com post URL when present in text or attachments. */
export function extractInstagramPostUrlFromEvent(
  event: NormalizedInstagramEvent
): string | null {
  const fromText = extractFromText(event.text);
  if (fromText) return fromText;

  for (const attachment of event.attachments) {
    if (attachment.url && isInstagramPermalink(attachment.url)) {
      return normalizeExtractedUrl(attachment.url);
    }

    const fromPayload = extractFromPayload(attachment.payload);
    if (fromPayload) return fromPayload;

    if (attachment.url) {
      const fromAttachmentUrl = extractFromText(attachment.url);
      if (fromAttachmentUrl) return fromAttachmentUrl;
    }
  }

  return null;
}

/** Media/asset id for Graph API permalink lookup when no direct URL is available. */
export function extractMediaReferenceFromEvent(
  event: NormalizedInstagramEvent
): string | null {
  for (const attachment of event.attachments) {
    const type = attachment.type.toLowerCase();
    if (
      ![
        'share',
        'ig_post',
        'post',
        'ig_reel',
        'reel',
        'story_mention',
        'template',
        'fallback',
      ].includes(type)
    ) {
      continue;
    }

    const mediaId = extractMediaIdFromAttachment(attachment);
    if (mediaId) {
      return mediaId;
    }
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

  if (extractMediaReferenceFromEvent(event)) {
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

export function hasProcessableInstagramAttachments(
  event: NormalizedInstagramEvent
) {
  return event.attachments.some((attachment) => {
    const type = attachment.type.toLowerCase();
    return [
      'share',
      'ig_post',
      'post',
      'ig_reel',
      'reel',
      'story_mention',
      'image',
      'video',
      'template',
      'fallback',
    ].includes(type);
  });
}

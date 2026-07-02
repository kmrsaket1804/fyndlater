import {
  extractShortcode,
  inferUrlPipelineKind,
  isFeedPostUrl,
} from '@/lib/instagram-pipeline/post-url';

export type EnrichmentStatus =
  | 'pending'
  | 'full'
  | 'asset_only'
  | 'awaiting_link';

export const PROCESSING_VERSION = 1;

/** Stable global dedupe key for permalink-based Instagram content. */
export function buildCanonicalKeyFromUrl(url: string): string | null {
  const shortcode = extractShortcode(url);
  if (!shortcode) return null;

  const kind = inferUrlPipelineKind(url);
  if (kind === 'reel') {
    return `instagram:reel:${shortcode}`;
  }
  if (kind === 'feed_post' || isFeedPostUrl(url)) {
    return `instagram:post:${shortcode}`;
  }
  return null;
}

/** After Apify detects carousel, refine the canonical key. */
export function carouselCanonicalKey(shortcode: string) {
  return `instagram:carousel:${shortcode}`;
}

export function isPermalinkCanonicalKey(key: string) {
  return key.startsWith('instagram:reel:') || key.startsWith('instagram:post:') || key.startsWith('instagram:carousel:');
}

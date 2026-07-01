const INSTAGRAM_POST_REGEX =
  /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[^/?#]+/i;

const SHORTCODE_REGEX = /instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i;

export function isInstagramPostUrl(url: string): boolean {
  return INSTAGRAM_POST_REGEX.test(url.trim());
}

export function isReelUrl(url: string): boolean {
  return /instagram\.com\/reel\//i.test(url.trim());
}

export function isFeedPostUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('instagram.com/p/') || lower.includes('instagram.com/tv/')
  );
}

export function extractShortcode(url: string): string | undefined {
  const match = url.match(SHORTCODE_REGEX);
  return match?.[1];
}

export function normalizeInstagramPostUrl(url: string): string {
  const trimmed = url.trim();
  if (!isInstagramPostUrl(trimmed)) {
    throw new Error('URL must be an Instagram post link (/p/, /reel/, or /tv/)');
  }
  return trimmed.replace(/\?.*$/, '').replace(/\/$/, '') + '/';
}

export function inferUrlPipelineKind(
  url: string
): 'reel' | 'feed_post' | null {
  if (isReelUrl(url)) return 'reel';
  if (isFeedPostUrl(url)) return 'feed_post';
  return null;
}

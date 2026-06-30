const REEL_URL_PATTERN = /^https?:\/\/(www\.)?instagram\.com\/reel\/[^/?#]+/i;

export function isReelUrl(url: string): boolean {
  return REEL_URL_PATTERN.test(url.trim());
}

export function extractShortcode(url: string): string | undefined {
  const match = url.match(/instagram\.com\/reel\/([^/?#]+)/i);
  return match?.[1];
}

export function normalizeReelUrl(url: string): string {
  const trimmed = url.trim();
  if (!isReelUrl(trimmed)) {
    throw new Error('URL must be an Instagram reel link');
  }
  return trimmed;
}

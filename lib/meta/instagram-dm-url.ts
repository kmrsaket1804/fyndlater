import { extractShortcode } from '@/lib/instagram-pipeline/post-url';

/** Zero-width space — breaks server-side link unfurling in Instagram DMs. */
const ZWSP = '\u200b';

function breakDomainForDm(url: string) {
  return url.replace(/\./g, `${ZWSP}.`);
}

/**
 * Format a URL for Instagram DMs so the client still linkifies it in-app,
 * but Meta's unfurl bot does not generate a preview card (which opens in browser).
 */
export function formatInstagramDmUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  try {
    const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(normalized);
    const host = breakDomainForDm(parsed.host);
    const path = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    return `${host}${path}`;
  } catch {
    return breakDomainForDm(trimmed);
  }
}

export function instagramPostPathFromUrl(
  sourceUrl: string,
  type?: string | null
): string | null {
  const shortcode = extractShortcode(sourceUrl);
  if (!shortcode) {
    return sourceUrl.includes('instagram.com')
      ? formatInstagramDmUrl(sourceUrl)
      : null;
  }

  const lower = sourceUrl.toLowerCase();
  const isReel =
    type === 'reel' ||
    lower.includes('/reel/') ||
    lower.includes('/reels/');

  const path = isReel
    ? `instagram.com/reel/${shortcode}/`
    : `instagram.com/p/${shortcode}/`;

  return formatInstagramDmUrl(path);
}

import { extractShortcode } from '@/lib/instagram-pipeline/post-url';

function isReelUrl(sourceUrl: string, type?: string | null) {
  const lower = sourceUrl.toLowerCase();
  return (
    type === 'reel' ||
    lower.includes('/reel/') ||
    lower.includes('/reels/')
  );
}

/** Plain Instagram path for tappable links in DMs. */
export function instagramPostLinkFromUrl(
  sourceUrl: string,
  type?: string | null
): string | null {
  const shortcode = extractShortcode(sourceUrl);
  if (!shortcode) {
    if (!sourceUrl.includes('instagram.com')) {
      return null;
    }
    return sourceUrl.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '') + '/';
  }

  return isReelUrl(sourceUrl, type)
    ? `instagram.com/reel/${shortcode}/`
    : `instagram.com/p/${shortcode}/`;
}

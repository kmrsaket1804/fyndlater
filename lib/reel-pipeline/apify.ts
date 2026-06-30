import { writeJson, asNumber, asString, uniqueStrings } from './utils';
import type { ApifyItem, ReelMetadata } from './types';

const ACTOR_ENDPOINT =
  'https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items';

export async function scrapeReelViaApify(
  reelUrl: string,
  runDir: string
): Promise<ApifyItem[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('Missing APIFY_TOKEN in environment');

  const url = `${ACTOR_ENDPOINT}?token=${encodeURIComponent(token)}`;
  const body = {
    directUrls: [reelUrl],
    resultsType: 'details',
    resultsLimit: 1,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Apify failed: ${response.status} ${response.statusText} ${text.slice(0, 500)}`
    );
  }

  const items = JSON.parse(text) as ApifyItem[];
  await writeJson(`${runDir}/apify-items.json`, items);
  return items;
}

export function normalizeMetadata(
  reelUrl: string,
  item: ApifyItem
): ReelMetadata {
  return {
    sourceUrl: reelUrl,
    shortcode:
      asString(item.shortCode) ??
      asString(item.shortcode) ??
      extractShortcode(reelUrl),
    caption:
      asString(item.caption) ??
      asString(item.text) ??
      asString(item.description),
    timestamp:
      asString(item.timestamp) ??
      asString(item.takenAt) ??
      asString(item.createdAt),
    duration: asNumber(item.duration) ?? asNumber(item.videoDuration),
    ownerUsername:
      asString(item.ownerUsername) ??
      asString(item.username) ??
      asString(item.owner),
    hashtags: uniqueStrings(item.hashtags),
    mentions: uniqueStrings(item.mentions),
    counts: {
      likes: asNumber(item.likesCount) ?? asNumber(item.likes),
      comments: asNumber(item.commentsCount) ?? asNumber(item.comments),
      views:
        asNumber(item.videoViewCount) ??
        asNumber(item.videoPlayCount) ??
        asNumber(item.viewsCount) ??
        asNumber(item.views),
      shares: asNumber(item.sharesCount) ?? asNumber(item.shares),
    },
    raw: item,
  };
}

export function findVideoUrl(item: unknown): string | undefined {
  const preferredKeys = [
    'downloadedVideoUrl',
    'downloadedVideoURL',
    'downloadedVideo',
    'videoDownloadUrl',
    'videoUrl',
    'videoURL',
    'video_url',
    'mediaUrl',
    'mediaURL',
    'url',
  ];

  const direct = findByPreferredKeys(item, preferredKeys);
  if (direct) return direct;

  const allUrls: string[] = [];
  collectUrls(item, allUrls);

  return (
    allUrls.find((u) => /\.mp4(\?|$)/i.test(u)) ??
    allUrls.find((u) => /apifyusercontent|cdninstagram|fbcdn|video/i.test(u))
  );
}

export function findDisplayUrl(item: unknown): string | undefined {
  const preferredKeys = [
    'displayUrl',
    'displayURL',
    'thumbnailUrl',
    'thumbnail',
    'imageUrl',
    'image',
  ];
  const direct = findByPreferredKeys(item, preferredKeys);
  if (direct && /\.(jpg|jpeg|png|webp)(\?|$)/i.test(direct)) return direct;

  const allUrls: string[] = [];
  collectUrls(item, allUrls);
  return allUrls.find((u) => /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u));
}

function findByPreferredKeys(
  value: unknown,
  keys: string[]
): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const obj = value as Record<string, unknown>;

  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && isLikelyMediaUrl(v)) return v;
    if (v && typeof v === 'object') {
      const nested = findByPreferredKeys(v, keys);
      if (nested) return nested;
    }
  }

  for (const v of Object.values(obj)) {
    const nested = findByPreferredKeys(v, keys);
    if (nested) return nested;
  }
  return undefined;
}

function collectUrls(value: unknown, out: string[]) {
  if (typeof value === 'string') {
    if (/^https?:\/\//i.test(value)) out.push(value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectUrls(v, out));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value as Record<string, unknown>).forEach((v) =>
      collectUrls(v, out)
    );
  }
}

function isLikelyMediaUrl(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) &&
    (/\.(mp4|jpg|jpeg|png|webp)(\?|$)/i.test(value) ||
      /video|cdninstagram|apifyusercontent|fbcdn/i.test(value))
  );
}

function isLikelyVideoUrl(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) &&
    (/\.mp4(\?|$)/i.test(value) ||
      /video|cdninstagram|apifyusercontent|fbcdn/i.test(value))
  );
}

function extractShortcode(url: string): string | undefined {
  const match = url.match(/instagram\.com\/(?:reel|p|tv)\/([^/?#]+)/i);
  return match?.[1];
}

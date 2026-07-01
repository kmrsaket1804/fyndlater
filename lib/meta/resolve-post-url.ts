import 'server-only';

import { getGraphApiBaseUrl, getMetaConfig } from './config';
import type { NormalizedInstagramEvent } from './types';
import {
  extractInstagramPostUrlFromEvent,
  extractMediaReferenceFromEvent,
} from './extract-reel-url';
import { normalizeInstagramPostUrl } from '@/lib/instagram-pipeline/post-url';

type MediaPermalinkResponse = {
  permalink?: string;
  error?: { message?: string };
};

export async function fetchInstagramMediaPermalink(
  mediaId: string
): Promise<string | null> {
  try {
    const config = getMetaConfig();
    const params = new URLSearchParams({
      fields: 'permalink,media_type',
      access_token: config.pageAccessToken,
    });

    const response = await fetch(
      `${getGraphApiBaseUrl()}/${encodeURIComponent(mediaId)}?${params}`
    );
    const data = (await response.json()) as MediaPermalinkResponse;

    if (!response.ok) {
      console.warn('[meta] Graph media lookup failed', {
        mediaId,
        status: response.status,
        error: data.error?.message,
      });
      return null;
    }

    return data.permalink ?? null;
  } catch (error) {
    console.warn('[meta] Graph media lookup error', {
      mediaId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** Resolve a saveable Instagram post URL from DM text and attachment metadata. */
export async function resolveInstagramPostUrlFromEvent(
  event: NormalizedInstagramEvent
): Promise<string | null> {
  const direct = extractInstagramPostUrlFromEvent(event);
  if (direct) {
    try {
      return normalizeInstagramPostUrl(direct);
    } catch {
      /* fall through to media lookup */
    }
  }

  const mediaRef = extractMediaReferenceFromEvent(event);
  if (!mediaRef) {
    return null;
  }

  const permalink = await fetchInstagramMediaPermalink(mediaRef);
  if (!permalink) {
    return null;
  }

  try {
    return normalizeInstagramPostUrl(permalink);
  } catch {
    return permalink.replace(/\?.*$/, '').replace(/\/$/, '') + '/';
  }
}

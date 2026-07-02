import 'server-only';

import { getGraphApiBaseUrl, getMetaConfig } from './config';

type MediaPermalinkResponse = {
  permalink?: string;
  error?: { message?: string };
};

/** Best-effort lookup for media the business owns. Fails for third-party shared posts. */
export async function fetchInstagramMediaPermalink(
  mediaId: string
): Promise<string | null> {
  try {
    const config = getMetaConfig();
    const params = new URLSearchParams({
      fields: 'permalink,media_type,shortcode',
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

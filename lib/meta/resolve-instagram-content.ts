import 'server-only';

import { normalizeInstagramPostUrl } from '@/lib/instagram-pipeline/post-url';
import { fetchMessageShareLinks } from './fetch-message-shares';
import {
  extractDmSharePreviewFromEvent,
  extractInstagramPostUrlFromEvent,
  extractMediaReferenceFromEvent,
  isInstagramPermalink,
  normalizeExtractedUrl,
} from './extract-reel-url';
import { fetchInstagramMediaPermalink } from './resolve-post-url';
import type { ResolvedInstagramContent } from './shared-post-types';
import type { NormalizedInstagramEvent } from './types';

function permalinkFromShareRecord(
  share: { link?: string; url?: string }
): string | null {
  for (const candidate of [share.link, share.url]) {
    if (candidate && isInstagramPermalink(candidate)) {
      return normalizeExtractedUrl(candidate);
    }
  }
  return null;
}

export async function resolveInstagramContentFromEvent(
  event: NormalizedInstagramEvent
): Promise<ResolvedInstagramContent | null> {
  const direct = extractInstagramPostUrlFromEvent(event);
  if (direct) {
    try {
      return {
        kind: 'permalink',
        postUrl: normalizeInstagramPostUrl(direct),
        source: event.text?.includes('instagram.com') ? 'text' : 'webhook',
      };
    } catch {
      /* continue */
    }
  }

  const shares = await fetchMessageShareLinks(event.message_id);
  for (const share of shares) {
    const postUrl = permalinkFromShareRecord(share);
    if (postUrl) {
      return {
        kind: 'permalink',
        postUrl: normalizeInstagramPostUrl(postUrl),
        source: 'message_shares',
      };
    }
  }

  const mediaRef = extractMediaReferenceFromEvent(event);
  if (mediaRef) {
    const permalink = await fetchInstagramMediaPermalink(mediaRef);
    if (permalink && isInstagramPermalink(permalink)) {
      return {
        kind: 'permalink',
        postUrl: normalizeInstagramPostUrl(permalink),
        source: 'graph_media',
      };
    }
  }

  const preview = extractDmSharePreviewFromEvent(event);
  if (preview) {
    return {
      kind: 'dm_preview',
      preview,
      source: 'ig_post_cdn',
    };
  }

  return null;
}

/** @deprecated Use resolveInstagramContentFromEvent */
export async function resolveInstagramPostUrlFromEvent(
  event: NormalizedInstagramEvent
): Promise<string | null> {
  const resolved = await resolveInstagramContentFromEvent(event);
  return resolved?.kind === 'permalink' ? resolved.postUrl : null;
}

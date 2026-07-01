import {
  scrapeReelViaApify,
  normalizeMetadata,
} from '../reel-pipeline/apify';
import type { ApifyItem } from '../reel-pipeline/types';
import { normalizeInstagramPostUrl } from './post-url';

export async function scrapeInstagramPostViaApify(
  postUrl: string,
  runDir: string
): Promise<ApifyItem[]> {
  const normalized = normalizeInstagramPostUrl(postUrl);
  return scrapeReelViaApify(normalized, runDir);
}

export { normalizeMetadata };

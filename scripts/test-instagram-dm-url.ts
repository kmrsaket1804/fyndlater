import assert from 'node:assert/strict';
import {
  formatInstagramDmUrl,
  instagramPostPathFromUrl,
} from '../lib/meta/instagram-dm-url';

const url = formatInstagramDmUrl('instagram.com/reel/ABC123/');
assert(url.includes('\u200b'), 'expected zero-width space in domain');
assert(!url.includes('instagram.com'), 'domain dots should be broken');
assert(url.includes('ABC123'), 'shortcode preserved');

const reelPath = instagramPostPathFromUrl(
  'https://www.instagram.com/reel/ABC123/',
  'reel'
);
assert(reelPath?.includes('reel/ABC123'), 'reel path preserved');
assert(reelPath?.includes('\u200b'), 'reel path uses ZWSP');

const postPath = instagramPostPathFromUrl(
  'https://www.instagram.com/p/XYZ789/',
  'post'
);
assert(postPath?.includes('p/XYZ789'), 'post path preserved');

console.log('✓ instagram DM URL formatting');
console.log('\nInstagram DM URL tests passed.');

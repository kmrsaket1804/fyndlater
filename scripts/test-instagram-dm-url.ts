import assert from 'node:assert/strict';
import { instagramPostLinkFromUrl } from '../lib/meta/instagram-dm-url';

assert.equal(
  instagramPostLinkFromUrl('https://www.instagram.com/reel/ABC123/', 'reel'),
  'instagram.com/reel/ABC123/'
);
assert.equal(
  instagramPostLinkFromUrl('https://www.instagram.com/p/XYZ789/', 'post'),
  'instagram.com/p/XYZ789/'
);

console.log('✓ instagram DM link formatting');
console.log('\nInstagram DM URL tests passed.');

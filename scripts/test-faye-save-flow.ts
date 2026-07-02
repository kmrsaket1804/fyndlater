import assert from 'node:assert/strict';
import {
  confidenceFromScore,
  scoreMergeMatch,
} from '../lib/meta/merge-scoring';
import { buildCanonicalKeyFromUrl } from '../lib/meta/canonical-key';
import { immediateReplyForSave } from '../lib/meta/faye-replies';

function testCanonicalKeys() {
  assert.equal(
    buildCanonicalKeyFromUrl('https://www.instagram.com/reel/ABC123/'),
    'instagram:reel:ABC123'
  );
  assert.equal(
    buildCanonicalKeyFromUrl('https://www.instagram.com/p/XYZ789/'),
    'instagram:post:XYZ789'
  );
  console.log('✓ canonical keys');
}

function testMergeScoring() {
  const high = scoreMergeMatch({
    previewCaption: 'Oopar likha hai jo kehna tha',
    apifyCaption: 'Oopar likha hai jo kehna tha ☝️',
    minutesSincePreview: 2,
    pendingCount: 1,
  });
  assert.ok(high >= 70, `expected high score, got ${high}`);
  assert.equal(confidenceFromScore(high), 'high');

  const low = scoreMergeMatch({
    previewCaption: 'completely different preview',
    apifyCaption: 'another unrelated caption',
    minutesSincePreview: 9,
    pendingCount: 2,
  });
  assert.ok(low < 40, `expected low score, got ${low}`);
  console.log('✓ merge scoring');
}

function testReplyCopy() {
  assert.match(
    immediateReplyForSave('reel_queued'),
    /reading this reel/i
  );
  assert.match(
    immediateReplyForSave('shared_carousel_preview'),
    /Send me the post link/i
  );
  assert.match(
    immediateReplyForSave('merge_uncertain'),
    /Reply “yes”/i
  );
  console.log('✓ reply copy');
}

testCanonicalKeys();
testMergeScoring();
testReplyCopy();
console.log('\nAll Faye flow tests passed.');

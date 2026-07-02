#!/usr/bin/env npx tsx
/**
 * Local integration checks for Instagram DM post resolution.
 * Run: pnpm test:meta-post-resolution
 */
import 'dotenv/config';
import { parseMetaWebhookPayload } from '../lib/meta/parse-webhook';
import {
  extractDmSharePreviewFromEvent,
  extractInstagramPostUrlFromEvent,
  isInstagramPermalink,
} from '../lib/meta/extract-reel-url';
import type { NormalizedInstagramEvent } from '../lib/meta/types';

const FIXTURES = {
  igPostShare: {
    channel: 'instagram' as const,
    provider: 'meta' as const,
    sender_igsid: '998619492953512',
    recipient_ig_id: '17841415881171984',
    message_id:
      'aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDE1ODgxMTcxOTg0OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTUxNzUwNTM0NDQ5MDQ0OTozMjg4OTI4MTA5NDU4MTI4NjQ0NzgwNDAzMDc3MjA1MTk2OAZDZD',
    message_type: 'shared_post' as const,
    text: null,
    attachments: [
      {
        type: 'ig_post',
        payload: {
          url: 'https://lookaside.fbsbx.com/ig_messaging_cdn/?asset_id=18128888623723534&signature=test',
          title: 'Oopar likha hai jo kehna tha ☝️',
          ig_post_media_id: '18128888623723534',
        },
      },
    ],
    timestamp: new Date().toISOString(),
    raw_payload_id: 1,
  } satisfies NormalizedInstagramEvent,
  igReelShare: {
    channel: 'instagram' as const,
    provider: 'meta' as const,
    sender_igsid: '998619492953512',
    recipient_ig_id: '17841415881171984',
    message_id:
      'aWdfZAG1faXRlbToxOklHTWVzc2FnZAUlEOjE3ODQxNDE1ODgxMTcxOTg0OjM0MDI4MjM2Njg0MTcxMDMwMTI0NDI1OTUxNzUwNTM0NDQ5MDQ0OTozMjg4OTE5OTIwMDYzMjIxMTkzODczMzAzNjI2NjMyMzk2OAZDZD',
    message_type: 'shared_post' as const,
    text: null,
    attachments: [
      {
        type: 'ig_reel',
        payload: {
          url: 'https://www.instagram.com/reel/DaJLEKKKgay/',
          title: '😌',
          reel_video_id: '18377700250207804',
        },
      },
    ],
    timestamp: new Date().toISOString(),
    raw_payload_id: 2,
  } satisfies NormalizedInstagramEvent,
  pastedCarouselUrl: {
    channel: 'instagram' as const,
    provider: 'meta' as const,
    sender_igsid: '998619492953512',
    recipient_ig_id: '17841415881171984',
    message_id: 'test-pasted-url',
    message_type: 'text' as const,
    text: 'save this https://www.instagram.com/p/DaQIOA0jog0/',
    attachments: [],
    timestamp: new Date().toISOString(),
    raw_payload_id: 3,
  } satisfies NormalizedInstagramEvent,
};

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

async function fetchMessageShareLinks(messageId: string) {
  const token = process.env.PAGE_ACCESS_TOKEN?.trim().replace(/^["']|["']$/g, '');
  const version = process.env.META_GRAPH_API_VERSION || 'v25.0';
  if (!token) return [] as Array<{ link?: string; url?: string }>;

  const params = new URLSearchParams({
    fields: 'shares{link,url,name,description,type,id}',
    platform: 'instagram',
    access_token: token,
  });

  const response = await fetch(
    `https://graph.facebook.com/${version}/${encodeURIComponent(messageId)}?${params}`
  );
  const data = (await response.json()) as {
    shares?: { data?: Array<{ link?: string; url?: string }> };
  };
  return data.shares?.data ?? [];
}

async function testExtractionFixtures() {
  console.log('\n--- Fixture extraction ---');

  const reelUrl = extractInstagramPostUrlFromEvent(FIXTURES.igReelShare);
  assert(reelUrl?.includes('/reel/DaJLEKKKgay'), `Expected reel URL, got ${reelUrl}`);
  console.log('✓ ig_reel webhook URL extracted:', reelUrl);

  const pasted = extractInstagramPostUrlFromEvent(FIXTURES.pastedCarouselUrl);
  assert(pasted?.includes('/p/DaQIOA0jog0'), `Expected pasted /p/ URL, got ${pasted}`);
  console.log('✓ pasted text URL extracted:', pasted);

  const igPostDirect = extractInstagramPostUrlFromEvent(FIXTURES.igPostShare);
  assert(igPostDirect === null, `Expected no direct URL for ig_post CDN, got ${igPostDirect}`);
  console.log('✓ ig_post CDN does not masquerade as permalink');

  const preview = extractDmSharePreviewFromEvent(FIXTURES.igPostShare);
  assert(preview?.mediaId === '18128888623723534', 'Expected preview media id');
  assert(Boolean(preview?.previewUrl.includes('lookaside.fbsbx.com')), 'Expected CDN preview URL');
  console.log('✓ ig_post CDN preview extracted:', preview);
}

async function testWebhookParsing() {
  console.log('\n--- Webhook parsing ---');
  const raw = {
    object: 'instagram',
    entry: [
      {
        messaging: [
          {
            sender: { id: '998619492953512' },
            recipient: { id: '17841415881171984' },
            timestamp: Date.now(),
            message: {
              mid: FIXTURES.igPostShare.message_id,
              attachments: [
                {
                  type: 'ig_post',
                  payload: FIXTURES.igPostShare.attachments[0].payload,
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const events = parseMetaWebhookPayload(raw, 99);
  assert(events.length === 1, 'Expected one parsed event');
  assert(events[0].message_type === 'shared_post', 'Expected shared_post type');
  console.log('✓ ig_post parsed as shared_post');
}

async function testGraphApiIfConfigured() {
  console.log('\n--- Graph API (live, optional) ---');
  const token = process.env.PAGE_ACCESS_TOKEN?.trim();
  if (!token) {
    console.log('⊘ Skipping Graph API tests — PAGE_ACCESS_TOKEN not set');
    return;
  }

  const reelShares = await fetchMessageShareLinks(FIXTURES.igReelShare.message_id);
  const reelLink = reelShares.find(
    (share) => share.link && isInstagramPermalink(share.link)
  )?.link;
  assert(reelLink?.includes('/reel/'), `Expected reel share link from Graph API, got ${JSON.stringify(reelShares)}`);
  console.log('✓ Message shares API returns reel permalink:', reelLink);

  const postShares = await fetchMessageShareLinks(FIXTURES.igPostShare.message_id);
  console.log('ℹ Message shares API for ig_post (Meta limitation — empty):', postShares);
  assert(postShares.length === 0, 'Expected empty shares for ig_post third-party share');

  const preview = extractDmSharePreviewFromEvent(FIXTURES.igPostShare);
  assert(preview, 'Expected CDN preview fallback for ig_post');
  console.log('✓ Fallback path for ig_post is dm_preview:', preview);
}

async function testApifyIfConfigured() {
  console.log('\n--- Apify (live, optional) ---');
  const token = process.env.APIFY_TOKEN?.trim();
  if (!token) {
    console.log('⊘ Skipping Apify tests — APIFY_TOKEN not set');
    return;
  }

  const endpoint = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  for (const url of [
    'https://www.instagram.com/p/DaQIOA0jog0/',
    'https://www.instagram.com/p/DaMq7WqotkG/',
  ]) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ directUrls: [url], resultsType: 'details', resultsLimit: 1 }),
    });
    const data = await res.json();
    assert(res.ok && data[0]?.shortCode, `Apify failed for ${url}: ${res.status}`);
    console.log(`✓ Apify scraped ${url} → type=${data[0].type}, slides=${data[0].childPosts?.length ?? 0}`);
  }
}

async function main() {
  console.log('Meta post resolution local tests');
  await testExtractionFixtures();
  await testWebhookParsing();
  await testGraphApiIfConfigured();
  await testApifyIfConfigured();
  console.log('\nAll checks passed.');
}

main().catch((error) => {
  console.error('\nTEST FAILED:', error instanceof Error ? error.message : error);
  process.exit(1);
});

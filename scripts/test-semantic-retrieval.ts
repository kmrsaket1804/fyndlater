import assert from 'node:assert/strict';
import { buildSearchChunksFromRecord } from '../lib/semantic/search-text';
import type { ProcessedPostRecord } from '../lib/instagram-pipeline/types';

const carouselRecord: ProcessedPostRecord = {
  jobId: 'test',
  postUrl: 'https://www.instagram.com/p/ABC/',
  postKind: 'carousel',
  metadata: {
    sourceUrl: 'https://www.instagram.com/p/ABC/',
    caption: 'Recipe ideas for dinner',
    hashtags: ['food'],
    mentions: [],
    counts: {},
    raw: {},
    postKind: 'carousel',
  },
  visualAnalysis: {
    summary: 'A carousel about quick dinner recipes',
    topics: ['food'],
    entities: [],
    products_or_places: [],
    visual_objects: [],
    scene_timeline: [],
    search_queries: [],
    tags: ['recipes', 'dinner'],
    confidence: 'high',
  },
  slides: [
    {
      index: 0,
      type: 'Image',
      displayUrl: 'https://example.com/1.jpg',
      analysis: {
        description: 'Pasta dish',
        visibleText: '15 min pasta',
        tags: ['pasta'],
      },
    },
    {
      index: 1,
      type: 'Image',
      displayUrl: 'https://example.com/2.jpg',
      analysis: {
        description: 'Salad bowl',
        visibleText: 'Fresh salad',
        tags: ['salad'],
      },
    },
  ],
  llmUsage: {
    calls: [],
    totals: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      costUsd: 0,
    },
  },
  createdAt: new Date().toISOString(),
};

const chunks = buildSearchChunksFromRecord(carouselRecord, {
  tags: ['food'],
  collection: 'Recipes',
});

assert.equal(chunks.length, 3, 'expected document + 2 slide chunks');
assert.match(chunks[0].searchText, /Recipe ideas/i);
assert.match(chunks[1].searchText, /15 min pasta/i);
assert.match(chunks[2].searchText, /Fresh salad/i);

console.log('✓ semantic search-text chunks');
console.log('\nSemantic retrieval unit tests passed.');

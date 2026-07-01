import 'server-only';

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { findDisplayUrl, normalizeMetadata } from '../reel-pipeline/apify';
import { downloadFile } from '../reel-pipeline/media';
import {
  summarizeLlmCalls,
  type LlmCallRecord,
} from '../reel-pipeline/llm-pricing';
import { getRunsDir } from '../reel-pipeline/runs-dir';
import type { ApifyItem, VisualAnalysis } from '../reel-pipeline/types';
import { asString, ensureDir, writeJson } from '../reel-pipeline/utils';
import { detectPostKind } from './apify-post';
import { analyzeImagePost } from './openai-post';
import { normalizeInstagramPostUrl } from './post-url';
import { scrapeInstagramPostViaApify } from './scrape';
import type { PostMetadata, ProcessedPostRecord } from './types';

const ImageState = Annotation.Root({
  postUrl: Annotation<string>(),
  jobId: Annotation<string | undefined>(),
  runDir: Annotation<string>(),
  apifyItems: Annotation<ApifyItem[] | undefined>(),
  metadata: Annotation<PostMetadata>(),
  imageUrl: Annotation<string | undefined>(),
  imagePath: Annotation<string | undefined>(),
  visualAnalysis: Annotation<VisualAnalysis | undefined>(),
  llmCalls: Annotation<LlmCallRecord[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalRecord: Annotation<ProcessedPostRecord>(),
});

type ImageStateType = typeof ImageState.State;

async function setupJob(state: ImageStateType) {
  const jobId = state.jobId ?? randomUUID();
  const runDir = path.join(getRunsDir(), jobId);
  await ensureDir(runDir);
  return { jobId, runDir };
}

async function scrape(state: ImageStateType) {
  if (state.apifyItems?.length) {
    const first = state.apifyItems[0];
    const postUrl = normalizeInstagramPostUrl(state.postUrl);
    const base = normalizeMetadata(postUrl, first);
    const kind = detectPostKind(first);
    if (kind !== 'image') {
      throw new Error(`Expected image post, got ${kind}`);
    }

    const imageUrl = findDisplayUrl(first);
    if (!imageUrl) throw new Error('Could not find image URL in Apify output');

    const metadata: PostMetadata = {
      ...base,
      postKind: 'image',
      apifyType: asString(first.type),
      productType: asString(first.productType),
    };

    return { metadata, imageUrl, postUrl };
  }

  console.log(`[image-pipeline:${state.jobId}] scraping post metadata`);
  const postUrl = normalizeInstagramPostUrl(state.postUrl);
  const apifyItems = await scrapeInstagramPostViaApify(postUrl, state.runDir);
  if (!apifyItems.length) throw new Error('Apify returned no dataset items');

  const first = apifyItems[0];
  const kind = detectPostKind(first);
  if (kind !== 'image') {
    throw new Error(`Expected image post, got ${kind}`);
  }

  const base = normalizeMetadata(postUrl, first);
  const metadata: PostMetadata = {
    ...base,
    postKind: 'image',
    apifyType: asString(first.type),
    productType: asString(first.productType),
  };

  const imageUrl = findDisplayUrl(first);
  if (!imageUrl) throw new Error('Could not find image URL in Apify output');

  return { apifyItems, metadata, imageUrl, postUrl };
}

async function downloadImage(state: ImageStateType) {
  console.log(`[image-pipeline:${state.jobId}] downloading image`);
  if (!state.imageUrl) throw new Error('Missing imageUrl');

  const ext = state.imageUrl.includes('.png') ? '.png' : '.jpg';
  const imagePath = path.join(state.runDir, `image${ext}`);
  await downloadFile(state.imageUrl, imagePath);
  return { imagePath };
}

async function analyze(state: ImageStateType) {
  console.log(`[image-pipeline:${state.jobId}] analyzing image`);
  if (!state.imagePath || !state.metadata) {
    throw new Error('Missing imagePath or metadata');
  }

  const result = await analyzeImagePost({
    metadata: { ...state.metadata, postKind: 'image' },
    imagePath: state.imagePath,
  });

  return {
    llmCalls: [result.llmCall],
    visualAnalysis: result.visualAnalysis,
  };
}

async function persistRecord(state: ImageStateType) {
  const llmCalls = state.llmCalls ?? [];
  if (!state.jobId) throw new Error('Missing jobId');
  if (!state.visualAnalysis) throw new Error('Missing visualAnalysis');

  const finalRecord: ProcessedPostRecord = {
    jobId: state.jobId,
    postUrl: state.postUrl,
    postKind: 'image',
    metadata: { ...state.metadata, postKind: 'image' },
    visualAnalysis: state.visualAnalysis,
    llmUsage: {
      calls: llmCalls,
      totals: summarizeLlmCalls(llmCalls),
    },
    assets: {
      imagePath: state.imagePath,
    },
    createdAt: new Date().toISOString(),
  };

  await writeJson(path.join(state.runDir, 'record.json'), finalRecord);
  return { finalRecord };
}

export const imageGraph = new StateGraph(ImageState)
  .addNode('setupJob', setupJob)
  .addNode('scrape', scrape)
  .addNode('downloadImage', downloadImage)
  .addNode('analyze', analyze)
  .addNode('persistRecord', persistRecord)
  .addEdge(START, 'setupJob')
  .addEdge('setupJob', 'scrape')
  .addEdge('scrape', 'downloadImage')
  .addEdge('downloadImage', 'analyze')
  .addEdge('analyze', 'persistRecord')
  .addEdge('persistRecord', END)
  .compile();

export async function processImageJob(
  postUrl: string,
  options?: { jobId?: string; apifyItems?: ApifyItem[] }
): Promise<ProcessedPostRecord> {
  const result = await imageGraph.invoke({
    postUrl,
    jobId: options?.jobId,
    apifyItems: options?.apifyItems,
  });
  return result.finalRecord;
}

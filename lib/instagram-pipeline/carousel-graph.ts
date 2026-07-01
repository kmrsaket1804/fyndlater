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
import {
  detectPostKind,
  extractCarouselSlides,
  maxCarouselSlides,
} from './apify-post';
import { analyzeCarouselSlide, synthesizeCarouselAnalysis } from './openai-post';
import { normalizeInstagramPostUrl } from './post-url';
import { scrapeInstagramPostViaApify } from './scrape';
import type { CarouselSlide, PostMetadata, ProcessedPostRecord } from './types';

const CarouselState = Annotation.Root({
  postUrl: Annotation<string>(),
  jobId: Annotation<string | undefined>(),
  runDir: Annotation<string>(),
  apifyItems: Annotation<ApifyItem[] | undefined>(),
  metadata: Annotation<PostMetadata>(),
  slides: Annotation<CarouselSlide[]>(),
  visualAnalysis: Annotation<VisualAnalysis | undefined>(),
  llmCalls: Annotation<LlmCallRecord[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalRecord: Annotation<ProcessedPostRecord>(),
});

type CarouselStateType = typeof CarouselState.State;

async function setupJob(state: CarouselStateType) {
  const jobId = state.jobId ?? randomUUID();
  const runDir = path.join(getRunsDir(), jobId);
  await ensureDir(runDir);
  return { jobId, runDir };
}

async function scrape(state: CarouselStateType) {
  const postUrl = normalizeInstagramPostUrl(state.postUrl);

  const apifyItems =
    state.apifyItems?.length
      ? state.apifyItems
      : await scrapeInstagramPostViaApify(postUrl, state.runDir);

  if (!apifyItems.length) throw new Error('Apify returned no dataset items');

  const first = apifyItems[0];
  const kind = detectPostKind(first);
  if (kind !== 'carousel') {
    throw new Error(`Expected carousel post, got ${kind}`);
  }

  const base = normalizeMetadata(postUrl, first);
  const slides = extractCarouselSlides(first).slice(0, maxCarouselSlides());
  if (!slides.length) {
    throw new Error('Carousel has no slides');
  }

  const metadata: PostMetadata = {
    ...base,
    postKind: 'carousel',
    apifyType: asString(first.type),
    productType: asString(first.productType),
    slideCount: slides.length,
  };

  if (!metadata.raw.displayUrl) {
    metadata.raw = {
      ...metadata.raw,
      displayUrl: findDisplayUrl(first) ?? slides[0].displayUrl,
    };
  }

  console.log(
    `[carousel-pipeline:${state.jobId}] found ${slides.length} slides`
  );

  return { apifyItems, metadata, slides, postUrl };
}

async function downloadSlides(state: CarouselStateType) {
  console.log(`[carousel-pipeline:${state.jobId}] downloading slides`);
  const slidesDir = path.join(state.runDir, 'slides');
  await ensureDir(slidesDir);

  const slides: CarouselSlide[] = [];
  for (const slide of state.slides ?? []) {
    const ext = slide.displayUrl.includes('.png') ? '.png' : '.jpg';
    const localPath = path.join(slidesDir, `slide-${slide.index}${ext}`);
    await downloadFile(slide.displayUrl, localPath);
    slides.push({ ...slide, localPath });
  }

  return { slides };
}

async function analyzeSlides(state: CarouselStateType) {
  console.log(`[carousel-pipeline:${state.jobId}] analyzing slides`);
  const llmCalls: LlmCallRecord[] = [];
  const analyzedSlides: CarouselSlide[] = [];

  for (const slide of state.slides ?? []) {
    const result = await analyzeCarouselSlide({
      metadata: state.metadata,
      slide,
    });
    llmCalls.push(result.llmCall);
    analyzedSlides.push(result.slide);
  }

  return { slides: analyzedSlides, llmCalls };
}

async function synthesize(state: CarouselStateType) {
  console.log(`[carousel-pipeline:${state.jobId}] synthesizing carousel`);
  const result = await synthesizeCarouselAnalysis({
    metadata: state.metadata,
    slides: state.slides ?? [],
  });

  return {
    visualAnalysis: result.visualAnalysis,
    llmCalls: [result.llmCall],
  };
}

async function persistRecord(state: CarouselStateType) {
  const llmCalls = state.llmCalls ?? [];
  if (!state.jobId) throw new Error('Missing jobId');
  if (!state.visualAnalysis) throw new Error('Missing visualAnalysis');

  const slidePaths = (state.slides ?? [])
    .map((slide) => slide.localPath)
    .filter((p): p is string => Boolean(p));

  const finalRecord: ProcessedPostRecord = {
    jobId: state.jobId,
    postUrl: state.postUrl,
    postKind: 'carousel',
    metadata: { ...state.metadata, postKind: 'carousel' },
    visualAnalysis: state.visualAnalysis,
    slides: state.slides,
    llmUsage: {
      calls: llmCalls,
      totals: summarizeLlmCalls(llmCalls),
    },
    assets: {
      slidePaths,
      imagePath: slidePaths[0],
    },
    createdAt: new Date().toISOString(),
  };

  await writeJson(path.join(state.runDir, 'record.json'), finalRecord);
  return { finalRecord };
}

export const carouselGraph = new StateGraph(CarouselState)
  .addNode('setupJob', setupJob)
  .addNode('scrape', scrape)
  .addNode('downloadSlides', downloadSlides)
  .addNode('analyzeSlides', analyzeSlides)
  .addNode('synthesize', synthesize)
  .addNode('persistRecord', persistRecord)
  .addEdge(START, 'setupJob')
  .addEdge('setupJob', 'scrape')
  .addEdge('scrape', 'downloadSlides')
  .addEdge('downloadSlides', 'analyzeSlides')
  .addEdge('analyzeSlides', 'synthesize')
  .addEdge('synthesize', 'persistRecord')
  .addEdge('persistRecord', END)
  .compile();

export async function processCarouselJob(
  postUrl: string,
  options?: { jobId?: string; apifyItems?: ApifyItem[] }
): Promise<ProcessedPostRecord> {
  const result = await carouselGraph.invoke({
    postUrl,
    jobId: options?.jobId,
    apifyItems: options?.apifyItems,
  });
  return result.finalRecord;
}

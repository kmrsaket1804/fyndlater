import 'server-only';

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import {
  scrapeReelViaApify,
  findVideoUrl,
  findDisplayUrl,
  normalizeMetadata,
} from './apify';
import { downloadFile, extractAudio, extractFrames } from './media';
import { summarizeLlmCalls, type LlmCallRecord } from './llm-pricing';
import { analyzeFramesAndTranscript, transcribeAudio } from './openai-client';
import { getRunsDir } from './runs-dir';
import { ensureDir, writeJson } from './utils';
import type { ApifyItem, FinalRecord, ReelMetadata, VisualAnalysis } from './types';

const ReelState = Annotation.Root({
  reelUrl: Annotation<string>(),
  jobId: Annotation<string | undefined>(),
  runDir: Annotation<string>(),
  apifyItems: Annotation<ApifyItem[]>(),
  metadata: Annotation<ReelMetadata>(),
  videoUrl: Annotation<string | undefined>(),
  videoPath: Annotation<string | undefined>(),
  audioPath: Annotation<string | undefined>(),
  framePaths: Annotation<string[]>(),
  transcript: Annotation<string>(),
  visualAnalysis: Annotation<VisualAnalysis>(),
  llmCalls: Annotation<LlmCallRecord[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalRecord: Annotation<FinalRecord>(),
});

type ReelStateType = typeof ReelState.State;

async function setupJob(state: ReelStateType) {
  if (!state.reelUrl || !/^https?:\/\//.test(state.reelUrl)) {
    throw new Error('Input must include a valid reelUrl');
  }

  const jobId = state.jobId ?? randomUUID();
  const runDir = path.join(getRunsDir(), jobId);
  await ensureDir(runDir);

  return { jobId, runDir };
}

async function scrape(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] scraping reel metadata/video link`);
  const apifyItems = await scrapeReelViaApify(state.reelUrl, state.runDir);
  if (!apifyItems.length) throw new Error('Apify returned no dataset items');

  const first = apifyItems[0];
  const metadata = normalizeMetadata(state.reelUrl, first);
  const videoUrl = findVideoUrl(first);
  const displayUrl = findDisplayUrl(first);
  if (displayUrl) {
    metadata.raw = { ...metadata.raw, displayUrl };
  }

  if (!videoUrl) {
    throw new Error(
      `Could not find a video URL in Apify output. Inspect ${state.runDir}/apify-items.json`
    );
  }

  return { apifyItems, metadata, videoUrl };
}

async function downloadVideo(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] downloading video`);
  if (!state.videoUrl) throw new Error('Missing videoUrl');

  const videoPath = path.join(state.runDir, 'video.mp4');
  await downloadFile(state.videoUrl, videoPath);
  return { videoPath };
}

async function processMedia(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] extracting frames and audio`);
  if (!state.videoPath) throw new Error('Missing videoPath');

  const framesDir = path.join(state.runDir, 'frames');
  const audioPathCandidate = path.join(state.runDir, 'audio.mp3');

  const [framePaths, audioPath] = await Promise.all([
    extractFrames(state.videoPath, framesDir),
    extractAudio(state.videoPath, audioPathCandidate),
  ]);

  return { framePaths, audioPath };
}

async function understandAudio(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] transcribing audio`);
  const result = await transcribeAudio(state.audioPath);
  return { transcript: result.transcript, llmCalls: [result.llmCall] };
}

async function understandVisuals(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] analyzing frames`);
  const result = await analyzeFramesAndTranscript({
    metadata: state.metadata,
    transcript: state.transcript ?? '',
    framePaths: state.framePaths ?? [],
  });
  return {
    visualAnalysis: result.visualAnalysis,
    llmCalls: [result.llmCall],
  };
}

async function persistRecord(state: ReelStateType) {
  console.log(`[reel-pipeline:${state.jobId}] writing final record`);
  const llmCalls = state.llmCalls ?? [];
  if (!state.jobId) throw new Error('Missing jobId');

  const finalRecord: FinalRecord = {
    jobId: state.jobId,
    reelUrl: state.reelUrl,
    metadata: state.metadata,
    transcript: state.transcript ?? '',
    visualAnalysis: state.visualAnalysis,
    llmUsage: {
      calls: llmCalls,
      totals: summarizeLlmCalls(llmCalls),
    },
    assets: {
      videoPath: state.videoPath,
      audioPath: state.audioPath,
      framePaths: state.framePaths ?? [],
    },
    createdAt: new Date().toISOString(),
  };

  await writeJson(path.join(state.runDir, 'record.json'), finalRecord);
  return { finalRecord };
}

export const reelGraph = new StateGraph(ReelState)
  .addNode('setupJob', setupJob)
  .addNode('scrape', scrape)
  .addNode('downloadVideo', downloadVideo)
  .addNode('processMedia', processMedia)
  .addNode('understandAudio', understandAudio)
  .addNode('understandVisuals', understandVisuals)
  .addNode('persistRecord', persistRecord)
  .addEdge(START, 'setupJob')
  .addEdge('setupJob', 'scrape')
  .addEdge('scrape', 'downloadVideo')
  .addEdge('downloadVideo', 'processMedia')
  .addEdge('processMedia', 'understandAudio')
  .addEdge('understandAudio', 'understandVisuals')
  .addEdge('understandVisuals', 'persistRecord')
  .addEdge('persistRecord', END)
  .compile();

export async function processReelJob(
  reelUrl: string,
  options?: { jobId?: string }
): Promise<FinalRecord> {
  const result = await reelGraph.invoke({ reelUrl, jobId: options?.jobId });
  return result.finalRecord;
}

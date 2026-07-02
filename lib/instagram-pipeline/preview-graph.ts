import 'server-only';

import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { downloadFile } from '../reel-pipeline/media';
import {
  summarizeLlmCalls,
  type LlmCallRecord,
} from '../reel-pipeline/llm-pricing';
import { getRunsDir } from '../reel-pipeline/runs-dir';
import type { VisualAnalysis } from '../reel-pipeline/types';
import { ensureDir, writeJson } from '../reel-pipeline/utils';
import type { DmSharePreview } from '../meta/shared-post-types';
import { analyzeImagePost } from './openai-post';
import type { PostMetadata, ProcessedPostRecord } from './types';

const PreviewState = Annotation.Root({
  preview: Annotation<DmSharePreview>(),
  jobId: Annotation<string | undefined>(),
  runDir: Annotation<string>(),
  imagePath: Annotation<string | undefined>(),
  visualAnalysis: Annotation<VisualAnalysis | undefined>(),
  llmCalls: Annotation<LlmCallRecord[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  finalRecord: Annotation<ProcessedPostRecord>(),
});

type PreviewStateType = typeof PreviewState.State;

async function setupJob(state: PreviewStateType) {
  const jobId = state.jobId ?? randomUUID();
  const runDir = path.join(getRunsDir(), jobId);
  await ensureDir(runDir);
  return { jobId, runDir };
}

async function downloadPreview(state: PreviewStateType) {
  const imagePath = path.join(state.runDir, 'preview.jpg');
  await downloadFile(state.preview.previewUrl, imagePath);
  return { imagePath };
}

async function analyze(state: PreviewStateType) {
  if (!state.imagePath) throw new Error('Missing preview image');

  const metadata: PostMetadata = {
    sourceUrl: state.preview.previewUrl,
    caption: state.preview.caption,
    hashtags: [],
    mentions: [],
    counts: {},
    raw: {
      ig_post_media_id: state.preview.mediaId,
      attachmentType: state.preview.attachmentType,
      dmSharePreview: true,
      storedAssetPath: state.imagePath,
    },
    postKind: 'image',
  };

  const result = await analyzeImagePost({
    metadata,
    imagePath: state.imagePath,
  });

  return {
    llmCalls: [result.llmCall],
    visualAnalysis: result.visualAnalysis,
  };
}

async function persistRecord(state: PreviewStateType) {
  if (!state.jobId || !state.visualAnalysis) {
    throw new Error('Missing jobId or visualAnalysis');
  }

  const llmCalls = state.llmCalls ?? [];
  const finalRecord: ProcessedPostRecord = {
    jobId: state.jobId,
    postUrl: state.preview.previewUrl,
    postKind: 'image',
    metadata: {
      sourceUrl: state.preview.previewUrl,
      caption: state.preview.caption,
      hashtags: [],
      mentions: [],
      counts: {},
      raw: {
        ig_post_media_id: state.preview.mediaId,
        attachmentType: state.preview.attachmentType,
        dmSharePreview: true,
        storedAssetPath: state.imagePath,
      },
      postKind: 'image',
    },
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

export const previewGraph = new StateGraph(PreviewState)
  .addNode('setupJob', setupJob)
  .addNode('downloadPreview', downloadPreview)
  .addNode('analyze', analyze)
  .addNode('persistRecord', persistRecord)
  .addEdge(START, 'setupJob')
  .addEdge('setupJob', 'downloadPreview')
  .addEdge('downloadPreview', 'analyze')
  .addEdge('analyze', 'persistRecord')
  .addEdge('persistRecord', END)
  .compile();

export async function processDmPreviewJob(
  preview: DmSharePreview,
  options?: { jobId?: string }
): Promise<ProcessedPostRecord> {
  const result = await previewGraph.invoke({
    preview,
    jobId: options?.jobId,
  });
  return result.finalRecord;
}

import type { LlmCallRecord } from './llm-pricing';

export type ApifyItem = Record<string, unknown>;

export type ReelMetadata = {
  sourceUrl: string;
  shortcode?: string;
  caption?: string;
  timestamp?: string;
  duration?: number;
  ownerUsername?: string;
  hashtags: string[];
  mentions: string[];
  counts: {
    likes?: number;
    comments?: number;
    views?: number;
    shares?: number;
  };
  raw: ApifyItem;
};

export type VisualAnalysis = {
  summary: string;
  topics: string[];
  entities: string[];
  products_or_places: string[];
  visual_objects: string[];
  scene_timeline: Array<{ frame: string; description: string }>;
  search_queries: string[];
  tags: string[];
  confidence: 'low' | 'medium' | 'high';
  safety_notes?: string[];
  raw_model_output?: string;
};

export type { LlmCallRecord, LlmTokenUsage } from './llm-pricing';

export type LlmUsageSummary = {
  calls: LlmCallRecord[];
  totals: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    costUsd: number;
  };
};

export type FinalRecord = {
  jobId: string;
  reelUrl: string;
  metadata: ReelMetadata;
  transcript: string;
  visualAnalysis: VisualAnalysis;
  llmUsage: LlmUsageSummary;
  assets: {
    videoPath?: string;
    audioPath?: string;
    framePaths: string[];
  };
  createdAt: string;
};

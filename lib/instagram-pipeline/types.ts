import type { LlmCallRecord } from '../reel-pipeline/llm-pricing';
import type {
  LlmUsageSummary,
  ReelMetadata,
  VisualAnalysis,
} from '../reel-pipeline/types';

export type PostKind = 'reel' | 'image' | 'carousel';

export type CarouselSlide = {
  index: number;
  shortCode?: string;
  type: string;
  displayUrl: string;
  alt?: string;
  url?: string;
  localPath?: string;
  analysis?: {
    description: string;
    visibleText?: string;
    tags?: string[];
  };
};

export type PostMetadata = ReelMetadata & {
  postKind: PostKind;
  apifyType?: string;
  productType?: string;
  slideCount?: number;
};

/** Unified processed record for reels, image posts, and carousels. */
export type ProcessedPostRecord = {
  jobId: string;
  postUrl: string;
  postKind: PostKind;
  metadata: PostMetadata;
  transcript?: string;
  visualAnalysis: VisualAnalysis;
  slides?: CarouselSlide[];
  llmUsage: LlmUsageSummary;
  assets?: {
    videoPath?: string;
    audioPath?: string;
    framePaths?: string[];
    imagePath?: string;
    slidePaths?: string[];
  };
  createdAt: string;
};

export type { LlmCallRecord };

export type SavePostMetadata = {
  postKind: PostKind;
  shortcode?: string;
  slideCount?: number;
  slides?: Array<{
    index: number;
    shortCode?: string;
    type: string;
    displayUrl: string;
    alt?: string;
    description?: string;
    visibleText?: string;
    tags?: string[];
  }>;
};

import fs from 'node:fs';
import path from 'node:path';
import {
  buildLlmCallRecord,
  type LlmCallRecord,
} from '../reel-pipeline/llm-pricing';
import type { AnalyzeResult } from '../reel-pipeline/openai-client';
import type { VisualAnalysis } from '../reel-pipeline/types';
import type { CarouselSlide, PostMetadata } from './types';
import {
  getOpenAIClient,
  parseJsonLoose,
  toStringArray,
  usageFromResponse,
} from './openai-shared';

export type ImageAnalyzeResult = AnalyzeResult;

function imageInputFromPath(imagePath: string) {
  const ext = path.extname(imagePath).toLowerCase();
  const mime =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : 'image/jpeg';
  const base64 = fs.readFileSync(imagePath).toString('base64');
  return {
    type: 'input_image' as const,
    image_url: `data:${mime};base64,${base64}`,
    detail: 'auto' as const,
  };
}

export async function analyzeImagePost(params: {
  metadata: PostMetadata;
  imagePath: string;
}): Promise<ImageAnalyzeResult> {
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini';
  const prompt = `
You are the understanding layer for Faye/FyndLater, an assistant that saves Instagram posts and makes them searchable later.

Analyze this Instagram image post using the metadata and the image.

Return ONLY valid JSON with this shape:
{
  "summary": "one paragraph user-facing summary",
  "topics": ["..."],
  "entities": ["people, brands, creators, etc"],
  "products_or_places": ["products, venues, destinations, dishes, apps, tools"],
  "visual_objects": ["objects/scenes visible"],
  "scene_timeline": [{ "frame": "image", "description": "what the image shows" }],
  "search_queries": ["phrases a user may later search for"],
  "tags": ["short normalized tags"],
  "confidence": "low|medium|high",
  "safety_notes": ["anything risky or unclear"]
}

Metadata:
${JSON.stringify({ ...params.metadata, raw: undefined }, null, 2)}
`.trim();

  const response = await getOpenAIClient().responses.create({
    model,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          imageInputFromPath(params.imagePath),
        ],
      },
    ],
  });

  return buildAnalyzeResult(response.output_text ?? '', response.usage, model);
}

export async function analyzeCarouselSlide(params: {
  metadata: PostMetadata;
  slide: CarouselSlide;
}): Promise<{ slide: CarouselSlide; llmCall: LlmCallRecord }> {
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini';
  if (!params.slide.localPath) {
    throw new Error(`Slide ${params.slide.index} missing localPath`);
  }

  const prompt = `
Analyze slide ${params.slide.index + 1} of an Instagram carousel.
Return ONLY JSON: { "description": "...", "visibleText": "...", "tags": ["..."] }

Carousel caption context:
${params.metadata.caption ?? 'No caption'}

Slide alt text:
${params.slide.alt ?? 'None'}
`.trim();

  const response = await getOpenAIClient().responses.create({
    model,
    input: [
      {
        role: 'user',
        content: [
          { type: 'input_text', text: prompt },
          imageInputFromPath(params.slide.localPath),
        ],
      },
    ],
  });

  const parsed = parseJsonLoose(response.output_text ?? '');
  const analysis = {
    description: String(parsed.description ?? params.slide.alt ?? ''),
    visibleText: parsed.visibleText ? String(parsed.visibleText) : undefined,
    tags: toStringArray(parsed.tags),
  };

  return {
    slide: { ...params.slide, analysis },
    llmCall: buildLlmCallRecord(
      'carousel_slide_analysis',
      model,
      usageFromResponse(response.usage)
    ),
  };
}

export async function synthesizeCarouselAnalysis(params: {
  metadata: PostMetadata;
  slides: CarouselSlide[];
}): Promise<AnalyzeResult> {
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini';
  const slideSummaries = params.slides.map((slide) => ({
    index: slide.index + 1,
    shortCode: slide.shortCode,
    type: slide.type,
    alt: slide.alt,
    analysis: slide.analysis,
  }));

  const prompt = `
You are the understanding layer for Faye/FyndLater.

Synthesize this Instagram carousel (${params.slides.length} slides) into one searchable record.
Use the caption and per-slide analyses below.

Return ONLY valid JSON with this shape:
{
  "summary": "one paragraph user-facing summary of the whole carousel",
  "topics": ["..."],
  "entities": ["..."],
  "products_or_places": ["..."],
  "visual_objects": ["..."],
  "scene_timeline": [{ "frame": "slide 1", "description": "..." }],
  "search_queries": ["..."],
  "tags": ["..."],
  "confidence": "low|medium|high",
  "safety_notes": ["..."]
}

Caption:
${params.metadata.caption ?? 'No caption'}

Slides:
${JSON.stringify(slideSummaries, null, 2)}
`.trim();

  const response = await getOpenAIClient().responses.create({
    model,
    input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }],
  });

  return buildAnalyzeResult(response.output_text ?? '', response.usage, model);
}

function buildAnalyzeResult(
  raw: string,
  usage: Parameters<typeof usageFromResponse>[0],
  model: string
): AnalyzeResult {
  const parsed = parseJsonLoose(raw);
  const visualAnalysis: VisualAnalysis = {
    summary: String(parsed.summary ?? raw.slice(0, 1000)),
    topics: toStringArray(parsed.topics),
    entities: toStringArray(parsed.entities),
    products_or_places: toStringArray(parsed.products_or_places),
    visual_objects: toStringArray(parsed.visual_objects),
    scene_timeline: Array.isArray(parsed.scene_timeline)
      ? parsed.scene_timeline.map((x: unknown) => ({
          frame: String((x as Record<string, unknown>)?.frame ?? ''),
          description: String(
            (x as Record<string, unknown>)?.description ?? ''
          ),
        }))
      : [],
    search_queries: toStringArray(parsed.search_queries),
    tags: toStringArray(parsed.tags),
    confidence:
      parsed.confidence === 'low' ||
      parsed.confidence === 'medium' ||
      parsed.confidence === 'high'
        ? parsed.confidence
        : 'medium',
    safety_notes: toStringArray(parsed.safety_notes),
    raw_model_output: raw,
  };

  return {
    visualAnalysis,
    llmCall: buildLlmCallRecord(
      'vision_analysis',
      model,
      usageFromResponse(usage)
    ),
  };
}

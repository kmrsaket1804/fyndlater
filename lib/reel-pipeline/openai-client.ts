import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import {
  buildLlmCallRecord,
  type LlmCallRecord,
  type LlmTokenUsage,
} from './llm-pricing';
import type { ReelMetadata, VisualAnalysis } from './types';

let openaiClient: OpenAI | undefined;

export function getOpenAI() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export type TranscribeResult = {
  transcript: string;
  llmCall: LlmCallRecord;
};

export type AnalyzeResult = {
  visualAnalysis: VisualAnalysis;
  llmCall: LlmCallRecord;
};

function emptyUsage(): LlmTokenUsage {
  return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
}

function usageFromTranscription(
  usage:
    | OpenAI.Audio.Transcriptions.Transcription.Tokens
    | OpenAI.Audio.Transcriptions.Transcription.Duration
    | undefined
): LlmTokenUsage {
  if (!usage) return emptyUsage();

  if (usage.type === 'duration') {
    return {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      audioSeconds: usage.seconds,
    };
  }

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    audioTokens: usage.input_token_details?.audio_tokens,
    cachedTokens: undefined,
  };
}

function usageFromResponse(
  usage: OpenAI.Responses.ResponseUsage | undefined
): LlmTokenUsage {
  if (!usage) return emptyUsage();

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    cachedTokens: usage.input_tokens_details?.cached_tokens,
    reasoningTokens: usage.output_tokens_details?.reasoning_tokens,
  };
}

export async function transcribeAudio(
  audioPath?: string
): Promise<TranscribeResult> {
  const model = process.env.OPENAI_TRANSCRIBE_MODEL ?? 'gpt-4o-mini-transcribe';

  if (!audioPath) {
    return {
      transcript: '',
      llmCall: buildLlmCallRecord('transcribe', model, emptyUsage()),
    };
  }

  const response = await getOpenAI().audio.transcriptions.create({
    model,
    file: fs.createReadStream(audioPath),
  });

  return {
    transcript: response.text ?? '',
    llmCall: buildLlmCallRecord(
      'transcribe',
      model,
      usageFromTranscription(response.usage)
    ),
  };
}

export async function analyzeFramesAndTranscript(params: {
  metadata: ReelMetadata;
  transcript: string;
  framePaths: string[];
}): Promise<AnalyzeResult> {
  const { metadata, transcript, framePaths } = params;
  const model = process.env.OPENAI_VISION_MODEL ?? 'gpt-4.1-mini';

  const imageInputs = framePaths.map((framePath) => {
    const base64 = fs.readFileSync(framePath).toString('base64');
    return {
      type: 'input_image' as const,
      image_url: `data:image/jpeg;base64,${base64}`,
      detail: 'auto' as const,
    };
  });

  const prompt = `
You are the understanding layer for Faye/FyndLater, an assistant that saves Instagram reels and makes them searchable later.

Analyze the reel using:
1. Instagram metadata
2. audio transcript
3. sampled video frames

Return ONLY valid JSON with this shape:
{
  "summary": "one paragraph user-facing summary",
  "topics": ["..."],
  "entities": ["people, brands, creators, etc"],
  "products_or_places": ["products, venues, destinations, dishes, apps, tools"],
  "visual_objects": ["objects/scenes visible in frames"],
  "scene_timeline": [{ "frame": "frame_001.jpg", "description": "what happens" }],
  "search_queries": ["phrases a user may later search for"],
  "tags": ["short normalized tags"],
  "confidence": "low|medium|high",
  "safety_notes": ["anything risky or unclear"]
}

Metadata:
${JSON.stringify({ ...metadata, raw: undefined }, null, 2)}

Transcript:
${transcript || 'No transcript extracted.'}
`.trim();

  const response = await getOpenAI().responses.create({
    model,
    input: [
      {
        role: 'user',
        content: [{ type: 'input_text', text: prompt }, ...imageInputs],
      },
    ],
  });

  const raw = response.output_text ?? '';
  const parsed = parseJsonLoose(raw);

  return {
    visualAnalysis: {
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
        : framePaths.map((p) => ({
            frame: path.basename(p),
            description: 'Sampled frame',
          })),
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
    },
    llmCall: buildLlmCallRecord(
      'vision_analysis',
      model,
      usageFromResponse(response.usage)
    ),
  };
}

function parseJsonLoose(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        /* ignore */
      }
    }
    return {};
  }
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string')
    : [];
}

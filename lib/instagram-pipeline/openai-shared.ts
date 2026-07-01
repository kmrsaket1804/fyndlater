import OpenAI from 'openai';
import type { LlmTokenUsage } from '../reel-pipeline/llm-pricing';

let openaiClient: OpenAI | undefined;

export function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY in environment');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export function usageFromResponse(
  usage: OpenAI.Responses.ResponseUsage | undefined
): LlmTokenUsage {
  if (!usage) {
    return { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  }

  return {
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.total_tokens,
    cachedTokens: usage.input_tokens_details?.cached_tokens,
    reasoningTokens: usage.output_tokens_details?.reasoning_tokens,
  };
}

export function parseJsonLoose(text: string): Record<string, unknown> {
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

export function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((x): x is string => typeof x === 'string')
    : [];
}

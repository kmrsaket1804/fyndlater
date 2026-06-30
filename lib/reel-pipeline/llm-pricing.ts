export type ModelPricing = {
  inputPer1M: number;
  outputPer1M: number;
  cachedInputPer1M?: number;
};

const MODEL_PRICING_USD: Record<string, ModelPricing> = {
  'gpt-4.1-mini': { inputPer1M: 0.4, outputPer1M: 1.6, cachedInputPer1M: 0.1 },
  'gpt-4o-mini-transcribe': { inputPer1M: 1.25, outputPer1M: 5.0 },
  'gpt-4o-transcribe': { inputPer1M: 2.5, outputPer1M: 10.0 },
};

export type LlmTokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cachedTokens?: number;
  reasoningTokens?: number;
  audioTokens?: number;
  audioSeconds?: number;
};

export type LlmCallRecord = {
  call: string;
  model: string;
  usage: LlmTokenUsage;
  costUsd: number;
  pricing: {
    inputPer1M: number;
    outputPer1M: number;
    cachedInputPer1M?: number;
  };
};

function resolvePricing(model: string): ModelPricing {
  const direct = MODEL_PRICING_USD[model];
  if (direct) return direct;

  const prefix = Object.keys(MODEL_PRICING_USD).find((key) =>
    model.startsWith(key)
  );
  if (prefix) return MODEL_PRICING_USD[prefix];

  return { inputPer1M: 0, outputPer1M: 0 };
}

export function calculateTokenCostUsd(
  model: string,
  usage: LlmTokenUsage
): { costUsd: number; pricing: ModelPricing } {
  const pricing = resolvePricing(model);
  const cachedTokens = usage.cachedTokens ?? 0;
  const billableInputTokens = Math.max(0, usage.inputTokens - cachedTokens);
  const cachedRate = pricing.cachedInputPer1M ?? pricing.inputPer1M;

  const inputCost = (billableInputTokens / 1_000_000) * pricing.inputPer1M;
  const cachedCost = (cachedTokens / 1_000_000) * cachedRate;
  const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputPer1M;

  return {
    costUsd: inputCost + cachedCost + outputCost,
    pricing,
  };
}

export function buildLlmCallRecord(
  call: string,
  model: string,
  usage: LlmTokenUsage
): LlmCallRecord {
  const { costUsd, pricing } = calculateTokenCostUsd(model, usage);
  return {
    call,
    model,
    usage,
    costUsd,
    pricing,
  };
}

export function summarizeLlmCalls(calls: LlmCallRecord[]) {
  return {
    inputTokens: calls.reduce((sum, call) => sum + call.usage.inputTokens, 0),
    outputTokens: calls.reduce((sum, call) => sum + call.usage.outputTokens, 0),
    totalTokens: calls.reduce((sum, call) => sum + call.usage.totalTokens, 0),
    costUsd: calls.reduce((sum, call) => sum + call.costUsd, 0),
  };
}

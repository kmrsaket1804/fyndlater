export type MergeConfidence = 'high' | 'medium' | 'low';

function normalizeText(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenOverlap(a: string, b: string) {
  const tokensA = new Set(normalizeText(a).split(' ').filter((t) => t.length > 2));
  const tokensB = new Set(normalizeText(b).split(' ').filter((t) => t.length > 2));
  if (!tokensA.size || !tokensB.size) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

export function scoreMergeMatch(params: {
  previewCaption?: string | null;
  previewSummary?: string | null;
  apifyCaption?: string | null;
  minutesSincePreview: number;
  pendingCount: number;
}): number {
  let score = 0;

  const previewText = params.previewCaption || params.previewSummary || '';
  const apifyText = params.apifyCaption || '';
  const overlap = tokenOverlap(previewText, apifyText);
  score += Math.round(overlap * 50);

  if (params.pendingCount === 1) {
    score += 25;
  }

  if (params.minutesSincePreview <= 3) {
    score += 15;
  } else if (params.minutesSincePreview <= 10) {
    score += 8;
  }

  if (previewText && apifyText && normalizeText(previewText) === normalizeText(apifyText)) {
    score += 20;
  }

  return Math.min(100, score);
}

export function confidenceFromScore(score: number): MergeConfidence {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

export function isMergeConfirmationText(text: string | null) {
  const normalized = (text ?? '').trim().toLowerCase();
  return ['yes', 'y', 'yeah', 'yep', 'merge', 'confirm'].includes(normalized);
}

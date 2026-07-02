import { createHash } from 'node:crypto';

/** Deterministic UUID-shaped id for idempotent Qdrant upserts. */
export function deterministicPointId(seed: string): string {
  const hash = createHash('sha256').update(seed).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    hash.slice(12, 16),
    hash.slice(16, 20),
    hash.slice(20, 32),
  ].join('-');
}

export function canonicalPointSeed(params: {
  canonicalKey: string;
  chunkType: string;
  chunkIndex?: number | null;
  embeddingVersion: string;
}) {
  return [
    'canonical',
    params.embeddingVersion,
    params.canonicalKey,
    params.chunkType,
    params.chunkIndex ?? 'doc',
  ].join(':');
}

export function userPointSeed(params: {
  userId: number;
  saveId: number;
  chunkType: string;
  chunkIndex?: number | null;
  embeddingVersion: string;
}) {
  return [
    'user',
    params.embeddingVersion,
    String(params.userId),
    String(params.saveId),
    params.chunkType,
    params.chunkIndex ?? 'doc',
  ].join(':');
}

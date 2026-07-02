import 'server-only';

export const EMBEDDING_MODEL = 'text-embedding-3-small';
export const EMBEDDING_DIMENSION = 1536;
export const EMBEDDING_VERSION =
  process.env.EMBEDDING_VERSION?.trim() || 'v1';

export const CANONICAL_COLLECTION = 'faye_canonical_content_v1';
export const USER_SAVES_COLLECTION = 'faye_user_saves_v1';

export function isSemanticRetrievalConfigured() {
  return Boolean(
    process.env.QDRANT_ENDPOINT?.trim() &&
      process.env.QDRANT_API_KEY?.trim() &&
      process.env.OPENAI_API_KEY?.trim()
  );
}

export function getQdrantConfig() {
  const url = process.env.QDRANT_ENDPOINT?.trim();
  const apiKey = process.env.QDRANT_API_KEY?.trim();
  if (!url || !apiKey) {
    throw new Error('QDRANT_ENDPOINT and QDRANT_API_KEY must be configured');
  }
  return { url, apiKey };
}

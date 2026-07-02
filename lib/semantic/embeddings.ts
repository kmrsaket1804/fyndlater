import 'server-only';

import { getOpenAI } from '@/lib/reel-pipeline/openai-client';
import { EMBEDDING_DIMENSION, EMBEDDING_MODEL } from './config';

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (!texts.length) {
    return [];
  }

  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSION,
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((row) => row.embedding);
}

export async function embedQuery(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  if (!vector) {
    throw new Error('Failed to generate query embedding');
  }
  return vector;
}

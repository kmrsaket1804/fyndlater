import 'server-only';

import { QdrantClient } from '@qdrant/js-client-rest';
import {
  CANONICAL_COLLECTION,
  EMBEDDING_DIMENSION,
  getQdrantConfig,
  USER_SAVES_COLLECTION,
} from './config';

let client: QdrantClient | null = null;
let collectionsReady = false;

export function getQdrantClient() {
  if (!client) {
    const { url, apiKey } = getQdrantConfig();
    client = new QdrantClient({ url, apiKey });
  }
  return client;
}

async function ensureCollection(name: string, payloadIndexes: Array<{ field: string; type: 'integer' | 'keyword' | 'bool' }>) {
  const qdrant = getQdrantClient();
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some((c) => c.name === name);

  if (!exists) {
    await qdrant.createCollection(name, {
      vectors: {
        size: EMBEDDING_DIMENSION,
        distance: 'Cosine',
      },
    });
  }

  for (const index of payloadIndexes) {
    try {
      await qdrant.createPayloadIndex(name, {
        field_name: index.field,
        field_schema: index.type,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.toLowerCase().includes('already exists')) {
        console.warn('[semantic] Payload index create skipped', {
          collection: name,
          field: index.field,
          message,
        });
      }
    }
  }
}

export async function ensureQdrantCollections() {
  if (collectionsReady) {
    return;
  }

  await ensureCollection(CANONICAL_COLLECTION, [
    { field: 'canonical_key', type: 'keyword' },
    { field: 'chunk_type', type: 'keyword' },
    { field: 'embedding_version', type: 'keyword' },
  ]);

  await ensureCollection(USER_SAVES_COLLECTION, [
    { field: 'user_id', type: 'integer' },
    { field: 'user_save_id', type: 'integer' },
    { field: 'deleted', type: 'bool' },
    { field: 'chunk_type', type: 'keyword' },
  ]);

  collectionsReady = true;
}

export async function upsertCanonicalVector(params: {
  pointId: string;
  vector: number[];
  payload: Record<string, unknown>;
}) {
  await ensureQdrantCollections();
  const qdrant = getQdrantClient();
  await qdrant.upsert(CANONICAL_COLLECTION, {
    wait: true,
    points: [
      {
        id: params.pointId,
        vector: params.vector,
        payload: params.payload,
      },
    ],
  });
}

export async function upsertUserSaveVector(params: {
  pointId: string;
  vector: number[];
  payload: Record<string, unknown>;
}) {
  await ensureQdrantCollections();
  const qdrant = getQdrantClient();
  await qdrant.upsert(USER_SAVES_COLLECTION, {
    wait: true,
    points: [
      {
        id: params.pointId,
        vector: params.vector,
        payload: params.payload,
      },
    ],
  });
}

export async function retrieveCanonicalVector(pointId: string) {
  await ensureQdrantCollections();
  const qdrant = getQdrantClient();
  const result = await qdrant.retrieve(CANONICAL_COLLECTION, {
    ids: [pointId],
    with_vector: true,
  });
  const point = result[0];
  if (!point?.vector || !Array.isArray(point.vector)) {
    return null;
  }
  return point.vector as number[];
}

export async function searchUserSaveVectors(params: {
  userId: number;
  vector: number[];
  limit?: number;
}) {
  await ensureQdrantCollections();
  const qdrant = getQdrantClient();
  return qdrant.search(USER_SAVES_COLLECTION, {
    vector: params.vector,
    limit: params.limit ?? 24,
    with_payload: true,
    filter: {
      must: [
        { key: 'user_id', match: { value: params.userId } },
        { key: 'deleted', match: { value: false } },
      ],
    },
  });
}

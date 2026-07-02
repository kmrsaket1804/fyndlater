import 'server-only';

import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  canonicalContent,
  saveEmbeddingPoints,
  saveTags,
  savedItems,
  saves,
} from '@/lib/db/schema';
import type { ProcessedSaveRecord } from '@/lib/instagram-pipeline/processed-save';
import { EMBEDDING_VERSION, isSemanticRetrievalConfigured } from './config';
import { embedTexts } from './embeddings';
import {
  buildSearchChunksFromNote,
  buildSearchChunksFromRecord,
  buildSearchChunksFromSaveRow,
  type SearchChunk,
} from './search-text';
import {
  canonicalPointSeed,
  deterministicPointId,
  userPointSeed,
} from './point-id';
import {
  retrieveCanonicalVector,
  upsertCanonicalVector,
  upsertUserSaveVector,
} from './qdrant';

type IndexSaveParams = {
  saveId: number;
  userId: number;
  savedItemId?: number;
  canonicalKey?: string | null;
  record?: ProcessedSaveRecord;
  noteText?: string;
  collection?: string | null;
  tags?: string[];
  title?: string | null;
  summary?: string | null;
};

async function loadSaveContext(saveId: number) {
  const [save] = await db.select().from(saves).where(eq(saves.id, saveId)).limit(1);
  if (!save?.userId) {
    return null;
  }

  const tags = await db
    .select({ tag: saveTags.tag })
    .from(saveTags)
    .where(eq(saveTags.saveId, saveId));

  let savedItemId: number | undefined;
  const [item] = await db
    .select({ id: savedItems.id })
    .from(savedItems)
    .where(sql`${savedItems.metadata}->>'saveId' = ${String(saveId)}`)
    .limit(1);

  if (item) {
    savedItemId = item.id;
  }

  return {
    save,
    userId: save.userId,
    tags: tags.map((row) => row.tag),
    savedItemId,
  };
}

async function getOrCreateCanonicalVector(params: {
  canonicalKey: string;
  chunk: SearchChunk;
}) {
  const chunkIndex =
    params.chunk.chunkType === 'slide' ? params.chunk.chunkIndex ?? 0 : null;

  const [existing] = await db
    .select()
    .from(canonicalContent)
    .where(
      and(
        eq(canonicalContent.canonicalKey, params.canonicalKey),
        eq(canonicalContent.chunkType, params.chunk.chunkType),
        eq(canonicalContent.embeddingVersion, EMBEDDING_VERSION),
        params.chunk.chunkType === 'slide'
          ? eq(canonicalContent.chunkIndex, chunkIndex ?? 0)
          : isNull(canonicalContent.chunkIndex)
      )
    )
    .limit(1);

  if (existing) {
    const cached = await retrieveCanonicalVector(existing.qdrantPointId);
    if (cached) {
      return { vector: cached, pointId: existing.qdrantPointId };
    }
  }

  const pointId = deterministicPointId(
    canonicalPointSeed({
      canonicalKey: params.canonicalKey,
      chunkType: params.chunk.chunkType,
      chunkIndex,
      embeddingVersion: EMBEDDING_VERSION,
    })
  );

  const [vector] = await embedTexts([params.chunk.searchText]);
  if (!vector) {
    throw new Error('Failed to embed canonical search text');
  }

  await upsertCanonicalVector({
    pointId,
    vector,
    payload: {
      canonical_key: params.canonicalKey,
      chunk_type: params.chunk.chunkType,
      chunk_index: chunkIndex,
      embedding_version: EMBEDDING_VERSION,
    },
  });

  if (existing) {
    await db
      .update(canonicalContent)
      .set({
        searchText: params.chunk.searchText,
        qdrantPointId: pointId,
        updatedAt: new Date(),
      })
      .where(eq(canonicalContent.id, existing.id));
  } else {
    await db.insert(canonicalContent).values({
      canonicalKey: params.canonicalKey,
      chunkType: params.chunk.chunkType,
      chunkIndex,
      embeddingVersion: EMBEDDING_VERSION,
      searchText: params.chunk.searchText,
      qdrantPointId: pointId,
    });
  }

  return { vector, pointId };
}

async function upsertUserPoint(params: {
  saveId: number;
  userId: number;
  savedItemId?: number;
  canonicalKey?: string | null;
  chunk: SearchChunk;
  vector: number[];
}) {
  const chunkIndex =
    params.chunk.chunkType === 'slide' ? params.chunk.chunkIndex ?? 0 : null;

  const pointId = deterministicPointId(
    userPointSeed({
      userId: params.userId,
      saveId: params.saveId,
      chunkType: params.chunk.chunkType,
      chunkIndex,
      embeddingVersion: EMBEDDING_VERSION,
    })
  );

  await upsertUserSaveVector({
    pointId,
    vector: params.vector,
    payload: {
      user_id: params.userId,
      user_save_id: params.saveId,
      saved_item_id: params.savedItemId ?? null,
      canonical_key: params.canonicalKey ?? null,
      chunk_type: params.chunk.chunkType,
      chunk_index: chunkIndex,
      embedding_version: EMBEDDING_VERSION,
      deleted: false,
    },
  });

  const [existing] = await db
    .select()
    .from(saveEmbeddingPoints)
    .where(eq(saveEmbeddingPoints.qdrantPointId, pointId))
    .limit(1);

  if (existing) {
    await db
      .update(saveEmbeddingPoints)
      .set({
        deleted: false,
        canonicalKey: params.canonicalKey ?? null,
        savedItemId: params.savedItemId ?? null,
        updatedAt: new Date(),
      })
      .where(eq(saveEmbeddingPoints.id, existing.id));
  } else {
    await db.insert(saveEmbeddingPoints).values({
      saveId: params.saveId,
      userId: params.userId,
      savedItemId: params.savedItemId ?? null,
      canonicalKey: params.canonicalKey ?? null,
      qdrantPointId: pointId,
      chunkType: params.chunk.chunkType,
      chunkIndex,
      embeddingVersion: EMBEDDING_VERSION,
      deleted: false,
    });
  }
}

async function indexChunk(params: {
  saveId: number;
  userId: number;
  savedItemId?: number;
  canonicalKey?: string | null;
  chunk: SearchChunk;
}) {
  let vector: number[];

  if (params.canonicalKey) {
    const canonical = await getOrCreateCanonicalVector({
      canonicalKey: params.canonicalKey,
      chunk: params.chunk,
    });
    vector = canonical.vector;
  } else {
    const [embedded] = await embedTexts([params.chunk.searchText]);
    if (!embedded) {
      throw new Error('Failed to embed user-only search text');
    }
    vector = embedded;
  }

  await upsertUserPoint({
    saveId: params.saveId,
    userId: params.userId,
    savedItemId: params.savedItemId,
    canonicalKey: params.canonicalKey,
    chunk: params.chunk,
    vector,
  });
}

export async function indexSaveForRetrieval(input: IndexSaveParams) {
  if (!isSemanticRetrievalConfigured()) {
    console.warn('[semantic] Skipping indexing — Qdrant/OpenAI not configured');
    return { indexed: false as const, reason: 'not_configured' as const };
  }

  const context = await loadSaveContext(input.saveId);
  if (!context) {
    return { indexed: false as const, reason: 'missing_user' as const };
  }

  const userId = input.userId || context.userId;
  const savedItemId = input.savedItemId ?? context.savedItemId;
  const tags = input.tags ?? context.tags;
  const canonicalKey = input.canonicalKey ?? context.save.canonicalKey;

  let chunks: SearchChunk[] = [];
  if (input.record) {
    chunks = buildSearchChunksFromRecord(input.record, {
      collection: input.collection,
      tags,
    });
  } else if (input.noteText) {
    chunks = buildSearchChunksFromNote({
      text: input.noteText,
      title: input.title ?? context.save.title,
      summary: input.summary ?? context.save.description,
      tags,
      collection: input.collection,
    });
  } else {
    chunks = buildSearchChunksFromSaveRow({
      title: input.title ?? context.save.title,
      description: input.summary ?? context.save.description,
      tags,
      collection: input.collection,
    });
  }

  if (!chunks.length) {
    return { indexed: false as const, reason: 'empty_search_text' as const };
  }

  for (const chunk of chunks) {
    await indexChunk({
      saveId: input.saveId,
      userId,
      savedItemId,
      canonicalKey,
      chunk,
    });
  }

  if (savedItemId) {
    await db
      .update(savedItems)
      .set({ embeddingStatus: 'ready' })
      .where(eq(savedItems.id, savedItemId));
  }

  console.info('[semantic] Indexed save for retrieval', {
    saveId: input.saveId,
    userId,
    chunkCount: chunks.length,
    canonicalKey,
  });

  return { indexed: true as const, chunkCount: chunks.length };
}

export async function indexProcessedSave(params: {
  saveId: number;
  record: ProcessedSaveRecord;
  savedItemId?: number;
  instagramMessageId?: string;
  canonicalKey?: string | null;
  tags?: string[];
}) {
  const context = await loadSaveContext(params.saveId);
  if (!context) {
    return { indexed: false as const, reason: 'missing_user' as const };
  }

  let savedItemId = params.savedItemId ?? context.savedItemId;
  if (!savedItemId && params.instagramMessageId) {
    const [item] = await db
      .select({ id: savedItems.id })
      .from(savedItems)
      .where(eq(savedItems.sourceMessageId, params.instagramMessageId))
      .limit(1);
    savedItemId = item?.id;
  }

  return indexSaveForRetrieval({
    saveId: params.saveId,
    userId: context.userId,
    savedItemId,
    canonicalKey: params.canonicalKey ?? context.save.canonicalKey,
    record: params.record,
    tags: params.tags ?? context.tags,
    title: context.save.title,
    summary: context.save.description,
  });
}

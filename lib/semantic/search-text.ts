import type { ProcessedPostRecord } from '@/lib/instagram-pipeline/types';
import {
  isProcessedPostRecord,
  type ProcessedSaveRecord,
} from '@/lib/instagram-pipeline/processed-save';

export type SearchChunk = {
  chunkType: 'document' | 'slide';
  chunkIndex?: number;
  searchText: string;
};

function joinParts(parts: Array<string | null | undefined>) {
  return parts
    .flatMap((part) =>
      typeof part === 'string'
        ? part
            .split(/[\n,|]+/)
            .map((piece) => piece.trim())
            .filter(Boolean)
        : []
    )
    .join('\n');
}

function ocrFromRecord(record: ProcessedSaveRecord) {
  if (!isProcessedPostRecord(record)) {
    return joinParts(
      record.visualAnalysis.scene_timeline?.map((scene) => scene.description) ?? []
    );
  }

  const slideOcr =
    record.slides?.map((slide) => slide.analysis?.visibleText).filter(Boolean) ??
    [];

  const timelineOcr =
    record.visualAnalysis.scene_timeline?.map((scene) => scene.description) ?? [];

  return joinParts([...slideOcr, ...timelineOcr]);
}

function baseDocumentParts(
  record: ProcessedSaveRecord,
  extras?: { collection?: string | null; tags?: string[] }
) {
  const caption = isProcessedPostRecord(record)
    ? record.metadata.caption
    : record.metadata.caption;
  const transcript = isProcessedPostRecord(record)
    ? record.transcript
    : record.transcript;

  return joinParts([
    caption,
    transcript,
    ocrFromRecord(record),
    record.visualAnalysis.summary,
    extras?.collection,
    extras?.tags?.join(', '),
    record.visualAnalysis.tags.join(', '),
    record.visualAnalysis.topics.join(', '),
    record.visualAnalysis.entities.join(', '),
    record.visualAnalysis.products_or_places.join(', '),
  ]);
}

export function buildSearchChunksFromRecord(
  record: ProcessedSaveRecord,
  extras?: { collection?: string | null; tags?: string[] }
): SearchChunk[] {
  const documentText = baseDocumentParts(record, extras);
  const chunks: SearchChunk[] = [
    { chunkType: 'document', searchText: documentText },
  ];

  if (isProcessedPostRecord(record) && record.slides?.length) {
    for (const slide of record.slides) {
      chunks.push({
        chunkType: 'slide',
        chunkIndex: slide.index,
        searchText: joinParts([
          record.metadata.caption,
          slide.analysis?.description,
          slide.analysis?.visibleText,
          slide.alt,
          slide.analysis?.tags?.join(', '),
        ]),
      });
    }
  }

  return chunks.filter((chunk) => chunk.searchText.trim().length > 0);
}

export function buildSearchChunksFromNote(params: {
  text: string;
  title?: string | null;
  summary?: string | null;
  tags?: string[];
  collection?: string | null;
}): SearchChunk[] {
  const searchText = joinParts([
    params.title,
    params.text,
    params.summary,
    params.collection,
    params.tags?.join(', '),
  ]);

  if (!searchText.trim()) {
    return [];
  }

  return [{ chunkType: 'document', searchText }];
}

export function buildSearchChunksFromSaveRow(params: {
  title?: string | null;
  description?: string | null;
  tags?: string[];
  collection?: string | null;
}): SearchChunk[] {
  const searchText = joinParts([
    params.title,
    params.description,
    params.collection,
    params.tags?.join(', '),
  ]);

  if (!searchText.trim()) {
    return [];
  }

  return [{ chunkType: 'document', searchText }];
}

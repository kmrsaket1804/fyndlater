import type { FinalRecord } from '../reel-pipeline/types';
import type { ProcessedPostRecord } from './types';

export type ProcessedSaveRecord = FinalRecord | ProcessedPostRecord;

export function isProcessedPostRecord(
  record: ProcessedSaveRecord
): record is ProcessedPostRecord {
  return 'postKind' in record && record.postKind !== undefined;
}

export function postUrlFromRecord(record: ProcessedSaveRecord): string {
  return isProcessedPostRecord(record) ? record.postUrl : record.reelUrl;
}

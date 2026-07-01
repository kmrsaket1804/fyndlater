export const REEL_JOBS_TOPIC = 'reel-jobs';

export type ReelQueueMessage = {
  reelUrl: string;
  jobId: string;
  saveId: number;
  teamId: number;
  userId?: number;
  dedupeKey?: string;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
};

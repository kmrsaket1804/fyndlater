export const REEL_JOBS_TOPIC = 'reel-jobs';

export type PostQueueMessage = {
  /** Canonical Instagram post URL (/p/, /reel/, or /tv/). */
  postUrl?: string;
  /** @deprecated Use postUrl — kept for in-flight queue messages. */
  reelUrl?: string;
  /** Instagram DM share preview when Meta only provides a CDN image URL. */
  dmPreview?: {
    previewUrl: string;
    caption?: string;
    mediaId?: string;
    attachmentType: string;
  };
  jobId: string;
  saveId: number;
  teamId: number;
  userId?: number;
  dedupeKey?: string;
  savedItemId?: number;
  instagramMessageId?: string;
  instagramSenderId?: string;
};

/** @deprecated Use PostQueueMessage */
export type ReelQueueMessage = PostQueueMessage;

export type InstagramMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'shared_post'
  | 'unknown';

export type InstagramIntent =
  | 'ACCOUNT_LINK'
  | 'SAVE_CONTENT'
  | 'RETRIEVE_CONTENT'
  | 'HELP'
  | 'UNKNOWN';

export type NormalizedInstagramEvent = {
  channel: 'instagram';
  provider: 'meta';
  sender_igsid: string;
  recipient_ig_id: string;
  message_id: string;
  message_type: InstagramMessageType;
  text: string | null;
  attachments: InstagramAttachment[];
  timestamp: string;
  raw_payload_id: number;
};

export type InstagramAttachment = {
  type: string;
  url?: string;
  payload?: Record<string, unknown>;
};

export const META_REPLY = {
  received: 'Saved ✨ Faye received this.',
  organizing: "Saved ✨ I'm organizing this for you.",
  unlinked:
    "Hi, I'm Faye ✨ To connect, open fyndlater.com/dashboard/connect and send me your connect code.",
  retrieve: 'Found it ✨ Here are the closest saves.',
  help: 'Send me reels, links, screenshots, or notes — I\'ll save and organize them. Ask naturally to find them later.',
} as const;

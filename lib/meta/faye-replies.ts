import type { EnrichmentStatus } from './canonical-key';

export type SaveReplyKind =
  | 'reel_queued'
  | 'reel_cached'
  | 'post_queued'
  | 'post_cached'
  | 'shared_post_preview'
  | 'shared_carousel_preview'
  | 'merge_success'
  | 'merge_uncertain'
  | 'merge_separate'
  | 'duplicate_user'
  | 'global_cached'
  | 'direct_image'
  | 'text_note'
  | 'quota_exceeded'
  | 'default';

export const FAYE_REPLY = {
  reelQueued: "Saved ✨ I'm reading this reel and organizing it for you.",
  postQueued: "Saved ✨ I'm reading this post and organizing it for you.",
  sharedPostPreview:
    'Saved ✨ I captured the visible post and organized it for you. Send the post link if you want the full version saved too.',
  /** @deprecated Alias — ig_post shares cannot be typed as carousel vs single image. */
  sharedCarouselPreview:
    'Saved ✨ I captured the visible post and organized it for you. Send the post link if you want the full version saved too.',
  mergeSuccess:
    'Perfect ✨ I found the link and upgraded this save with the full post details.',
  mergeUncertain:
    "Is this link for the preview you just sent? Reply “yes” and I'll merge them.",
  mergeSeparate:
    "Saved this link too ✨ It may not match the preview you sent earlier, so I've kept them separate for now.",
  globalCached:
    "Saved ✨ I already knew this one, so I've added it to your memory.",
  duplicateUser:
    "You had already saved this ✨ I've updated your saved copy.",
  directImage: 'Saved ✨ I captured this image and organized it for you.',
  textNote: "Noted ✨ I'll remember this for you.",
  quotaExceeded:
    "You've reached your monthly save limit ✨ Upgrade to Pro on fyndlater.com for more.",
} as const;

export function immediateReplyForSave(kind: SaveReplyKind) {
  switch (kind) {
    case 'reel_queued':
      return FAYE_REPLY.reelQueued;
    case 'post_queued':
      return FAYE_REPLY.postQueued;
    case 'reel_cached':
    case 'post_cached':
    case 'global_cached':
      return FAYE_REPLY.globalCached;
    case 'shared_post_preview':
    case 'shared_carousel_preview':
      return FAYE_REPLY.sharedPostPreview;
    case 'merge_success':
      return FAYE_REPLY.mergeSuccess;
    case 'merge_uncertain':
      return FAYE_REPLY.mergeUncertain;
    case 'merge_separate':
      return FAYE_REPLY.mergeSeparate;
    case 'duplicate_user':
      return FAYE_REPLY.duplicateUser;
    case 'direct_image':
      return FAYE_REPLY.directImage;
    case 'text_note':
      return FAYE_REPLY.textNote;
    case 'quota_exceeded':
      return FAYE_REPLY.quotaExceeded;
    default:
      return FAYE_REPLY.postQueued;
  }
}

export function enrichmentStatusForDmPreview(): EnrichmentStatus {
  // Cannot distinguish carousel vs single image — enable merge via awaiting_link.
  return 'awaiting_link';
}

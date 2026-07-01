import {
  getInstagramIdentity,
  markWebhookEventProcessed,
} from './queries';
import {
  connectCodeReply,
  extractConnectCode,
  redeemConnectCode,
} from '@/lib/instagram/connect';
import { extractInstagramPostUrlFromEvent } from './extract-reel-url';
import {
  extractShortcode,
  inferUrlPipelineKind,
} from '@/lib/instagram-pipeline/post-url';
import { routeInstagramIntent } from './router';
import { saveInstagramContent } from './save-from-instagram';
import { sendInstagramMessage } from './send-message';
import { META_REPLY, type NormalizedInstagramEvent } from './types';

function messageContextLabel(event: NormalizedInstagramEvent) {
  const postUrl = extractInstagramPostUrlFromEvent(event);
  const shortcode = postUrl ? extractShortcode(postUrl) : null;

  if (shortcode) {
    const kind = postUrl ? inferUrlPipelineKind(postUrl) : null;
    if (kind === 'reel') return `Re: reel /${shortcode}`;
    return `Re: post /${shortcode}`;
  }

  if (event.text?.trim()) {
    const preview = event.text.trim().replace(/\s+/g, ' ');
    return `Re: ${preview.length > 48 ? `${preview.slice(0, 47)}…` : preview}`;
  }

  if (event.message_type === 'shared_post') {
    return 'Re: your shared post';
  }

  return 'Re: your message';
}

function replyForIntent(
  intent: ReturnType<typeof routeInstagramIntent>,
  isLinked: boolean,
  saveResult?: Awaited<ReturnType<typeof saveInstagramContent>> | null
) {
  if (saveResult?.status === 'quota_exceeded') {
    return "You've reached your monthly save limit ✨ Upgrade to Pro on fyndlater.com for more.";
  }

  if (saveResult?.status === 'saved' && saveResult.postUrl) {
    const kind = inferUrlPipelineKind(saveResult.postUrl);
    if (saveResult.processing === 'queued') {
      if (kind === 'feed_post') {
        return "Saved ✨ I'm analyzing this post for you — I'll reply here when it's ready.";
      }
      return "Saved ✨ I'm analyzing this reel for you — I'll reply here when it's ready.";
    }
    return META_REPLY.organizing;
  }

  switch (intent) {
    case 'ACCOUNT_LINK':
      return isLinked
        ? 'Your Instagram is already connected to FyndLater ✨'
        : META_REPLY.unlinked;
    case 'RETRIEVE_CONTENT':
      return isLinked ? META_REPLY.retrieve : META_REPLY.unlinked;
    case 'HELP':
      return META_REPLY.help;
    case 'SAVE_CONTENT':
    case 'UNKNOWN':
    default:
      return isLinked ? META_REPLY.organizing : META_REPLY.received;
  }
}

async function replyToEvent(
  event: NormalizedInstagramEvent,
  text: string
) {
  return sendInstagramMessage(event.sender_igsid, text, {
    replyToMessageId: event.message_id,
    contextLabel: messageContextLabel(event),
  });
}

export async function processInstagramEvent(event: NormalizedInstagramEvent) {
  try {
    const identity = await getInstagramIdentity(event.sender_igsid);
    const isLinked =
      identity?.status === 'linked' && Boolean(identity.fyndlaterUserId);

    const intent = routeInstagramIntent(event.text);

    if (event.message_type === 'unknown' && !event.text) {
      await markWebhookEventProcessed(event.raw_payload_id, 'ignored');
      return;
    }

    const connectCode = extractConnectCode(event.text);
    if (connectCode) {
      const redeemResult = await redeemConnectCode(
        connectCode,
        event.sender_igsid
      );
      const replyText = connectCodeReply(redeemResult);
      const result = await replyToEvent(event, replyText);

      if (!result.success && !result.rateLimited) {
        await markWebhookEventProcessed(
          event.raw_payload_id,
          'failed',
          'Failed to send Instagram reply'
        );
        return;
      }

      await markWebhookEventProcessed(event.raw_payload_id, 'processed');
      return;
    }

    let saveResult: Awaited<ReturnType<typeof saveInstagramContent>> | null =
      null;

    if (
      isLinked &&
      identity?.fyndlaterUserId &&
      (intent === 'SAVE_CONTENT' || intent === 'UNKNOWN')
    ) {
      saveResult = await saveInstagramContent({
        event,
        fyndlaterUserId: identity.fyndlaterUserId,
      });
    }

    if (!(saveResult?.status === 'saved' && saveResult.skipReply)) {
      const replyText = replyForIntent(intent, isLinked, saveResult);
      const result = await replyToEvent(event, replyText);

      if (!result.success && !result.rateLimited) {
        await markWebhookEventProcessed(
          event.raw_payload_id,
          'failed',
          'Failed to send Instagram reply'
        );
        return;
      }
    }

    if (saveResult?.status === 'error') {
      await markWebhookEventProcessed(
        event.raw_payload_id,
        'failed',
        saveResult.message
      );
      return;
    }

    await markWebhookEventProcessed(event.raw_payload_id, 'processed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed';
    console.error('[meta] Event processing error:', message);
    await markWebhookEventProcessed(event.raw_payload_id, 'failed', message);
  }
}

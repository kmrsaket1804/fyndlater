import {
  getInstagramIdentity,
  markWebhookEventProcessed,
} from './queries';
import {
  connectCodeReply,
  extractConnectCode,
  redeemConnectCode,
} from '@/lib/instagram/connect';
import { routeInstagramIntent } from './router';
import { saveInstagramContent } from './save-from-instagram';
import { sendInstagramMessage } from './send-message';
import { META_REPLY, type NormalizedInstagramEvent } from './types';

function replyForIntent(
  intent: ReturnType<typeof routeInstagramIntent>,
  isLinked: boolean,
  saveResult?: Awaited<ReturnType<typeof saveInstagramContent>> | null
) {
  if (saveResult?.status === 'quota_exceeded') {
    return "You've reached your monthly save limit ✨ Upgrade to Pro on fyndlater.com for more.";
  }

  if (saveResult?.status === 'saved' && saveResult.reelUrl) {
    if (saveResult.processing === 'cache') {
      return 'Saved ✨ I already analyzed this reel — added to your library.';
    }
    if (saveResult.processing === 'queued') {
      return "Saved ✨ I'm analyzing this reel for you.";
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
      const result = await sendInstagramMessage(event.sender_igsid, replyText);

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

    const replyText = replyForIntent(intent, isLinked, saveResult);
    const result = await sendInstagramMessage(event.sender_igsid, replyText);

    if (!result.success && !result.rateLimited) {
      await markWebhookEventProcessed(
        event.raw_payload_id,
        'failed',
        'Failed to send Instagram reply'
      );
      return;
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

import {
  getInstagramIdentity,
  markWebhookEventProcessed,
} from './queries';
import { routeInstagramIntent } from './router';
import { sendInstagramMessage } from './send-message';
import { META_REPLY, type NormalizedInstagramEvent } from './types';

function replyForIntent(
  intent: ReturnType<typeof routeInstagramIntent>,
  isLinked: boolean
) {
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
    const replyText = replyForIntent(intent, isLinked);

    // Phase 1: acknowledge all inbound message types with a safe default reply.
    if (event.message_type === 'unknown' && !event.text) {
      await markWebhookEventProcessed(event.raw_payload_id, 'ignored');
      return;
    }

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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Processing failed';
    console.error('[meta] Event processing error:', message);
    await markWebhookEventProcessed(event.raw_payload_id, 'failed', message);
  }
}

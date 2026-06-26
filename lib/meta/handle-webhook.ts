import {
  getWebhookEventType,
  parseMetaWebhookPayload,
} from './parse-webhook';
import { processInstagramEvent } from './process-event';
import {
  markWebhookEventProcessed,
  storeRawWebhookEvent,
} from './queries';

export async function handleMetaWebhookPayload(payload: unknown) {
  const parsed = payload as Parameters<typeof parseMetaWebhookPayload>[0];

  if (!parsed?.entry?.length) {
    console.info('[meta] Webhook received with no entries');
    return;
  }

  for (const entry of parsed.entry) {
    for (const messaging of entry.messaging || []) {
      const messageId = messaging.message?.mid;
      if (!messageId) {
        continue;
      }

      const stored = await storeRawWebhookEvent({
        providerEventId: messageId,
        senderIgsid: messaging.sender?.id ?? null,
        eventType: messaging.message
          ? `message.${messaging.message.attachments?.[0]?.type || 'text'}`
          : 'unknown',
        rawPayload: messaging,
      });

      if (!stored) {
        console.info(`[meta] Duplicate webhook ignored: ${messageId}`);
        continue;
      }

      const events = parseMetaWebhookPayload(parsed, stored.id);

      if (events.length === 0) {
        await markWebhookEventProcessed(stored.id, 'ignored');
        continue;
      }
      for (const event of events) {
        if (event.message_id !== messageId) {
          continue;
        }

        console.info('[meta] Processing Instagram DM', {
          sender: event.sender_igsid,
          messageId: event.message_id,
          type: event.message_type,
          textPreview: event.text?.slice(0, 80) ?? null,
        });

        await processInstagramEvent(event);
      }
    }
  }
}

export { getWebhookEventType };

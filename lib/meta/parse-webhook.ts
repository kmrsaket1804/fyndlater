import type {
  InstagramAttachment,
  InstagramMessageType,
  NormalizedInstagramEvent,
} from './types';

type MetaMessagingEvent = {
  sender?: { id?: string };
  recipient?: { id?: string };
  timestamp?: number;
  message?: {
    mid?: string;
    text?: string;
    attachments?: Array<{
      type?: string;
      payload?: { url?: string; [key: string]: unknown };
    }>;
    is_echo?: boolean;
  };
};

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string;
    time?: number;
    messaging?: MetaMessagingEvent[];
  }>;
};

function mapAttachmentType(type?: string): InstagramMessageType {
  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    case 'share':
    case 'ig_reel':
    case 'story_mention':
      return 'shared_post';
    default:
      return 'unknown';
  }
}

function inferMessageType(
  message: NonNullable<MetaMessagingEvent['message']>
): InstagramMessageType {
  if (message.text) {
    return 'text';
  }

  const first = message.attachments?.[0];
  if (!first) {
    return 'unknown';
  }

  return mapAttachmentType(first.type);
}

function mapAttachments(
  attachments?: Array<{
    type?: string;
    payload?: { url?: string; [key: string]: unknown };
  }>
): InstagramAttachment[] {
  if (!attachments?.length) {
    return [];
  }

  return attachments.map((attachment) => ({
    type: attachment.type || 'unknown',
    url: attachment.payload?.url,
    payload: attachment.payload,
  }));
}

export function parseMetaWebhookPayload(
  payload: MetaWebhookPayload,
  rawPayloadId: number
): NormalizedInstagramEvent[] {
  if (payload.object !== 'instagram' || !payload.entry?.length) {
    return [];
  }

  const events: NormalizedInstagramEvent[] = [];

  for (const entry of payload.entry) {
    for (const messaging of entry.messaging || []) {
      const message = messaging.message;
      if (!message?.mid) {
        continue;
      }

      // Ignore echoes sent by our own account.
      if (message.is_echo) {
        continue;
      }

      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id || entry.id;
      if (!senderId || !recipientId) {
        continue;
      }

      events.push({
        channel: 'instagram',
        provider: 'meta',
        sender_igsid: senderId,
        recipient_ig_id: recipientId,
        message_id: message.mid,
        message_type: inferMessageType(message),
        text: message.text ?? null,
        attachments: mapAttachments(message.attachments),
        timestamp: new Date(
          messaging.timestamp || entry.time || Date.now()
        ).toISOString(),
        raw_payload_id: rawPayloadId,
      });
    }
  }

  return events;
}

export function getWebhookEventType(
  event: NormalizedInstagramEvent
): string {
  return `message.${event.message_type}`;
}

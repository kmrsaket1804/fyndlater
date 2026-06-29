import { db } from '@/lib/db/drizzle';
import {
  instagramIdentities,
  instagramWebhookEvents,
  outboundMessages,
} from '@/lib/db/schema';
import { eq, and, gte, sql } from 'drizzle-orm';

const MAX_OUTBOUND_PER_MINUTE = 10;
const MAX_OUTBOUND_PER_HOUR = 60;

export async function storeRawWebhookEvent(input: {
  providerEventId: string;
  senderIgsid: string | null;
  eventType: string;
  rawPayload: unknown;
}) {
  const [row] = await db
    .insert(instagramWebhookEvents)
    .values({
      providerEventId: input.providerEventId,
      senderIgsid: input.senderIgsid,
      eventType: input.eventType,
      rawPayload: input.rawPayload,
      processedStatus: 'received',
    })
    .onConflictDoNothing({ target: instagramWebhookEvents.providerEventId })
    .returning();

  return row ?? null;
}

export async function markWebhookEventProcessed(
  id: number,
  status: 'processed' | 'failed' | 'ignored',
  errorMessage?: string
) {
  await db
    .update(instagramWebhookEvents)
    .set({
      processedStatus: status,
      errorMessage: errorMessage ?? null,
      processedAt: new Date(),
    })
    .where(eq(instagramWebhookEvents.id, id));
}

export async function getInstagramIdentity(senderIgsid: string) {
  const [identity] = await db
    .select()
    .from(instagramIdentities)
    .where(eq(instagramIdentities.instagramSenderId, senderIgsid))
    .limit(1);

  return identity ?? null;
}

export async function createOutboundMessage(
  recipientIgsid: string,
  messageText: string
) {
  const [row] = await db
    .insert(outboundMessages)
    .values({
      channel: 'instagram',
      recipientIgsid,
      messageText,
      status: 'pending',
    })
    .returning();

  return row;
}

export async function updateOutboundMessage(
  id: number,
  data: {
    status: 'sent' | 'failed';
    providerResponse?: unknown;
    errorMessage?: string;
  }
) {
  await db
    .update(outboundMessages)
    .set({
      status: data.status,
      providerResponse: data.providerResponse ?? null,
      errorMessage: data.errorMessage ?? null,
      sentAt: data.status === 'sent' ? new Date() : null,
    })
    .where(eq(outboundMessages.id, id));
}

export async function isSenderRateLimited(senderIgsid: string) {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  const oneHourAgo = new Date(Date.now() - 60 * 60_000);

  const [minuteCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(outboundMessages)
    .where(
      and(
        eq(outboundMessages.recipientIgsid, senderIgsid),
        eq(outboundMessages.status, 'sent'),
        gte(outboundMessages.createdAt, oneMinuteAgo)
      )
    );

  const [hourCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(outboundMessages)
    .where(
      and(
        eq(outboundMessages.recipientIgsid, senderIgsid),
        eq(outboundMessages.status, 'sent'),
        gte(outboundMessages.createdAt, oneHourAgo)
      )
    );

  return (
    (minuteCount?.count ?? 0) >= MAX_OUTBOUND_PER_MINUTE ||
    (hourCount?.count ?? 0) >= MAX_OUTBOUND_PER_HOUR
  );
}

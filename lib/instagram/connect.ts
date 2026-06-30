import 'server-only';

import { randomBytes } from 'crypto';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  instagramConnectCodes,
  instagramIdentities,
} from '@/lib/db/schema';

const CODE_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_TTL_MS = 24 * 60 * 60 * 1000;

export const CONNECT_CODE_PATTERN = /\bFAYE-[A-Z2-9]{6}\b/i;

function generateCodeSuffix() {
  const bytes = randomBytes(6);
  let suffix = '';
  for (let i = 0; i < 6; i += 1) {
    suffix += CODE_CHARSET[bytes[i]! % CODE_CHARSET.length];
  }
  return suffix;
}

export function formatConnectCode(suffix: string) {
  return `FAYE-${suffix.toUpperCase()}`;
}

export function extractConnectCode(text: string | null | undefined) {
  if (!text) return null;
  const match = text.trim().toUpperCase().match(CONNECT_CODE_PATTERN);
  return match?.[0] ?? null;
}

export async function getLinkedInstagramForUser(userId: number) {
  const [identity] = await db
    .select()
    .from(instagramIdentities)
    .where(
      and(
        eq(instagramIdentities.fyndlaterUserId, userId),
        eq(instagramIdentities.status, 'linked')
      )
    )
    .orderBy(desc(instagramIdentities.updatedAt))
    .limit(1);

  return identity ?? null;
}

export async function getActiveConnectCodeForUser(userId: number) {
  const now = new Date();
  const [row] = await db
    .select()
    .from(instagramConnectCodes)
    .where(
      and(
        eq(instagramConnectCodes.userId, userId),
        isNull(instagramConnectCodes.usedAt),
        gt(instagramConnectCodes.expiresAt, now)
      )
    )
    .orderBy(desc(instagramConnectCodes.createdAt))
    .limit(1);

  return row ?? null;
}

export async function createConnectCodeForUser(userId: number) {
  const code = formatConnectCode(generateCodeSuffix());
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);

  const [row] = await db
    .insert(instagramConnectCodes)
    .values({
      userId,
      code,
      expiresAt,
    })
    .returning();

  return row;
}

export async function getOrCreateConnectCodeForUser(userId: number) {
  const existing = await getActiveConnectCodeForUser(userId);
  if (existing) {
    return existing;
  }
  return createConnectCodeForUser(userId);
}

export type ConnectCodeRedeemResult =
  | { ok: true; userId: number }
  | {
      ok: false;
      reason:
        | 'invalid_code'
        | 'expired_code'
        | 'already_used'
        | 'sender_linked_other'
        | 'already_linked';
    };

export async function redeemConnectCode(
  code: string,
  senderIgsid: string
): Promise<ConnectCodeRedeemResult> {
  const normalizedCode = code.trim().toUpperCase();
  const now = new Date();

  const [row] = await db
    .select()
    .from(instagramConnectCodes)
    .where(eq(instagramConnectCodes.code, normalizedCode))
    .limit(1);

  if (!row) {
    return { ok: false, reason: 'invalid_code' };
  }

  if (row.usedAt) {
    return { ok: false, reason: 'already_used' };
  }

  if (row.expiresAt <= now) {
    return { ok: false, reason: 'expired_code' };
  }

  const [existingSender] = await db
    .select()
    .from(instagramIdentities)
    .where(eq(instagramIdentities.instagramSenderId, senderIgsid))
    .limit(1);

  if (
    existingSender?.status === 'linked' &&
    existingSender.fyndlaterUserId === row.userId
  ) {
    await db
      .update(instagramConnectCodes)
      .set({
        usedAt: now,
        linkedSenderId: senderIgsid,
      })
      .where(eq(instagramConnectCodes.id, row.id));
    return { ok: false, reason: 'already_linked' };
  }

  if (
    existingSender?.status === 'linked' &&
    existingSender.fyndlaterUserId &&
    existingSender.fyndlaterUserId !== row.userId
  ) {
    return { ok: false, reason: 'sender_linked_other' };
  }

  await db
    .insert(instagramIdentities)
    .values({
      fyndlaterUserId: row.userId,
      instagramSenderId: senderIgsid,
      status: 'linked',
    })
    .onConflictDoUpdate({
      target: instagramIdentities.instagramSenderId,
      set: {
        fyndlaterUserId: row.userId,
        status: 'linked',
        updatedAt: now,
      },
    });

  await db
    .update(instagramConnectCodes)
    .set({
      usedAt: now,
      linkedSenderId: senderIgsid,
    })
    .where(eq(instagramConnectCodes.id, row.id));

  return { ok: true, userId: row.userId };
}

export function connectCodeReply(result: ConnectCodeRedeemResult) {
  if (result.ok) {
    return 'Connected ✨ Your Instagram is now linked to FyndLater. Send me a reel to try it!';
  }

  switch (result.reason) {
    case 'already_linked':
      return 'Your Instagram is already connected to FyndLater ✨';
    case 'expired_code':
      return 'That connect code expired ✨ Open fyndlater.com/dashboard/connect for a new one.';
    case 'already_used':
      return 'That connect code was already used ✨ Generate a new one on fyndlater.com.';
    case 'sender_linked_other':
      return 'This Instagram account is linked to another FyndLater user ✨';
    case 'invalid_code':
    default:
      return "I couldn't find that connect code ✨ Copy it from fyndlater.com/dashboard/connect and try again.";
  }
}

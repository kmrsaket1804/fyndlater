import { createHmac, timingSafeEqual } from 'crypto';
import { getMetaConfig } from './config';

export function verifyWebhookChallenge(
  mode: string | null,
  token: string | null,
  challenge: string | null
): string | null {
  if (!mode || !token || !challenge) {
    return null;
  }

  const { webhookVerifyToken } = getMetaConfig();

  if (mode === 'subscribe' && token === webhookVerifyToken) {
    return challenge;
  }

  return null;
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader?.startsWith('sha256=')) {
    return false;
  }

  const { webhookAppSecret } = getMetaConfig();
  const expected =
    'sha256=' +
    createHmac('sha256', webhookAppSecret).update(rawBody, 'utf8').digest('hex');

  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader),
      Buffer.from(expected)
    );
  } catch {
    return false;
  }
}

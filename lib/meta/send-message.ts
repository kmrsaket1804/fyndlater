import { getMetaConfig, getMessagingSendTarget } from './config';
import {
  createOutboundMessage,
  isSenderRateLimited,
  updateOutboundMessage,
} from './queries';

const MAX_MESSAGE_LENGTH = 950;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateMessage(text: string) {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

type SendResult = {
  success: boolean;
  providerResponse?: unknown;
  errorMessage?: string;
  permanentFailure?: boolean;
};

async function postInstagramMessage(
  recipientIgsid: string,
  text: string
): Promise<SendResult> {
  const config = getMetaConfig();
  const target = getMessagingSendTarget(config);

  if ('error' in target) {
    return {
      success: false,
      errorMessage: target.error,
      permanentFailure: true,
    };
  }

  console.info('[meta] Sending Instagram DM', {
    mode: target.mode,
    url: target.url.replace(/\/messages$/, '/messages'), // host + path, no token
    recipientIgsid,
  });

  const response = await fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${target.accessToken}`,
    },
    body: JSON.stringify({
      recipient: { id: recipientIgsid },
      messaging_type: 'RESPONSE',
      message: { text: truncateMessage(text) },
    }),
  });

  const providerResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof providerResponse === 'object' &&
      providerResponse !== null &&
      'error' in providerResponse
        ? JSON.stringify((providerResponse as { error: unknown }).error)
        : `Instagram API error (${response.status})`;

    return {
      success: false,
      providerResponse,
      errorMessage,
      permanentFailure: !RETRYABLE_STATUS.has(response.status),
    };
  }

  return { success: true, providerResponse };
}

export async function sendInstagramMessage(
  recipientIgsid: string,
  text: string
) {
  if (await isSenderRateLimited(recipientIgsid)) {
    console.warn(
      `[meta] Rate limit reached for sender ${recipientIgsid}, skipping reply`
    );
    return { success: false, rateLimited: true };
  }

  const outbound = await createOutboundMessage(recipientIgsid, text);
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await postInstagramMessage(recipientIgsid, text);

      if (result.success) {
        await updateOutboundMessage(outbound.id, {
          status: 'sent',
          providerResponse: result.providerResponse,
        });
        return { success: true, outboundId: outbound.id };
      }

      if (result.permanentFailure || attempt === maxAttempts) {
        await updateOutboundMessage(outbound.id, {
          status: 'failed',
          providerResponse: result.providerResponse,
          errorMessage: result.errorMessage,
        });
        console.error(
          `[meta] Failed to send Instagram message to ${recipientIgsid}:`,
          result.errorMessage
        );
        return { success: false, outboundId: outbound.id };
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown send error';

      if (attempt === maxAttempts) {
        await updateOutboundMessage(outbound.id, {
          status: 'failed',
          errorMessage: message,
        });
        console.error(
          `[meta] Failed to send Instagram message to ${recipientIgsid}:`,
          message
        );
        return { success: false, outboundId: outbound.id };
      }
    }

    await sleep(2 ** (attempt - 1) * 500);
  }

  return { success: false, outboundId: outbound.id };
}

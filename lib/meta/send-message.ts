import { getMetaConfig, getMessagingSendTarget, tokenHint } from './config';
import {
  createOutboundMessage,
  isSenderRateLimited,
  updateOutboundMessage,
} from './queries';

const MAX_MESSAGE_LENGTH = 950;
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

export type SendInstagramMessageOptions = {
  /** Reply in-thread to the user's original DM when supported by Meta. */
  replyToMessageId?: string;
  /** Visible prefix if threaded reply is unavailable. */
  contextLabel?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncateMessage(text: string) {
  if (text.length <= MAX_MESSAGE_LENGTH) {
    return text;
  }
  return `${text.slice(0, MAX_MESSAGE_LENGTH - 1)}…`;
}

function withContextLabel(text: string, contextLabel?: string) {
  if (!contextLabel || text.startsWith(contextLabel)) {
    return text;
  }
  return truncateMessage(`${contextLabel}\n\n${text}`);
}

function isUnsupportedReplyToError(providerResponse: unknown) {
  if (typeof providerResponse !== 'object' || providerResponse === null) {
    return false;
  }

  const error = (providerResponse as { error?: unknown }).error;
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const subcode = (error as { error_subcode?: number }).error_subcode;
  return subcode === 2534006;
}

type SendResult = {
  success: boolean;
  providerResponse?: unknown;
  errorMessage?: string;
  permanentFailure?: boolean;
};

async function postInstagramMessage(
  recipientIgsid: string,
  text: string,
  options?: SendInstagramMessageOptions & { includeReplyTo?: boolean }
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

  const payload: Record<string, unknown> = {
    recipient: { id: recipientIgsid },
    messaging_type: 'RESPONSE',
    message: { text: truncateMessage(text) },
  };

  if (options?.includeReplyTo !== false && options?.replyToMessageId) {
    payload.reply_to = { mid: options.replyToMessageId };
  }

  console.info('[meta] Sending Instagram DM', {
    mode: target.mode,
    url: target.url,
    recipientIgsid,
    tokenHint: tokenHint(target.accessToken),
    attemptTextLength: truncateMessage(text).length,
    replyToMessageId: options?.replyToMessageId ?? null,
  });

  const response = await fetch(target.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${target.accessToken}`,
    },
    body: JSON.stringify(payload),
  });

  const providerResponse = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage =
      typeof providerResponse === 'object' &&
      providerResponse !== null &&
      'error' in providerResponse
        ? JSON.stringify((providerResponse as { error: unknown }).error)
        : `Instagram API error (${response.status})`;

    console.error('[meta] Instagram DM API error', {
      status: response.status,
      recipientIgsid,
      error: errorMessage,
      tokenHint: tokenHint(target.accessToken),
    });

    return {
      success: false,
      providerResponse,
      errorMessage,
      permanentFailure: !RETRYABLE_STATUS.has(response.status),
    };
  }

  console.info('[meta] Instagram DM sent', {
    recipientIgsid,
    messageId:
      typeof providerResponse === 'object' &&
      providerResponse !== null &&
      'message_id' in providerResponse
        ? (providerResponse as { message_id: string }).message_id
        : null,
  });

  return { success: true, providerResponse };
}

export async function sendInstagramMessage(
  recipientIgsid: string,
  text: string,
  options?: SendInstagramMessageOptions
) {
  if (await isSenderRateLimited(recipientIgsid)) {
    console.warn(
      `[meta] Rate limit reached for sender ${recipientIgsid}, skipping reply`
    );
    return { success: false, rateLimited: true };
  }

  const outbound = await createOutboundMessage(recipientIgsid, text);
  const maxAttempts = 3;
  let triedWithoutReplyTo = false;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const messageText =
        triedWithoutReplyTo && options?.contextLabel
          ? withContextLabel(text, options.contextLabel)
          : text;

      const result = await postInstagramMessage(
        recipientIgsid,
        messageText,
        {
          ...options,
          includeReplyTo: !triedWithoutReplyTo,
        }
      );

      if (result.success) {
        await updateOutboundMessage(outbound.id, {
          status: 'sent',
          providerResponse: result.providerResponse,
        });
        return { success: true, outboundId: outbound.id };
      }

      if (
        !triedWithoutReplyTo &&
        options?.replyToMessageId &&
        isUnsupportedReplyToError(result.providerResponse)
      ) {
        console.warn(
          '[meta] reply_to unsupported for this account — retrying with context label'
        );
        triedWithoutReplyTo = true;
        continue;
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

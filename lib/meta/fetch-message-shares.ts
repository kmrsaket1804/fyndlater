import 'server-only';

import { getGraphApiBaseUrl, getMetaConfig } from './config';

export type MessageShareRecord = {
  link?: string;
  url?: string;
  name?: string;
  description?: string;
  type?: string;
  id?: string;
};

type MessageSharesResponse = {
  shares?: { data?: MessageShareRecord[] };
  error?: { message?: string };
};

/** Fetch share metadata for a DM via Graph API Message node. Works for ig_reel; often empty for ig_post. */
export async function fetchMessageShareLinks(
  messageId: string
): Promise<MessageShareRecord[]> {
  try {
    const config = getMetaConfig();
    const params = new URLSearchParams({
      fields: 'shares{link,url,name,description,type,id}',
      platform: 'instagram',
      access_token: config.pageAccessToken,
    });

    const response = await fetch(
      `${getGraphApiBaseUrl()}/${encodeURIComponent(messageId)}?${params}`
    );
    const data = (await response.json()) as MessageSharesResponse;

    if (!response.ok) {
      console.warn('[meta] Message shares lookup failed', {
        messageId,
        status: response.status,
        error: data.error?.message,
      });
      return [];
    }

    return data.shares?.data ?? [];
  } catch (error) {
    console.warn('[meta] Message shares lookup error', {
      messageId,
      error: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

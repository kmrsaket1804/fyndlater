export type MetaConfig = {
  appId: string;
  appSecret: string;
  graphApiVersion: string;
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
  webhookVerifyToken: string;
  webhookAppSecret: string;
};

export function isMetaConfigured() {
  return Boolean(
    process.env.PAGE_ACCESS_TOKEN &&
      process.env.WEBHOOK_VERIFY_TOKEN &&
      (process.env.META_WEBHOOK_APP_SECRET || process.env.META_APP_SECRET)
  );
}

export function getMetaConfig(): MetaConfig {
  const pageAccessToken = process.env.PAGE_ACCESS_TOKEN;
  const webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN;
  const webhookAppSecret =
    process.env.META_WEBHOOK_APP_SECRET || process.env.META_APP_SECRET;

  if (!pageAccessToken || !webhookVerifyToken || !webhookAppSecret) {
    throw new Error('Meta Instagram webhook is not fully configured');
  }

  return {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    graphApiVersion: process.env.META_GRAPH_API_VERSION || 'v25.0',
    pageId: process.env.PAGE_ID || '',
    pageAccessToken,
    igUserId: process.env.IG_USER_ID || '',
    webhookVerifyToken,
    webhookAppSecret,
  };
}

export function getGraphApiBaseUrl() {
  const version = process.env.META_GRAPH_API_VERSION || 'v25.0';
  return `https://graph.facebook.com/${version}`;
}

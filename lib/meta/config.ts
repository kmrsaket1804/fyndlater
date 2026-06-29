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

/** Trim whitespace/quotes Vercel sometimes adds when pasting env vars. */
export function sanitizeMetaEnvValue(value: string | undefined) {
  if (!value) {
    return '';
  }
  return value.trim().replace(/^["']|["']$/g, '');
}

export function tokenHint(token: string) {
  if (token.length <= 12) {
    return `[len=${token.length}]`;
  }
  return `${token.slice(0, 6)}…${token.slice(-4)} [len=${token.length}]`;
}

export function isMetaConfigured() {
  return Boolean(
    sanitizeMetaEnvValue(process.env.PAGE_ACCESS_TOKEN) &&
      sanitizeMetaEnvValue(process.env.WEBHOOK_VERIFY_TOKEN) &&
      (sanitizeMetaEnvValue(process.env.META_WEBHOOK_APP_SECRET) ||
        sanitizeMetaEnvValue(process.env.META_APP_SECRET))
  );
}

export function getMetaConfig(): MetaConfig {
  const pageAccessToken = sanitizeMetaEnvValue(process.env.PAGE_ACCESS_TOKEN);
  const webhookVerifyToken = sanitizeMetaEnvValue(
    process.env.WEBHOOK_VERIFY_TOKEN
  );
  const webhookAppSecret =
    sanitizeMetaEnvValue(process.env.META_WEBHOOK_APP_SECRET) ||
    sanitizeMetaEnvValue(process.env.META_APP_SECRET);

  if (!pageAccessToken || !webhookVerifyToken || !webhookAppSecret) {
    throw new Error('Meta Instagram webhook is not fully configured');
  }

  return {
    appId: sanitizeMetaEnvValue(process.env.META_APP_ID),
    appSecret: sanitizeMetaEnvValue(process.env.META_APP_SECRET),
    graphApiVersion:
      sanitizeMetaEnvValue(process.env.META_GRAPH_API_VERSION) || 'v25.0',
    pageId: sanitizeMetaEnvValue(process.env.PAGE_ID),
    pageAccessToken,
    igUserId: sanitizeMetaEnvValue(process.env.IG_USER_ID),
    webhookVerifyToken,
    webhookAppSecret,
  };
}

export function getGraphApiBaseUrl() {
  const version = process.env.META_GRAPH_API_VERSION || 'v25.0';
  return `https://graph.facebook.com/${version}`;
}

export function getInstagramGraphApiBaseUrl() {
  const version = process.env.META_GRAPH_API_VERSION || 'v25.0';
  return `https://graph.instagram.com/${version}`;
}

export function getInstagramAccessToken() {
  return sanitizeMetaEnvValue(process.env.INSTAGRAM_ACCESS_TOKEN);
}

export type MessagingSendTarget = {
  mode: 'instagram_login' | 'facebook_page';
  url: string;
  accessToken: string;
};

/** Resolve send API for token type: Instagram Login token → graph.instagram.com; Page token → graph.facebook.com/{PAGE_ID}/messages */
export function getMessagingSendTarget(
  config: MetaConfig
): MessagingSendTarget | { error: string } {
  const version = config.graphApiVersion || 'v25.0';
  const instagramToken = getInstagramAccessToken();
  const mode =
    process.env.META_MESSAGING_API === 'facebook'
      ? 'facebook_page'
      : process.env.META_MESSAGING_API === 'instagram'
        ? 'instagram_login'
        : instagramToken
          ? 'instagram_login'
          : 'facebook_page';

  if (mode === 'instagram_login') {
    const token = instagramToken || config.pageAccessToken;
    if (!config.igUserId) {
      return { error: 'IG_USER_ID is not configured' };
    }
    if (!token) {
      return {
        error:
          'INSTAGRAM_ACCESS_TOKEN is required for graph.instagram.com sends',
      };
    }
    return {
      mode,
      url: `https://graph.instagram.com/${version}/${config.igUserId}/messages`,
      accessToken: token,
    };
  }

  if (!config.pageId) {
    return { error: 'PAGE_ID is not configured' };
  }
  if (!config.pageAccessToken) {
    return { error: 'PAGE_ACCESS_TOKEN is not configured' };
  }

  return {
    mode,
    url: `https://graph.facebook.com/${version}/${config.pageId}/messages`,
    accessToken: config.pageAccessToken,
  };
}

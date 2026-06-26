import { getGraphApiBaseUrl } from './config';

const META_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_metadata',
  'instagram_basic',
  'instagram_manage_messages',
].join(',');

export const META_OAUTH_REDIRECT_PATH = '/api/auth/meta/callback';

export function getMetaOAuthRedirectUri() {
  const baseUrl = process.env.BASE_URL || 'https://fyndlater.com';
  return `${baseUrl.replace(/\/$/, '')}${META_OAUTH_REDIRECT_PATH}`;
}

export function getMetaAppId() {
  const appId = process.env.META_APP_ID;
  if (!appId) {
    throw new Error('META_APP_ID is not configured');
  }
  return appId;
}

export function getMetaAppSecret() {
  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    throw new Error('META_APP_SECRET is not configured');
  }
  return secret;
}

export function buildMetaOAuthUrl(state = 'faye_setup') {
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: getMetaOAuthRedirectUri(),
    scope: META_SCOPES,
    response_type: 'code',
    state,
  });

  return `https://www.facebook.com/v25.0/dialog/oauth?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message: string; type: string; code: number };
};

type InstagramBusinessAccount = {
  id: string;
  username?: string;
};

type PageAccount = {
  id: string;
  name: string;
  access_token: string;
  instagram_business_account?: InstagramBusinessAccount;
};

type AccountsResponse = {
  data?: PageAccount[];
  error?: { message: string; type: string; code: number };
};

export async function exchangeCodeForUserToken(code: string) {
  const baseUrl = getGraphApiBaseUrl();
  const params = new URLSearchParams({
    client_id: getMetaAppId(),
    redirect_uri: getMetaOAuthRedirectUri(),
    client_secret: getMetaAppSecret(),
    code,
  });

  const response = await fetch(
    `${baseUrl}/oauth/access_token?${params.toString()}`
  );
  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error?.message || 'Failed to exchange OAuth code for access token'
    );
  }

  return data.access_token;
}

export async function fetchPageAccounts(userAccessToken: string) {
  const baseUrl = getGraphApiBaseUrl();
  const params = new URLSearchParams({
    fields: 'id,name,access_token,instagram_business_account{id,username}',
    access_token: userAccessToken,
  });

  const response = await fetch(
    `${baseUrl}/me/accounts?${params.toString()}`
  );
  const data = (await response.json()) as AccountsResponse;

  if (!response.ok || !data.data?.length) {
    throw new Error(
      data.error?.message || 'No Facebook Pages returned for this user'
    );
  }

  return data.data;
}

export function pickFyndLaterPage(accounts: PageAccount[]) {
  const byName = accounts.find((page) =>
    page.name.toLowerCase().includes('fyndlater')
  );
  if (byName) {
    return byName;
  }

  const withInstagram = accounts.find(
    (page) => page.instagram_business_account?.id
  );
  if (withInstagram) {
    return withInstagram;
  }

  return accounts[0];
}

export type MetaSetupValues = {
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string | null;
  pageName: string;
};

export async function resolveMetaSetupValues(
  code: string
): Promise<MetaSetupValues> {
  const userAccessToken = await exchangeCodeForUserToken(code);
  const accounts = await fetchPageAccounts(userAccessToken);
  const page = pickFyndLaterPage(accounts);

  if (!page.access_token) {
    throw new Error('Page access token missing from Meta response');
  }

  const igUserId = page.instagram_business_account?.id;
  if (!igUserId) {
    throw new Error(
      'No Instagram professional account linked to the FyndLater Facebook Page'
    );
  }

  return {
    pageId: page.id,
    pageAccessToken: page.access_token,
    igUserId,
    igUsername: page.instagram_business_account?.username ?? null,
    pageName: page.name,
  };
}

import { NextRequest, NextResponse } from 'next/server';
import {
  getMetaAppId,
  getMetaOAuthRedirectUri,
  resolveMetaSetupValues,
} from '@/lib/meta/oauth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function renderSetupPage(values: {
  pageId: string;
  pageAccessToken: string;
  igUserId: string;
  igUsername: string | null;
  pageName: string;
}) {
  const envBlock = `META_APP_ID=${getMetaAppId()}
META_APP_SECRET=<set in Vercel — do not paste here>
META_WEBHOOK_APP_SECRET=<same as META_APP_SECRET>
META_GRAPH_API_VERSION=v25.0
PAGE_ID=${values.pageId}
PAGE_ACCESS_TOKEN=${values.pageAccessToken}
IG_USER_ID=${values.igUserId}
WEBHOOK_VERIFY_TOKEN=fyndlater_faye_meta_webhook_2026`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>FyndLater Meta Setup</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; color: #111; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #555; }
    .card { background: #faf9fc; border: 1px solid #ece7f5; border-radius: 16px; padding: 20px; margin: 24px 0; }
    dl { display: grid; grid-template-columns: 180px 1fr; gap: 12px 16px; margin: 0; }
    dt { font-weight: 600; color: #444; }
    dd { margin: 0; word-break: break-all; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
    pre { background: #111; color: #f5f5f5; padding: 16px; border-radius: 12px; overflow-x: auto; font-size: 12px; line-height: 1.6; }
    .warn { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; padding: 12px 16px; border-radius: 12px; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Meta setup complete</h1>
  <p>OAuth succeeded for <strong>${values.pageName}</strong>${
    values.igUsername ? ` (@${values.igUsername})` : ''
  }. Copy these into Vercel environment variables, then redeploy.</p>

  <div class="card">
    <dl>
      <dt>PAGE_ID</dt><dd>${values.pageId}</dd>
      <dt>PAGE_ACCESS_TOKEN</dt><dd>${values.pageAccessToken}</dd>
      <dt>IG_USER_ID</dt><dd>${values.igUserId}</dd>
      ${
        values.igUsername
          ? `<dt>IG_USERNAME</dt><dd>@${values.igUsername}</dd>`
          : ''
      }
    </dl>
  </div>

  <h2>Vercel env block</h2>
  <pre>${envBlock.replace(/</g, '&lt;')}</pre>

  <div class="warn">
    This page contains secrets. Close it after copying values into Vercel.
    Do not share this URL. Rotate tokens if exposed.
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function renderErrorPage(message: string, details?: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>FyndLater Meta Setup Error</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 20px; }
    .error { background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 16px; border-radius: 12px; }
    pre { background: #f8fafc; padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
    a { color: #7c3aed; }
  </style>
</head>
<body>
  <h1>Meta setup failed</h1>
  <div class="error"><p>${message}</p></div>
  ${details ? `<pre>${details.replace(/</g, '&lt;')}</pre>` : ''}
  <p><a href="/api/auth/meta">Try OAuth again</a></p>
  <p>Redirect URI in Meta app settings must be exactly:<br><code>${getMetaOAuthRedirectUri()}</code></p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 400,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  const errorDescription =
    request.nextUrl.searchParams.get('error_description');

  if (error) {
    return renderErrorPage(
      'Facebook OAuth was denied or failed.',
      errorDescription || error
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code) {
    return renderErrorPage('Missing OAuth code in callback URL.');
  }

  if (state !== 'faye_setup') {
    return renderErrorPage('Invalid OAuth state parameter.');
  }

  try {
    const values = await resolveMetaSetupValues(code);
    return renderSetupPage(values);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown Meta OAuth error';
    return renderErrorPage(message);
  }
}

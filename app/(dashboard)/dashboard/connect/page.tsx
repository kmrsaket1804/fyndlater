'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  Check,
  Copy,
  ExternalLink,
  Instagram,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { SettingsPageShell } from '@/components/dashboard/settings-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fayeInstagramUrl } from '@/lib/config';

type ConnectStatus =
  | { linked: true; linkedAt: string }
  | { linked: false; code: string; expiresAt: string };

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatExpiry(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}

export default function ConnectInstagramPage() {
  const { data, error, isLoading, mutate } = useSWR<ConnectStatus>(
    '/api/instagram/connect',
    fetcher
  );
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const copy = data;

  async function handleCopy() {
    if (!copy || copy.linked) return;
    await navigator.clipboard.writeText(copy.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const response = await fetch('/api/instagram/connect', { method: 'POST' });
      const next = (await response.json()) as ConnectStatus;
      await mutate(next, false);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <SettingsPageShell>
      <Card className="border-gray-100 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-violet-600" />
            Connect Instagram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            Link your Instagram account to Faye so reels, posts, and notes you
            send in DMs appear in your FyndLater library.
          </p>

          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading connection status...
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 rounded-xl bg-red-50 px-3 py-2">
              Could not load connection status. Refresh and try again.
            </p>
          )}

          {copy?.linked && (
            <div className="rounded-2xl border border-green-100 bg-green-50/80 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Instagram connected
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    Faye will save content from your linked Instagram account to
                    this FyndLater account.
                  </p>
                  {copy.linkedAt && (
                    <p className="mt-2 text-xs text-gray-500">
                      Linked {formatExpiry(copy.linkedAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {copy && !copy.linked && (
            <>
              <ol className="space-y-4 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    1
                  </span>
                  <span>Copy your connect code below.</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    2
                  </span>
                  <span>
                    Open Faye on Instagram and send the code as a DM.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-semibold text-violet-700">
                    3
                  </span>
                  <span>
                    Faye will confirm the connection. Then send a reel to test.
                  </span>
                </li>
              </ol>

              <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-violet-700">
                  Your connect code
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <code className="rounded-xl bg-white px-4 py-3 text-2xl font-bold tracking-widest text-gray-900 shadow-sm">
                    {copy.code}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy code
                      </>
                    )}
                  </Button>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  Expires {formatExpiry(copy.expiresAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={fayeInstagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-600 hover:to-pink-600"
                >
                  <Instagram className="h-4 w-4" />
                  Open Faye on Instagram
                  <ExternalLink className="h-3.5 w-3.5 opacity-80" />
                </a>
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={handleRegenerate}
                  disabled={regenerating}
                >
                  {regenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      New code
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </SettingsPageShell>
  );
}

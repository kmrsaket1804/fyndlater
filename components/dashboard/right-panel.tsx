'use client';

import Link from 'next/link';
import { Loader2, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import type { DashboardHomeData } from '@/lib/dashboard/types';
import { ChatMessageBubble } from '@/components/dashboard/ask-faye/chat-message';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function DashboardRightPanel() {
  const { data, isLoading } = useSWR<DashboardHomeData>(
    '/api/dashboard/home',
    fetcher
  );

  if (isLoading || !data) {
    return (
      <aside className="hidden xl:flex w-[340px] shrink-0 items-center justify-center border-l border-gray-100 bg-[#faf9fc]">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </aside>
    );
  }

  const { chatMessages, usage } = data;
  const usagePercent = Math.min(
    (usage.savesUsed / usage.savesLimit) * 100,
    100
  );

  return (
    <aside className="hidden xl:flex w-[340px] shrink-0 flex-col gap-4 border-l border-gray-100 bg-[#faf9fc] p-5 overflow-y-auto">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col max-h-[480px]">
        <div className="border-b border-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Ask Faye</h3>
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {chatMessages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              role={message.role}
              text={message.text}
              createdAt={message.createdAt}
              save={message.save}
              compact
            />
          ))}
        </div>
        <div className="border-t border-gray-50 p-3">
          <Link
            href="/dashboard/ask"
            className="flex items-center justify-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700 hover:bg-violet-100 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Open full chat
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {usage.planName}
          </h3>
          <Link
            href="/dashboard/billing"
            className="text-xs font-medium text-violet-600 hover:text-violet-700"
          >
            Manage
          </Link>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {usage.savesUsed} / {usage.savesLimit} saves used this month
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-pink-500"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Send, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import type { DashboardHomeData } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

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
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Ask Faye</h3>
          </div>
        </div>
        <div className="space-y-3 p-4 max-h-[320px] overflow-y-auto">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'text-sm',
                message.role === 'user' ? 'flex justify-end' : ''
              )}
            >
              {message.role === 'user' ? (
                <div className="rounded-2xl rounded-br-md bg-violet-600 px-3 py-2 text-white max-w-[85%]">
                  {message.text}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 text-xs">{message.text}</p>
                  {message.save && (
                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                      {message.save.image && (
                        <div className="relative h-24 w-full">
                          <Image
                            src={message.save.image}
                            alt={message.save.title}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-xs font-medium text-gray-900 line-clamp-1">
                          {message.save.title}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"
                          >
                            Show similar
                          </button>
                          <button
                            type="button"
                            className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600"
                          >
                            Open collection
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="border-t border-gray-50 p-3">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <input
              type="text"
              placeholder="Ask or find anything..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
            />
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white"
              aria-label="Send"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
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

      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-pink-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-lg shadow-sm">
            ✨
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Get more from Faye
            </p>
            <p className="mt-1 text-xs text-gray-600 leading-relaxed">
              Invite teammates and build collections together.
            </p>
            <button
              type="button"
              className="mt-3 rounded-full bg-white px-4 py-2 text-xs font-medium text-violet-700 shadow-sm hover:shadow transition-shadow"
            >
              Invite teammates
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

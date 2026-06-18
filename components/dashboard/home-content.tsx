'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bell, Plus, Sparkles } from 'lucide-react';
import { GradientButton } from '@/components/landing/gradient-button';
import { getGreeting } from '@/lib/dashboard/greeting';
import {
  collections,
  highlights,
  recentSaves,
  searchSuggestions,
  stats,
} from '@/lib/dashboard/mock-data';
import { User } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

const typeBadgeColors: Record<string, string> = {
  Reel: 'bg-pink-100 text-pink-700',
  Post: 'bg-violet-100 text-violet-700',
  Screenshot: 'bg-blue-100 text-blue-700',
  Link: 'bg-amber-100 text-amber-700',
};

type DashboardHomeContentProps = {
  user?: User;
};

export function DashboardHomeContent({ user }: DashboardHomeContentProps) {
  const { time, firstName } = getGreeting(user?.name);

  return (
    <div className="space-y-8 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {time}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here&apos;s what you&apos;ve saved and what Faye found for you
            recently.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>
          <GradientButton className="gap-2">
            <Plus className="h-4 w-4" />
            Add save
          </GradientButton>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-violet-600">
          <Sparkles className="h-4 w-4" />
          Ask Faye
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-violet-400" />
          <input
            type="text"
            placeholder="Find that reel I saved about premium packaging"
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {searchSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 hover:border-violet-200 hover:text-violet-700 transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{stat.icon}</span>
              <p className="text-xs text-gray-500 line-clamp-1">{stat.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="mt-0.5 text-xs text-emerald-600">{stat.change}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Saves</h2>
          <Link
            href="/dashboard/saves"
            className="text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-4">
          {recentSaves.map((save) => (
            <article
              key={save.id}
              className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative h-36 w-full">
                <Image
                  src={save.image}
                  alt={save.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span
                  className={cn(
                    'absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                    typeBadgeColors[save.type]
                  )}
                >
                  {save.type}
                </span>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-gray-400">{save.source}</p>
                <h3 className="mt-1 font-semibold text-gray-900 line-clamp-1">
                  {save.title}
                </h3>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {save.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {save.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
                  <span>{save.collection}</span>
                  <span>{save.savedAt}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Smart Collections
          </h2>
          <Link
            href="/dashboard/collections"
            className="text-sm font-medium text-violet-600 hover:text-violet-700"
          >
            View all
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href="/dashboard/collections"
              className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-white text-sm',
                    collection.gradient
                  )}
                >
                  {collection.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {collection.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {collection.count} items
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {collection.previews.map((preview, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-xl bg-gray-50 text-lg"
                  >
                    {preview}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Memory Highlights
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className={cn(
                'rounded-2xl px-4 py-3.5 text-sm font-medium',
                highlight.color
              )}
            >
              <span className="mr-2">{highlight.icon}</span>
              {highlight.text}
            </div>
          ))}
        </div>
      </section>

      <div className="rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-pink-50 border border-violet-100/80 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            Send it to Faye. Fynd it later.
          </p>
          <p className="mt-1 text-sm text-gray-600">
            DM reels, links, and screenshots to Faye on Instagram.
          </p>
        </div>
        <GradientButton>Add something new</GradientButton>
      </div>
    </div>
  );
}

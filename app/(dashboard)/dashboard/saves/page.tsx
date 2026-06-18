'use client';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { SaveGrid } from '@/components/dashboard/save-card';
import type { SaveItem } from '@/lib/dashboard/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AllSavesPage() {
  const { data, isLoading, error } = useSWR<{ saves: SaveItem[] }>(
    '/api/saves',
    fetcher
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">All Saves</h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything you&apos;ve sent to Faye — reels, posts, links, and
          screenshots.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load saves.</p>
      ) : (
        <SaveGrid saves={data?.saves ?? []} />
      )}
    </div>
  );
}

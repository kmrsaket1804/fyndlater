'use client';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import { CollectionGrid } from '@/components/dashboard/collection-card';
import type { CollectionItem } from '@/lib/dashboard/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CollectionsPage() {
  const { data, isLoading, error } = useSWR<{ collections: CollectionItem[] }>(
    '/api/collections',
    fetcher
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <p className="mt-1 text-sm text-gray-500">
          Smart folders that organize your saves automatically.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load collections.</p>
      ) : (
        <CollectionGrid collections={data?.collections ?? []} />
      )}
    </div>
  );
}

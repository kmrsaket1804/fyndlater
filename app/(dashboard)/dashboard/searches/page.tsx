'use client';

import useSWR from 'swr';
import { Loader2, Search } from 'lucide-react';
import { SavedSearch } from '@/lib/db/schema';
import { formatShortDate } from '@/lib/dashboard/format';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SavedSearchesPage() {
  const { data, isLoading, error } = useSWR<{ searches: SavedSearch[] }>(
    '/api/saved-searches',
    fetcher
  );

  const searches = data?.searches ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved Searches</h1>
        <p className="mt-1 text-sm text-gray-500">
          Re-run your favourite Faye queries anytime.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load saved searches.</p>
      ) : searches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm font-medium text-gray-900">No saved searches</p>
          <p className="mt-1 text-sm text-gray-500">
            Save a search from Ask Faye to see it here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                  <Search className="h-4 w-4 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {search.label || search.query}
                  </p>
                  {search.label && search.label !== search.query && (
                    <p className="text-sm text-gray-500 truncate">
                      {search.query}
                    </p>
                  )}
                </div>
              </div>
              <p className="shrink-0 text-xs text-gray-400 ml-4">
                {search.lastUsedAt
                  ? `Used ${formatShortDate(new Date(search.lastUsedAt))}`
                  : `Saved ${formatShortDate(new Date(search.createdAt))}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Loader2, Plus } from 'lucide-react';
import { GradientButton } from '@/components/landing/gradient-button';
import { AddSaveModal } from '@/components/dashboard/add-save-modal';
import { SaveGrid } from '@/components/dashboard/save-card';
import type { DashboardHomeData, SaveItem } from '@/lib/dashboard/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AllSavesPage() {
  const [addSaveOpen, setAddSaveOpen] = useState(false);
  const { data, isLoading, error } = useSWR<{ saves: SaveItem[] }>(
    '/api/saves',
    fetcher
  );
  const { data: dashboard } = useSWR<DashboardHomeData>(
    '/api/dashboard/home',
    fetcher
  );

  return (
    <>
      <AddSaveModal
        open={addSaveOpen}
        onOpenChange={setAddSaveOpen}
        usage={dashboard?.usage}
      />
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Saves</h1>
            <p className="mt-1 text-sm text-gray-500">
              Everything you&apos;ve sent to Faye — reels, posts, links, and
              screenshots.
            </p>
          </div>
          <GradientButton className="gap-2 shrink-0" onClick={() => setAddSaveOpen(true)}>
            <Plus className="h-4 w-4" />
            Add save
          </GradientButton>
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
    </>
  );
}

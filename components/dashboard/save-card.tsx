import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { SaveItem } from '@/lib/dashboard/types';

const typeBadgeColors: Record<string, string> = {
  Reel: 'bg-pink-100 text-pink-700',
  Post: 'bg-violet-100 text-violet-700',
  Screenshot: 'bg-blue-100 text-blue-700',
  Link: 'bg-amber-100 text-amber-700',
};

export function SaveCard({ save }: { save: SaveItem }) {
  return (
    <article className="group rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-36 w-full bg-gray-100">
        {save.image ? (
          <Image
            src={save.image}
            alt={save.title}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-sm">
            No preview
          </div>
        )}
        <span
          className={cn(
            'absolute top-3 left-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium',
            typeBadgeColors[save.type]
          )}
        >
          {save.type}
        </span>
        {save.status === 'processing' && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-medium text-amber-700">
            Processing
          </span>
        )}
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
  );
}

export function SaveGrid({ saves }: { saves: SaveItem[] }) {
  if (saves.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">No saves yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Send a reel, link, or screenshot to Faye to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
      {saves.map((save) => (
        <SaveCard key={save.id} save={save} />
      ))}
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { CollectionItem } from '@/lib/dashboard/types';

function CollectionPreview({ preview }: { preview: string }) {
  if (preview.startsWith('http')) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50">
        <Image
          src={preview}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-50 text-lg">
      {preview}
    </div>
  );
}

export function CollectionCard({
  collection,
  href = '/dashboard/collections',
}: {
  collection: CollectionItem;
  href?: string;
}) {
  return (
    <Link
      href={href}
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
          <p className="font-semibold text-gray-900">{collection.name}</p>
          <p className="text-xs text-gray-500">{collection.count} items</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {collection.previews.length > 0 ? (
          collection.previews.map((preview, i) => (
            <CollectionPreview key={i} preview={preview} />
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square rounded-xl bg-gray-50"
            />
          ))
        )}
      </div>
    </Link>
  );
}

export function CollectionGrid({
  collections,
}: {
  collections: CollectionItem[];
}) {
  if (collections.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
        <p className="text-sm font-medium text-gray-900">No collections yet</p>
        <p className="mt-1 text-sm text-gray-500">
          Collections are created automatically when you save content.
        </p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {collections.map((collection) => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}

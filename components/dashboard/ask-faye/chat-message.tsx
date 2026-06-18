import Image from 'next/image';
import Link from 'next/link';
import { FolderOpen, Sparkles } from 'lucide-react';
import type { SaveItem } from '@/lib/dashboard/types';
import { cn } from '@/lib/utils';

const typeBadgeColors: Record<string, string> = {
  Reel: 'bg-pink-100 text-pink-700',
  Post: 'bg-violet-100 text-violet-700',
  Screenshot: 'bg-blue-100 text-blue-700',
  Link: 'bg-amber-100 text-amber-700',
};

type ChatSaveCardProps = {
  save: SaveItem;
  onShowSimilar?: (save: SaveItem) => void;
  compact?: boolean;
};

export function ChatSaveCard({
  save,
  onShowSimilar,
  compact = false,
}: ChatSaveCardProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
      {save.image && (
        <div className={cn('relative w-full', compact ? 'h-28' : 'h-36')}>
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
      )}
      <div className="p-4">
        <p className="text-[11px] text-gray-400">{save.source}</p>
        <h3 className="mt-1 font-semibold text-gray-900 line-clamp-2">
          {save.title}
        </h3>
        {!compact && (
          <p className="mt-1 text-xs text-gray-500 line-clamp-2">
            {save.description}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {save.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">
          Saved in {save.collection} · {save.savedAt}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {onShowSimilar && (
            <button
              type="button"
              onClick={() => onShowSimilar(save)}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-violet-700 hover:bg-violet-100 transition-colors"
            >
              <Sparkles className="h-3 w-3" />
              Show similar
            </button>
          )}
          <Link
            href="/dashboard/collections"
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <FolderOpen className="h-3 w-3" />
            Open collection
          </Link>
        </div>
      </div>
    </div>
  );
}

type ChatMessageBubbleProps = {
  role: 'user' | 'assistant';
  text: string;
  createdAt?: string;
  save?: SaveItem;
  onShowSimilar?: (save: SaveItem) => void;
  compact?: boolean;
};

export function ChatMessageBubble({
  role,
  text,
  createdAt,
  save,
  onShowSimilar,
  compact = false,
}: ChatMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-sm text-white shadow-sm">
          ✨
        </div>
      )}

      <div
        className={cn(
          'max-w-[85%] space-y-2',
          isUser ? 'items-end text-right' : 'items-start'
        )}
      >
        <div
          className={cn(
            'inline-block rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            isUser
              ? 'rounded-br-md bg-violet-600 text-white'
              : 'rounded-bl-md bg-gray-100 text-gray-800'
          )}
        >
          {text}
        </div>

        {createdAt && (
          <p
            className={cn(
              'text-[11px] text-gray-400',
              isUser ? 'text-right' : 'text-left'
            )}
          >
            {createdAt}
            {isUser && <span className="ml-1.5 text-violet-400">✓✓</span>}
          </p>
        )}

        {!isUser && save && (
          <div className="pt-1">
            <ChatSaveCard
              save={save}
              onShowSimilar={onShowSimilar}
              compact={compact}
            />
          </div>
        )}
      </div>
    </div>
  );
}

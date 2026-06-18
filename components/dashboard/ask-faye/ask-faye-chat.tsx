'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Send, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import { mutate } from 'swr';
import type { AskPageData, ChatMessage, SaveItem } from '@/lib/dashboard/types';
import { ChatMessageBubble } from './chat-message';
import { cn } from '@/lib/utils';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function AskFayeChat() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q');
  const hasAutoSubmitted = useRef(false);

  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useSWR<AskPageData>('/api/ask', fetcher);

  useEffect(() => {
    if (data?.messages) {
      setLocalMessages(data.messages);
    }
  }, [data?.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, pending]);

  useEffect(() => {
    if (initialQuery && !hasAutoSubmitted.current && !isLoading && data) {
      hasAutoSubmitted.current = true;
      submitQuery(initialQuery);
    }
  }, [initialQuery, isLoading, data]);

  async function submitQuery(query: string) {
    const trimmed = query.trim();
    if (!trimmed || pending) return;

    setInput('');
    setPending(true);

    const optimisticUser: ChatMessage = {
      id: `pending-${Date.now()}`,
      role: 'user',
      text: trimmed,
      createdAt: new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date()),
    };

    setLocalMessages((prev) => [...prev, optimisticUser]);

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Search failed');
      }

      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        ...result.messages,
      ]);

      mutate('/api/ask');
      mutate('/api/dashboard/home');
      mutate('/api/saved-searches');
    } catch {
      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        optimisticUser,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          text: 'Something went wrong while searching. Please try again.',
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  async function handleShowSimilar(save: SaveItem) {
    const query = `Show similar to ${save.title}`;
    await submitQuery(query);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    submitQuery(input);
  }

  if (isLoading && localMessages.length === 0) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error && localMessages.length === 0) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-12 text-center">
        <p className="text-sm text-red-600">Failed to load chat.</p>
      </div>
    );
  }

  const suggestions = data?.suggestions ?? [];

  return (
    <div className="flex h-[calc(100dvh-7rem)] max-h-[860px] flex-col">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-xl text-white shadow-md shadow-violet-200/50">
          ✨
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ask Faye</h1>
          <p className="text-sm text-gray-500">
            Find anything you&apos;ve saved with a simple question.
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-gray-50 px-5 py-4">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-medium text-gray-900">Chat with Faye</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-5">
          {localMessages.map((message) => (
            <ChatMessageBubble
              key={message.id}
              role={message.role}
              text={message.text}
              createdAt={message.createdAt}
              save={message.save}
              onShowSimilar={handleShowSimilar}
            />
          ))}

          {pending && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-pink-400 text-sm text-white">
                ✨
              </div>
              <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {suggestions.length > 0 && (
          <div className="border-t border-gray-50 px-4 py-3 sm:px-6">
            <p className="mb-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
              Try asking
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => submitQuery(suggestion)}
                  disabled={pending}
                  className={cn(
                    'rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 transition-colors',
                    'hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700',
                    pending && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="border-t border-gray-100 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
            <Sparkles className="h-5 w-5 shrink-0 text-violet-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask or find anything..."
              disabled={pending}
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={pending || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white transition-colors hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

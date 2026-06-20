'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  ImageIcon,
  Instagram,
  Link2,
  Loader2,
  StickyNote,
  X,
} from 'lucide-react';
import { mutate } from 'swr';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fayeInstagramUrl } from '@/lib/config';
import { cn } from '@/lib/utils';

type Tab = 'link' | 'note' | 'upload' | 'instagram';

type AddSaveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usage?: { savesUsed: number; savesLimit: number };
};

export function AddSaveModal({
  open,
  onOpenChange,
  usage,
}: AddSaveModalProps) {
  const [tab, setTab] = useState<Tab>('link');
  const [url, setUrl] = useState('');
  const [linkNote, setLinkNote] = useState('');
  const [noteText, setNoteText] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const atLimit =
    usage !== undefined && usage.savesUsed >= usage.savesLimit;

  useEffect(() => {
    if (!open) {
      setTab('link');
      setUrl('');
      setLinkNote('');
      setNoteText('');
      setError('');
      setPreview(null);
      setPending(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  async function refreshDashboard() {
    await Promise.all([
      mutate('/api/dashboard/home'),
      mutate('/api/saves'),
    ]);
  }

  async function submitLink() {
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please paste a URL.');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError('Please enter a valid URL (include https://).');
      return;
    }

    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'link',
          url: trimmed,
          note: linkNote.trim() || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');

      await refreshDashboard();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPending(false);
    }
  }

  async function submitNote() {
    const trimmed = noteText.trim();
    if (!trimmed) {
      setError('Please enter a note.');
      return;
    }

    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'note', text: trimmed }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');

      await refreshDashboard();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPending(false);
    }
  }

  async function submitUpload() {
    if (!preview) {
      setError('Please choose an image to upload.');
      return;
    }

    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/saves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'screenshot',
          imageUrl: preview,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save');

      await refreshDashboard();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setPending(false);
    }
  }

  function handleFileChange(file: File | null) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, or WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be under 2 MB.');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit() {
    if (tab === 'link') return submitLink();
    if (tab === 'note') return submitNote();
    if (tab === 'upload') return submitUpload();
  }

  const tabs: { id: Tab; label: string; icon: typeof Link2 }[] = [
    { id: 'link', label: 'Link', icon: Link2 },
    { id: 'note', label: 'Note', icon: StickyNote },
    { id: 'upload', label: 'Upload', icon: ImageIcon },
    { id: 'instagram', label: 'Instagram', icon: Instagram },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-label="Close"
      />
      <div
        role="dialog"
        aria-labelledby="add-save-title"
        className="relative w-full max-w-lg rounded-3xl bg-white shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 id="add-save-title" className="text-lg font-semibold text-gray-900">
              Add save
            </h2>
            <p className="text-sm text-gray-500">
              Faye will organize it automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {usage && (
          <div className="px-6 pt-4">
            <p className="text-xs text-gray-500">
              {usage.savesUsed} / {usage.savesLimit} saves used this month
            </p>
          </div>
        )}

        {atLimit && (
          <div className="mx-6 mt-4 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-800">
            You&apos;ve hit your monthly save limit.{' '}
            <a href="/pricing" className="font-medium underline">
              Upgrade to Pro
            </a>{' '}
            to save more.
          </div>
        )}

        <div className="grid grid-cols-4 gap-1 p-2 mx-4 mt-4 rounded-xl bg-gray-100">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTab(item.id);
                setError('');
              }}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium transition-colors sm:text-xs',
                tab === item.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="px-6 py-5 space-y-4 min-h-[200px]">
          {tab === 'link' && (
            <>
              <div>
                <Label htmlFor="save-url">Link URL</Label>
                <Input
                  id="save-url"
                  type="url"
                  placeholder="https://instagram.com/reel/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  disabled={atLimit || pending}
                />
              </div>
              <div>
                <Label htmlFor="save-link-note">Note (optional)</Label>
                <Input
                  id="save-link-note"
                  placeholder="Why you're saving this..."
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  className="mt-1.5 rounded-xl"
                  disabled={atLimit || pending}
                />
              </div>
            </>
          )}

          {tab === 'note' && (
            <div>
              <Label htmlFor="save-note-text">Text note</Label>
              <textarea
                id="save-note-text"
                rows={5}
                placeholder="Jot down an idea, quote, or reminder..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={atLimit || pending}
                className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100 disabled:opacity-50"
              />
            </div>
          )}

          {tab === 'upload' && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={atLimit || pending}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 hover:border-violet-300 hover:bg-violet-50/50 transition-colors disabled:opacity-50"
              >
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-h-40 rounded-xl object-contain"
                  />
                ) : (
                  <>
                    <ImageIcon className="h-10 w-10 text-gray-300" />
                    <span className="text-sm text-gray-600">
                      Click to upload a screenshot (max 2 MB)
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {tab === 'instagram' && (
            <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 border border-violet-100 p-5 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                ✨
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">
                Save via Instagram
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                DM reels, posts, links, or screenshots directly to Faye on
                Instagram — the fastest way to save.
              </p>
              <a
                href={fayeInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-600 hover:to-pink-600"
              >
                <Instagram className="h-4 w-4" />
                Open Faye on Instagram
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 rounded-xl bg-red-50 px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {tab !== 'instagram' && (
          <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/50">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={pending || atLimit}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-600 hover:to-pink-600 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save to Faye
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import type { InstagramIntent } from './types';

const RETRIEVE_PREFIXES = [
  'find',
  'show',
  'search',
  'what did i save',
  'where is',
  'get me',
];

export function routeInstagramIntent(
  text: string | null
): InstagramIntent {
  const normalized = (text || '').trim().toLowerCase();

  if (!normalized) {
    return 'SAVE_CONTENT';
  }

  if (normalized.includes('connect')) {
    return 'ACCOUNT_LINK';
  }

  if (
    normalized.endsWith('?') ||
    RETRIEVE_PREFIXES.some((prefix) => normalized.startsWith(prefix))
  ) {
    return 'RETRIEVE_CONTENT';
  }

  if (
    normalized === 'help' ||
    normalized.startsWith('how do') ||
    normalized.startsWith('what can you')
  ) {
    return 'HELP';
  }

  return 'SAVE_CONTENT';
}

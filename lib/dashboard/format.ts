import type { SaveType } from './types';

const saveTypeLabels: Record<string, SaveType> = {
  reel: 'Reel',
  post: 'Post',
  screenshot: 'Screenshot',
  link: 'Link',
};

export function formatSaveType(type: string): SaveType {
  return saveTypeLabels[type.toLowerCase()] ?? 'Link';
}

export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatPercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? '+100% vs last week' : 'No change vs last week';
  }
  const change = Math.round(((current - previous) / previous) * 100);
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change}% vs last week`;
}

export function getSavesLimit(planName?: string | null) {
  return planName?.toLowerCase().includes('pro') ? 100 : 25;
}

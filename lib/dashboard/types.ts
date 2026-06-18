export type SaveType = 'Reel' | 'Post' | 'Screenshot' | 'Link';

export type SaveItem = {
  id: number;
  type: SaveType;
  title: string;
  description: string;
  tags: string[];
  collection: string;
  savedAt: string;
  source: string;
  image: string | null;
  status: string;
};

export type CollectionItem = {
  id: number;
  name: string;
  slug: string;
  count: number;
  icon: string;
  gradient: string;
  previews: string[];
};

export type StatItem = {
  label: string;
  value: string;
  change: string;
  icon: string;
};

export type HighlightItem = {
  id: string;
  text: string;
  icon: string;
  color: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  save?: SaveItem;
  createdAt?: string;
};

export type AskPageData = {
  messages: ChatMessage[];
  suggestions: string[];
};

export type UsageSummary = {
  savesUsed: number;
  savesLimit: number;
  planName: string;
};

export type DashboardHomeData = {
  stats: StatItem[];
  recentSaves: SaveItem[];
  collections: CollectionItem[];
  highlights: HighlightItem[];
  searchSuggestions: string[];
  chatMessages: ChatMessage[];
  usage: UsageSummary;
};

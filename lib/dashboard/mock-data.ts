export type SaveType = 'Reel' | 'Post' | 'Screenshot' | 'Link';

export type SaveItem = {
  id: string;
  type: SaveType;
  title: string;
  description: string;
  tags: string[];
  collection: string;
  savedAt: string;
  source: string;
  image: string;
};

export type Collection = {
  id: string;
  name: string;
  count: number;
  icon: string;
  gradient: string;
  previews: string[];
};

export type Stat = {
  label: string;
  value: string;
  change: string;
  icon: string;
};

export type Highlight = {
  id: string;
  text: string;
  icon: string;
  color: string;
};

export const searchSuggestions = [
  'recipes from last week',
  'Costco',
  'travel ideas for Bali',
  'packaging inspiration',
];

export const stats: Stat[] = [
  {
    label: 'Items saved this week',
    value: '18',
    change: '+20% vs last week',
    icon: '📥',
  },
  {
    label: 'Collections',
    value: '7',
    change: '+1 vs last week',
    icon: '📁',
  },
  {
    label: 'Recent retrievals',
    value: '12',
    change: '+33% vs last week',
    icon: '🔍',
  },
  {
    label: 'Processing',
    value: '2',
    change: '2 in progress',
    icon: '⏳',
  },
];

export const recentSaves: SaveItem[] = [
  {
    id: '1',
    type: 'Reel',
    title: 'Premium D2C Packaging Ideas',
    description: 'Minimal unboxing and sustainable materials for premium brands.',
    tags: ['packaging', 'inspiration'],
    collection: 'Business Ideas',
    savedAt: 'Mar 12',
    source: 'Instagram',
    image:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
  },
  {
    id: '2',
    type: 'Post',
    title: 'High-Protein Dinner Recipes',
    description: 'Quick 30-minute meals with 40g+ protein per serving.',
    tags: ['recipes', 'healthy'],
    collection: 'Recipes',
    savedAt: 'Mar 11',
    source: 'Instagram',
    image:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  },
  {
    id: '3',
    type: 'Screenshot',
    title: 'Bali Boutique Stay Ideas',
    description: 'Hidden villas and boutique hotels near Ubud rice terraces.',
    tags: ['travel', 'Bali'],
    collection: 'Travel',
    savedAt: 'Mar 10',
    source: 'Screenshot',
    image:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop',
  },
  {
    id: '4',
    type: 'Link',
    title: 'Capsule Wardrobe Picks',
    description: 'Essential pieces for a versatile minimalist wardrobe.',
    tags: ['shopping', 'fashion'],
    collection: 'Shopping',
    savedAt: 'Mar 9',
    source: 'Link',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop',
  },
];

export const collections: Collection[] = [
  {
    id: 'recipes',
    name: 'Recipes',
    count: 24,
    icon: '🍳',
    gradient: 'from-orange-400 to-amber-400',
    previews: ['🍝', '🥗', '🍰'],
  },
  {
    id: 'business',
    name: 'Business Ideas',
    count: 18,
    icon: '💡',
    gradient: 'from-violet-400 to-purple-500',
    previews: ['📈', '🚀', '💰'],
  },
  {
    id: 'travel',
    name: 'Travel',
    count: 12,
    icon: '✈️',
    gradient: 'from-blue-400 to-cyan-400',
    previews: ['🏖️', '🗼', '🌅'],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    count: 9,
    icon: '🛍️',
    gradient: 'from-pink-400 to-rose-400',
    previews: ['👗', '👟', '👜'],
  },
];

export const highlights: Highlight[] = [
  {
    id: '1',
    text: 'You saved 8 business ideas this week',
    icon: '💡',
    color: 'bg-violet-50 text-violet-700',
  },
  {
    id: '2',
    text: '3 travel saves are about Bali',
    icon: '✈️',
    color: 'bg-blue-50 text-blue-700',
  },
  {
    id: '3',
    text: '5 recipe saves are high-protein',
    icon: '🥗',
    color: 'bg-orange-50 text-orange-700',
  },
  {
    id: '4',
    text: '2 packaging reels saved recently',
    icon: '📦',
    color: 'bg-pink-50 text-pink-700',
  },
];

export const chatMessages = [
  {
    id: '1',
    role: 'user' as const,
    text: 'Find that packaging reel I saved',
  },
  {
    id: '2',
    role: 'assistant' as const,
    text: 'Found it — saved from Instagram on Mar 12.',
    save: recentSaves[0],
  },
];

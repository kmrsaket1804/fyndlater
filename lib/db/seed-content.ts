import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import {
  collections,
  retrievals,
  saveCollections,
  saves,
  saveTags,
  savedSearches,
  teamMembers,
  users,
} from './schema';

const COLLECTION_DEFS = [
  {
    slug: 'recipes',
    name: 'Recipes',
    icon: '🍳',
    gradient: 'from-orange-400 to-amber-400',
  },
  {
    slug: 'business-ideas',
    name: 'Business Ideas',
    icon: '💡',
    gradient: 'from-violet-400 to-purple-500',
  },
  {
    slug: 'travel',
    name: 'Travel',
    icon: '✈️',
    gradient: 'from-blue-400 to-cyan-400',
  },
  {
    slug: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    gradient: 'from-pink-400 to-rose-400',
  },
] as const;

const SAVE_DEFS = [
  {
    slug: 'packaging-reel',
    type: 'reel',
    title: 'Premium D2C Packaging Ideas',
    description:
      'Minimal unboxing and sustainable materials for premium brands.',
    source: 'Instagram',
    sourceUrl: 'https://instagram.com/reel/example',
    imageUrl:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['packaging', 'inspiration'],
    collectionSlug: 'business-ideas',
    daysAgo: 6,
  },
  {
    slug: 'protein-recipes',
    type: 'post',
    title: 'High-Protein Dinner Recipes',
    description: 'Quick 30-minute meals with 40g+ protein per serving.',
    source: 'Instagram',
    imageUrl:
      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['recipes', 'healthy'],
    collectionSlug: 'recipes',
    daysAgo: 7,
  },
  {
    slug: 'bali-stays',
    type: 'screenshot',
    title: 'Bali Boutique Stay Ideas',
    description: 'Hidden villas and boutique hotels near Ubud rice terraces.',
    source: 'Screenshot',
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['travel', 'Bali'],
    collectionSlug: 'travel',
    daysAgo: 8,
  },
  {
    slug: 'capsule-wardrobe',
    type: 'link',
    title: 'Capsule Wardrobe Picks',
    description: 'Essential pieces for a versatile minimalist wardrobe.',
    source: 'Link',
    sourceUrl: 'https://example.com/capsule-wardrobe',
    imageUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['shopping', 'fashion'],
    collectionSlug: 'shopping',
    daysAgo: 9,
  },
  {
    slug: 'costco-finds',
    type: 'post',
    title: 'Costco Meal Prep Haul',
    description: 'Weekly grocery staples and bulk buys for busy founders.',
    source: 'Instagram',
    imageUrl:
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['Costco', 'recipes'],
    collectionSlug: 'recipes',
    daysAgo: 3,
  },
  {
    slug: 'startup-ideas',
    type: 'reel',
    title: 'SaaS Positioning Framework',
    description: 'How to niche down and find your first 100 customers.',
    source: 'Instagram',
    imageUrl:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['business', 'startup'],
    collectionSlug: 'business-ideas',
    daysAgo: 4,
  },
  {
    slug: 'bali-beaches',
    type: 'link',
    title: 'Bali Beach Club List',
    description: 'Best sunset spots in Canggu and Uluwatu.',
    source: 'Link',
    imageUrl:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop',
    status: 'ready',
    tags: ['travel', 'Bali'],
    collectionSlug: 'travel',
    daysAgo: 5,
  },
  {
    slug: 'processing-reel',
    type: 'reel',
    title: 'New packaging inspiration',
    description: 'Awaiting summary from Faye.',
    source: 'Instagram',
    status: 'processing',
    tags: ['packaging'],
    collectionSlug: 'business-ideas',
    daysAgo: 0,
  },
  {
    slug: 'processing-link',
    type: 'link',
    title: 'Article on D2C retention',
    description: 'Awaiting summary from Faye.',
    source: 'Link',
    status: 'processing',
    tags: ['business'],
    collectionSlug: 'business-ideas',
    daysAgo: 0,
  },
] as const;

const SEARCH_DEFS = [
  'recipes from last week',
  'Costco',
  'travel ideas for Bali',
  'packaging inspiration',
];

function daysAgoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function seedDashboardContent(teamId: number, userId: number) {
  const [existing] = await db
    .select({ id: saves.id })
    .from(saves)
    .where(eq(saves.teamId, teamId))
    .limit(1);

  if (existing) {
    console.log('Dashboard content already seeded for this team.');
    return;
  }

  const collectionIds = new Map<string, number>();

  for (const def of COLLECTION_DEFS) {
    const [collection] = await db
      .insert(collections)
      .values({
        teamId,
        userId,
        name: def.name,
        slug: def.slug,
        icon: def.icon,
        gradient: def.gradient,
        isSmart: true,
      })
      .returning();
    collectionIds.set(def.slug, collection.id);
  }

  const saveIds = new Map<string, number>();

  for (const def of SAVE_DEFS) {
    const [save] = await db
      .insert(saves)
      .values({
        teamId,
        userId,
        type: def.type,
        title: def.title,
        description: def.description,
        source: def.source,
        sourceUrl: 'sourceUrl' in def ? def.sourceUrl : null,
        imageUrl: 'imageUrl' in def ? def.imageUrl : null,
        status: def.status,
        createdAt: daysAgoDate(def.daysAgo),
        updatedAt: daysAgoDate(def.daysAgo),
      })
      .returning();

    saveIds.set(def.slug, save.id);

    const collectionId = collectionIds.get(def.collectionSlug);
    if (collectionId) {
      await db.insert(saveCollections).values({
        saveId: save.id,
        collectionId,
      });
    }

    for (const tag of def.tags) {
      await db.insert(saveTags).values({ saveId: save.id, tag });
    }
  }

  for (const query of SEARCH_DEFS) {
    await db.insert(savedSearches).values({
      teamId,
      userId,
      query,
      label: query,
      lastUsedAt: new Date(),
    });
  }

  const packagingSaveId = saveIds.get('packaging-reel');
  if (packagingSaveId) {
    await db.insert(retrievals).values({
      teamId,
      userId,
      saveId: packagingSaveId,
      query: 'Find that packaging reel I saved',
      responseText: 'Found it — saved from Instagram recently.',
      createdAt: daysAgoDate(1),
    });
  }

  for (let i = 0; i < 5; i++) {
    await db.insert(retrievals).values({
      teamId,
      userId,
      saveId: packagingSaveId ?? null,
      query: `Sample retrieval query ${i + 1}`,
      responseText: 'Here is a matching save from your library.',
      createdAt: daysAgoDate(i + 2),
    });
  }

  console.log(
    `Seeded ${COLLECTION_DEFS.length} collections, ${SAVE_DEFS.length} saves, and demo searches.`
  );
}

export async function seedDashboardContentForAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'hello@fyndlater.com';
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    console.log('Admin user not found — skipping dashboard content seed.');
    return;
  }

  const [membership] = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (!membership) {
    console.log('Admin team not found — skipping dashboard content seed.');
    return;
  }

  await seedDashboardContent(membership.teamId, user.id);
}

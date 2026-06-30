import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: varchar('role', { length: 20 }).notNull().default('member'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeProductId: text('stripe_product_id'),
  planName: varchar('plan_name', { length: 50 }),
  subscriptionStatus: varchar('subscription_status', { length: 20 }),
});

export const teamMembers = pgTable('team_members', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  role: varchar('role', { length: 50 }).notNull(),
  joinedAt: timestamp('joined_at').notNull().defaultNow(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
});

export const invitations = pgTable('invitations', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  invitedBy: integer('invited_by')
    .notNull()
    .references(() => users.id),
  invitedAt: timestamp('invited_at').notNull().defaultNow(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
});

export const collections = pgTable(
  'collections',
  {
    id: serial('id').primaryKey(),
    teamId: integer('team_id')
      .notNull()
      .references(() => teams.id),
    userId: integer('user_id').references(() => users.id),
    name: varchar('name', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
    icon: varchar('icon', { length: 10 }),
    gradient: varchar('gradient', { length: 100 }),
    isSmart: boolean('is_smart').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    teamSlugIdx: uniqueIndex('collections_team_slug_idx').on(
      table.teamId,
      table.slug
    ),
  })
);

export const saves = pgTable('saves', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  type: varchar('type', { length: 20 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  source: varchar('source', { length: 50 }).notNull(),
  sourceUrl: text('source_url'),
  imageUrl: text('image_url'),
  status: varchar('status', { length: 20 }).notNull().default('processing'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const saveCollections = pgTable(
  'save_collections',
  {
    saveId: integer('save_id')
      .notNull()
      .references(() => saves.id, { onDelete: 'cascade' }),
    collectionId: integer('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.saveId, table.collectionId] }),
  })
);

export const saveTags = pgTable(
  'save_tags',
  {
    saveId: integer('save_id')
      .notNull()
      .references(() => saves.id, { onDelete: 'cascade' }),
    tag: varchar('tag', { length: 50 }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.saveId, table.tag] }),
  })
);

export const savedSearches = pgTable('saved_searches', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  query: text('query').notNull(),
  label: varchar('label', { length: 100 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
});

export const retrievals = pgTable('retrievals', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id')
    .notNull()
    .references(() => teams.id),
  userId: integer('user_id').references(() => users.id),
  saveId: integer('save_id').references(() => saves.id, { onDelete: 'set null' }),
  query: text('query').notNull(),
  responseText: text('response_text'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const instagramIdentities = pgTable(
  'instagram_identities',
  {
    id: serial('id').primaryKey(),
    fyndlaterUserId: integer('fyndlater_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    instagramSenderId: varchar('instagram_sender_id', { length: 64 })
      .notNull(),
    instagramUsername: varchar('instagram_username', { length: 100 }),
    status: varchar('status', { length: 20 }).notNull().default('unlinked'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    senderIdx: uniqueIndex('instagram_identities_sender_idx').on(
      table.instagramSenderId
    ),
  })
);

export const instagramWebhookEvents = pgTable(
  'instagram_webhook_events',
  {
    id: serial('id').primaryKey(),
    providerEventId: varchar('provider_event_id', { length: 255 }).notNull(),
    senderIgsid: varchar('sender_igsid', { length: 64 }),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    rawPayload: jsonb('raw_payload').notNull(),
    processedStatus: varchar('processed_status', { length: 20 })
      .notNull()
      .default('received'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    providerEventIdx: uniqueIndex('instagram_webhook_events_provider_idx').on(
      table.providerEventId
    ),
  })
);

export const savedItems = pgTable('saved_items', {
  id: serial('id').primaryKey(),
  fyndlaterUserId: integer('fyndlater_user_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  sourceChannel: varchar('source_channel', { length: 20 })
    .notNull()
    .default('instagram'),
  sourceMessageId: varchar('source_message_id', { length: 255 }),
  sourceUrl: text('source_url'),
  contentType: varchar('content_type', { length: 20 }).notNull().default('unknown'),
  title: varchar('title', { length: 255 }),
  summary: text('summary'),
  tags: jsonb('tags').$type<string[]>().default([]),
  collection: varchar('collection', { length: 100 }),
  rawText: text('raw_text'),
  mediaStorageUrl: text('media_storage_url'),
  embeddingStatus: varchar('embedding_status', { length: 20 })
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const outboundMessages = pgTable('outbound_messages', {
  id: serial('id').primaryKey(),
  channel: varchar('channel', { length: 20 }).notNull().default('instagram'),
  recipientIgsid: varchar('recipient_igsid', { length: 64 }).notNull(),
  messageText: text('message_text').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  providerResponse: jsonb('provider_response'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  sentAt: timestamp('sent_at'),
});

/** Global cache of processed Instagram reels keyed by shortcode (shared across users). */
export const reelProcessingCache = pgTable('reel_processing_cache', {
  shortcode: varchar('shortcode', { length: 64 }).primaryKey(),
  reelUrl: text('reel_url').notNull(),
  record: jsonb('record').notNull().$type<Record<string, unknown>>(),
  processedAt: timestamp('processed_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const teamsRelations = relations(teams, ({ many }) => ({
  teamMembers: many(teamMembers),
  activityLogs: many(activityLogs),
  invitations: many(invitations),
  collections: many(collections),
  saves: many(saves),
  savedSearches: many(savedSearches),
  retrievals: many(retrievals),
}));

export const usersRelations = relations(users, ({ many }) => ({
  teamMembers: many(teamMembers),
  invitationsSent: many(invitations),
  saves: many(saves),
  collections: many(collections),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  team: one(teams, {
    fields: [invitations.teamId],
    references: [teams.id],
  }),
  invitedBy: one(users, {
    fields: [invitations.invitedBy],
    references: [users.id],
  }),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
  }),
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  team: one(teams, {
    fields: [activityLogs.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  team: one(teams, {
    fields: [collections.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  saveCollections: many(saveCollections),
}));

export const savesRelations = relations(saves, ({ one, many }) => ({
  team: one(teams, {
    fields: [saves.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [saves.userId],
    references: [users.id],
  }),
  saveCollections: many(saveCollections),
  saveTags: many(saveTags),
  retrievals: many(retrievals),
}));

export const saveCollectionsRelations = relations(saveCollections, ({ one }) => ({
  save: one(saves, {
    fields: [saveCollections.saveId],
    references: [saves.id],
  }),
  collection: one(collections, {
    fields: [saveCollections.collectionId],
    references: [collections.id],
  }),
}));

export const saveTagsRelations = relations(saveTags, ({ one }) => ({
  save: one(saves, {
    fields: [saveTags.saveId],
    references: [saves.id],
  }),
}));

export const savedSearchesRelations = relations(savedSearches, ({ one }) => ({
  team: one(teams, {
    fields: [savedSearches.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [savedSearches.userId],
    references: [users.id],
  }),
}));

export const retrievalsRelations = relations(retrievals, ({ one }) => ({
  team: one(teams, {
    fields: [retrievals.teamId],
    references: [teams.id],
  }),
  user: one(users, {
    fields: [retrievals.userId],
    references: [users.id],
  }),
  save: one(saves, {
    fields: [retrievals.saveId],
    references: [saves.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert;
export type Collection = typeof collections.$inferSelect;
export type NewCollection = typeof collections.$inferInsert;
export type Save = typeof saves.$inferSelect;
export type NewSave = typeof saves.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type Retrieval = typeof retrievals.$inferSelect;
export type NewRetrieval = typeof retrievals.$inferInsert;
export type InstagramIdentity = typeof instagramIdentities.$inferSelect;
export type NewInstagramIdentity = typeof instagramIdentities.$inferInsert;
export type InstagramWebhookEvent = typeof instagramWebhookEvents.$inferSelect;
export type NewInstagramWebhookEvent = typeof instagramWebhookEvents.$inferInsert;
export type SavedItem = typeof savedItems.$inferSelect;
export type NewSavedItem = typeof savedItems.$inferInsert;
export type OutboundMessage = typeof outboundMessages.$inferSelect;
export type NewOutboundMessage = typeof outboundMessages.$inferInsert;
export type ReelProcessingCache = typeof reelProcessingCache.$inferSelect;
export type NewReelProcessingCache = typeof reelProcessingCache.$inferInsert;

export type SaveType = 'reel' | 'post' | 'screenshot' | 'link';
export type SaveStatus = 'processing' | 'ready' | 'failed';

export type TeamDataWithMembers = Team & {
  teamMembers: (TeamMember & {
    user: Pick<User, 'id' | 'name' | 'email'>;
  })[];
};

export enum ActivityType {
  SIGN_UP = 'SIGN_UP',
  SIGN_IN = 'SIGN_IN',
  SIGN_OUT = 'SIGN_OUT',
  UPDATE_PASSWORD = 'UPDATE_PASSWORD',
  DELETE_ACCOUNT = 'DELETE_ACCOUNT',
  UPDATE_ACCOUNT = 'UPDATE_ACCOUNT',
  CREATE_TEAM = 'CREATE_TEAM',
  REMOVE_TEAM_MEMBER = 'REMOVE_TEAM_MEMBER',
  INVITE_TEAM_MEMBER = 'INVITE_TEAM_MEMBER',
  ACCEPT_INVITATION = 'ACCEPT_INVITATION',
}

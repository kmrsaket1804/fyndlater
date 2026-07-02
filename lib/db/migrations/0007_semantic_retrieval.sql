ALTER TABLE "saves" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical_content" (
  "id" serial PRIMARY KEY NOT NULL,
  "canonical_key" varchar(128) NOT NULL,
  "chunk_type" varchar(32) NOT NULL DEFAULT 'document',
  "chunk_index" integer,
  "embedding_version" varchar(32) NOT NULL DEFAULT 'v1',
  "search_text" text NOT NULL,
  "qdrant_point_id" varchar(64) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "canonical_content_key_chunk_version_idx" ON "canonical_content" ("canonical_key", "chunk_type", "chunk_index", "embedding_version");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "save_embedding_points" (
  "id" serial PRIMARY KEY NOT NULL,
  "save_id" integer NOT NULL REFERENCES "saves"("id") ON DELETE cascade,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "saved_item_id" integer REFERENCES "saved_items"("id") ON DELETE set null,
  "canonical_key" varchar(128),
  "qdrant_point_id" varchar(64) NOT NULL,
  "chunk_type" varchar(32) NOT NULL DEFAULT 'document',
  "chunk_index" integer,
  "embedding_version" varchar(32) NOT NULL DEFAULT 'v1',
  "deleted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "save_embedding_points_qdrant_point_idx" ON "save_embedding_points" ("qdrant_point_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "save_embedding_points_user_save_idx" ON "save_embedding_points" ("user_id", "save_id") WHERE "deleted" = false;

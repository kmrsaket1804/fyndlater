ALTER TABLE "saves" ADD COLUMN IF NOT EXISTS "canonical_key" varchar(128);
--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN IF NOT EXISTS "enrichment_status" varchar(32) NOT NULL DEFAULT 'pending';
--> statement-breakpoint
ALTER TABLE "saves" ADD COLUMN IF NOT EXISTS "processing_version" integer NOT NULL DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN IF NOT EXISTS "canonical_key" varchar(128);
--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN IF NOT EXISTS "enrichment_status" varchar(32);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saves_canonical_key_idx" ON "saves" ("canonical_key") WHERE "canonical_key" IS NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "saves_user_canonical_idx" ON "saves" ("user_id", "canonical_key") WHERE "canonical_key" IS NOT NULL;

ALTER TABLE "saves" ADD COLUMN IF NOT EXISTS "metadata" jsonb;
--> statement-breakpoint
ALTER TABLE "saved_items" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

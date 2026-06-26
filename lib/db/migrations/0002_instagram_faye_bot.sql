CREATE TABLE IF NOT EXISTS "instagram_identities" (
	"id" serial PRIMARY KEY NOT NULL,
	"fyndlater_user_id" integer,
	"instagram_sender_id" varchar(64) NOT NULL,
	"instagram_username" varchar(100),
	"status" varchar(20) DEFAULT 'unlinked' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instagram_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider_event_id" varchar(255) NOT NULL,
	"sender_igsid" varchar(64),
	"event_type" varchar(50) NOT NULL,
	"raw_payload" jsonb NOT NULL,
	"processed_status" varchar(20) DEFAULT 'received' NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "saved_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"fyndlater_user_id" integer,
	"source_channel" varchar(20) DEFAULT 'instagram' NOT NULL,
	"source_message_id" varchar(255),
	"source_url" text,
	"content_type" varchar(20) DEFAULT 'unknown' NOT NULL,
	"title" varchar(255),
	"summary" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"collection" varchar(100),
	"raw_text" text,
	"media_storage_url" text,
	"embedding_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "outbound_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"channel" varchar(20) DEFAULT 'instagram' NOT NULL,
	"recipient_igsid" varchar(64) NOT NULL,
	"message_text" text NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"provider_response" jsonb,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_identities" ADD CONSTRAINT "instagram_identities_fyndlater_user_id_users_id_fk" FOREIGN KEY ("fyndlater_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_fyndlater_user_id_users_id_fk" FOREIGN KEY ("fyndlater_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_identities_sender_idx" ON "instagram_identities" USING btree ("instagram_sender_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_webhook_events_provider_idx" ON "instagram_webhook_events" USING btree ("provider_event_id");

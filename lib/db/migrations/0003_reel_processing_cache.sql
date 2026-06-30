CREATE TABLE IF NOT EXISTS "reel_processing_cache" (
	"shortcode" varchar(64) PRIMARY KEY NOT NULL,
	"reel_url" text NOT NULL,
	"record" jsonb NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

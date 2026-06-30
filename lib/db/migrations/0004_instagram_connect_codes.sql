CREATE TABLE IF NOT EXISTS "instagram_connect_codes" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "code" varchar(12) NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "linked_sender_id" varchar(64),
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "instagram_connect_codes" ADD CONSTRAINT "instagram_connect_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "instagram_connect_codes_code_idx" ON "instagram_connect_codes" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "instagram_connect_codes_user_idx" ON "instagram_connect_codes" USING btree ("user_id");

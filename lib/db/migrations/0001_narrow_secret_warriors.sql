CREATE TABLE "collections" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(10),
	"gradient" varchar(100),
	"is_smart" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "retrievals" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"save_id" integer,
	"query" text NOT NULL,
	"response_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "save_collections" (
	"save_id" integer NOT NULL,
	"collection_id" integer NOT NULL,
	CONSTRAINT "save_collections_save_id_collection_id_pk" PRIMARY KEY("save_id","collection_id")
);
--> statement-breakpoint
CREATE TABLE "save_tags" (
	"save_id" integer NOT NULL,
	"tag" varchar(50) NOT NULL,
	CONSTRAINT "save_tags_save_id_tag_pk" PRIMARY KEY("save_id","tag")
);
--> statement-breakpoint
CREATE TABLE "saved_searches" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"query" text NOT NULL,
	"label" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_used_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "saves" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer,
	"type" varchar(20) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"source" varchar(50) NOT NULL,
	"source_url" text,
	"image_url" text,
	"status" varchar(20) DEFAULT 'processing' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrievals" ADD CONSTRAINT "retrievals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrievals" ADD CONSTRAINT "retrievals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "retrievals" ADD CONSTRAINT "retrievals_save_id_saves_id_fk" FOREIGN KEY ("save_id") REFERENCES "public"."saves"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "save_collections" ADD CONSTRAINT "save_collections_save_id_saves_id_fk" FOREIGN KEY ("save_id") REFERENCES "public"."saves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "save_collections" ADD CONSTRAINT "save_collections_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "save_tags" ADD CONSTRAINT "save_tags_save_id_saves_id_fk" FOREIGN KEY ("save_id") REFERENCES "public"."saves"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saves" ADD CONSTRAINT "saves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_team_slug_idx" ON "collections" USING btree ("team_id","slug");
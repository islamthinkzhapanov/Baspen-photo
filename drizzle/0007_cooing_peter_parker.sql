CREATE TABLE "photographer_breaks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_end_time" text;--> statement-breakpoint
ALTER TABLE "photographer_breaks" ADD CONSTRAINT "photographer_breaks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "photographer_breaks_owner_idx" ON "photographer_breaks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "photographer_breaks_date_idx" ON "photographer_breaks" USING btree ("date");
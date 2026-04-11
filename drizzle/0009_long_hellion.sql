CREATE TYPE "public"."event_status" AS ENUM('planned', 'completed', 'cancelled');--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "event_status" "event_status" DEFAULT 'planned' NOT NULL;
ALTER TABLE "face_embeddings" ADD COLUMN "rekognition_face_id" text;--> statement-breakpoint
ALTER TABLE "participants" ADD COLUMN "rekognition_face_id" text;--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "thumbnail_avif_path" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "occupation" text;
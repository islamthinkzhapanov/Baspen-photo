-- Performance: HNSW index upgrade, GIN index for bib search, AVIF thumbnail path

-- 1. Upgrade pgvector index from IVFFlat to HNSW
-- HNSW provides better recall (99.5%+ vs 95%) and doesn't need a training step.
DROP INDEX IF EXISTS "face_embeddings_embedding_idx";--> statement-breakpoint

CREATE INDEX "face_embeddings_embedding_hnsw_idx"
ON "face_embeddings"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);--> statement-breakpoint

-- 2. GIN index for bib number array search
CREATE INDEX IF NOT EXISTS "photos_bib_numbers_gin_idx"
ON "photos" USING gin ("bib_numbers")
WHERE "bib_numbers" IS NOT NULL;--> statement-breakpoint

-- 3. Index for active participants (match-participants worker)
CREATE INDEX IF NOT EXISTS "participants_active_idx"
ON "participants" ("event_id", "last_search_at" DESC)
WHERE selfie_embedding IS NOT NULL;--> statement-breakpoint

-- 4. Add AVIF thumbnail path column
ALTER TABLE "photos" ADD COLUMN "thumbnail_avif_path" text;

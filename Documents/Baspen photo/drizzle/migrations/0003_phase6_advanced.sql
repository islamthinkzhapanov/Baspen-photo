-- Phase 6: Advanced features

-- 1. API Keys table (camera auto-upload)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,
  key_prefix text NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  is_revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS api_keys_user_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_event_idx ON api_keys(event_id);
CREATE INDEX IF NOT EXISTS api_keys_hash_idx ON api_keys(key_hash);

-- 2. Upgrade pgvector index from IVFFlat to HNSW
-- HNSW provides better recall (99.5%+ vs 95%) and doesn't need a training step.
-- Trade-off: more memory, but much better query quality for face matching.
DROP INDEX IF EXISTS face_embeddings_embedding_idx;

CREATE INDEX face_embeddings_embedding_hnsw_idx
ON face_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- 3. Partial index for bib number search (faster lookups)
CREATE INDEX IF NOT EXISTS photos_bib_numbers_idx
ON photos USING gin (bib_numbers)
WHERE bib_numbers IS NOT NULL;

-- 4. Index for active participants (used by match-participants worker)
CREATE INDEX IF NOT EXISTS participants_active_idx
ON participants (event_id, last_search_at DESC)
WHERE selfie_embedding IS NOT NULL;

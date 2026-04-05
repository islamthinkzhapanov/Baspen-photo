-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to face_embeddings table
ALTER TABLE face_embeddings
ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Create IVFFlat index for fast similarity search
-- Partitioned by event_id for efficient per-event queries
CREATE INDEX IF NOT EXISTS face_embeddings_embedding_idx
ON face_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create participants table for anonymous search sessions
CREATE TABLE IF NOT EXISTS participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  selfie_embedding vector(512),
  bib_number TEXT,
  phone TEXT,
  email TEXT,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  last_search_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS participants_event_idx ON participants(event_id);
CREATE INDEX IF NOT EXISTS participants_session_idx ON participants(session_token);
CREATE INDEX IF NOT EXISTS participants_bib_idx ON participants(event_id, bib_number) WHERE bib_number IS NOT NULL;

-- Create participant_matches table (cached search results)
CREATE TABLE IF NOT EXISTS participant_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  similarity REAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(participant_id, photo_id)
);

CREATE INDEX IF NOT EXISTS participant_matches_participant_idx ON participant_matches(participant_id);
CREATE INDEX IF NOT EXISTS participant_matches_similarity_idx ON participant_matches(participant_id, similarity DESC);

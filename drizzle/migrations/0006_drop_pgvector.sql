-- Drop pgvector columns and indexes (replaced by AWS Rekognition)

-- Drop HNSW index on face_embeddings.embedding
DROP INDEX IF EXISTS face_embeddings_embedding_hnsw_idx;

-- Drop IVFFlat index (in case HNSW migration wasn't applied)
DROP INDEX IF EXISTS face_embeddings_embedding_idx;

-- Drop vector columns
ALTER TABLE face_embeddings DROP COLUMN IF EXISTS embedding;
ALTER TABLE participants DROP COLUMN IF EXISTS selfie_embedding;

-- Drop pgvector extension (no longer needed)
DROP EXTENSION IF EXISTS vector;

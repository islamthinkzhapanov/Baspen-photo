-- Add Rekognition face ID columns for AWS Rekognition migration
-- pgvector columns are kept during the transition period

ALTER TABLE face_embeddings ADD COLUMN rekognition_face_id TEXT;
CREATE INDEX face_embeddings_rek_face_id_idx ON face_embeddings(rekognition_face_id);

ALTER TABLE participants ADD COLUMN rekognition_face_id TEXT;

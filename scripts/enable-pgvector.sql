-- Enable pgvector extension for vector similarity search
-- Run this in Supabase SQL Editor before running migrations

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify extension is installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Create vector similarity search function (cosine distance)
-- This will help with semantic search queries
CREATE OR REPLACE FUNCTION match_note_chunks(
  query_embedding vector(1024),
  match_threshold float,
  match_count int,
  filter_note_ids uuid[] DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  note_id uuid,
  chunk_index int,
  content text,
  heading text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    note_chunks.id,
    note_chunks.note_id,
    note_chunks.chunk_index,
    note_chunks.content,
    note_chunks.heading,
    1 - (note_chunks.embedding <=> query_embedding) as similarity
  FROM note_chunks
  WHERE 
    (filter_note_ids IS NULL OR note_chunks.note_id = ANY(filter_note_ids))
    AND note_chunks.embedding IS NOT NULL
    AND 1 - (note_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY note_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create index for faster vector similarity search
-- Note: This will be created in the migration, but including here for reference
-- CREATE INDEX IF NOT EXISTS note_chunks_embedding_idx ON note_chunks 
-- USING ivfflat (embedding vector_cosine_ops)
-- WITH (lists = 100);

COMMENT ON FUNCTION match_note_chunks IS 'Semantic search for note chunks using vector similarity';

-- Rule Embeddings Table for RAG Retrieval
-- Migration: 002_rule_embeddings
-- Description: Creates vector store table for semantic search over COLREG rule chunks

-- Enable pgvector extension (required for vector operations)
CREATE EXTENSION IF NOT EXISTS vector;

-- Rule embeddings table for storing chunked rule content with embeddings
CREATE TABLE IF NOT EXISTS rule_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id TEXT NOT NULL,              -- e.g., "rule_27", "annex_i"
  subsection TEXT,                     -- e.g., "(a)", "(b)(i)", "(f)"
  content TEXT NOT NULL,               -- The chunk content (subsection + summary)
  embedding VECTOR(1536) NOT NULL,     -- OpenAI text-embedding-3-large with dimensions=1536
  language TEXT NOT NULL DEFAULT 'en', -- Language code for future multi-language support
  metadata JSONB DEFAULT '{}',         -- Additional metadata (rule title, part, section, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search (using HNSW for performance)
-- m=16 and ef_construction=64 are good defaults for ~500 chunks
CREATE INDEX IF NOT EXISTS idx_rule_embeddings_vector
  ON rule_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for filtering by language
CREATE INDEX IF NOT EXISTS idx_rule_embeddings_language
  ON rule_embeddings(language);

-- Index for filtering by rule_id
CREATE INDEX IF NOT EXISTS idx_rule_embeddings_rule_id
  ON rule_embeddings(rule_id);

-- Composite index for language + rule_id queries
CREATE INDEX IF NOT EXISTS idx_rule_embeddings_lang_rule
  ON rule_embeddings(language, rule_id);

-- Enable Row Level Security
ALTER TABLE rule_embeddings ENABLE ROW LEVEL SECURITY;

-- Public read access policy
CREATE POLICY "Public read access for rule_embeddings"
  ON rule_embeddings
  FOR SELECT
  USING (true);

-- Allow service role to insert/update/delete (for ingestion script)
CREATE POLICY "Service role full access for rule_embeddings"
  ON rule_embeddings
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function if it doesn't exist (may already exist from 001)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger
CREATE TRIGGER update_rule_embeddings_updated_at
  BEFORE UPDATE ON rule_embeddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for semantic similarity search
-- Returns top-k most similar chunks above a similarity threshold
CREATE OR REPLACE FUNCTION match_rule_embeddings(
  query_embedding VECTOR(1536),
  match_threshold FLOAT DEFAULT 0.4,
  match_count INT DEFAULT 5,
  filter_language TEXT DEFAULT 'en'
)
RETURNS TABLE (
  id UUID,
  rule_id TEXT,
  subsection TEXT,
  content TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  SELECT
    re.id,
    re.rule_id,
    re.subsection,
    re.content,
    1 - (re.embedding <=> query_embedding) AS similarity,
    re.metadata
  FROM rule_embeddings re
  WHERE re.language = filter_language
    AND 1 - (re.embedding <=> query_embedding) > match_threshold
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION match_rule_embeddings TO anon, authenticated;

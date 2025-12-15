-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Knowledge Documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  content_text TEXT,
  processed BOOLEAN DEFAULT false,
  embeddings vector(1536),  -- OpenAI text-embedding-3-small dimension
  metadata JSONB,  -- {topics, keyTerms, dataStructures}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_user ON knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_processed ON knowledge_documents(processed);

-- ivfflat index for pgvector. Choose lists based on dataset size; adjust as needed.
CREATE INDEX IF NOT EXISTS idx_knowledge_embeddings ON knowledge_documents 
  USING ivfflat (embeddings vector_cosine_ops) WITH (lists = 100);

-- Optional: trigger to update `updated_at` timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_knowledge_update_at ON knowledge_documents;
CREATE TRIGGER trg_knowledge_update_at
BEFORE UPDATE ON knowledge_documents
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

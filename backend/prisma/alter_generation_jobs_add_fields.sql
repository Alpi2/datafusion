-- Alter generation_jobs to add knowledge and reporting fields
ALTER TABLE generation_jobs
  ADD COLUMN IF NOT EXISTS knowledge_document_ids UUID[],
  ADD COLUMN IF NOT EXISTS chat_context JSONB,
  ADD COLUMN IF NOT EXISTS validation_report JSONB,
  ADD COLUMN IF NOT EXISTS compliance_report JSONB;

-- Optional: update updated_at trigger if you have one for this table
-- If you maintain an `updated_at` column via triggers, ensure it still functions after altering the table.

-- Migration: Add observability columns to analyses table
-- Purpose: Track retry attempts and last error for fire-and-forget analysis reliability
-- Run: Apply via Supabase SQL editor (Keli controls the DB)

ALTER TABLE analyses
  ADD COLUMN IF NOT EXISTS retries integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text;

-- Add index for faster polling by handshake_id + status
CREATE INDEX IF NOT EXISTS idx_analyses_handshake_status
  ON analyses (handshake_id, analysis_status);

COMMENT ON COLUMN analyses.retries IS 'Number of retry attempts for this analysis';
COMMENT ON COLUMN analyses.last_error IS 'Last error message from failed analysis attempt';

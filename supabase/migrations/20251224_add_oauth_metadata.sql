-- Add metadata column to oauth_states to store code_verifier and other transitional data
ALTER TABLE oauth_states ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add columns needed for storing customer-managed AI provider configuration
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS ai_provider TEXT,
  ADD COLUMN IF NOT EXISTS ai_model TEXT,
  ADD COLUMN IF NOT EXISTS ai_provider_api_key TEXT;

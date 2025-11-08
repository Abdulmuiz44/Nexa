-- Add provider_tx_id column to payment_history for provider transaction/reference ids
-- 20251108_add_provider_tx_id.sql

ALTER TABLE payment_history
  ADD COLUMN IF NOT EXISTS provider_tx_id TEXT;

-- Helpful index for lookups by provider_tx_id (tx_ref or provider transaction id)
CREATE INDEX IF NOT EXISTS idx_payment_history_provider_tx_id
  ON payment_history(provider_tx_id);

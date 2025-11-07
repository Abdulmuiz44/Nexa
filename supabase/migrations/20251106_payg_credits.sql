-- Credit decimal precision, wallet helpers, and spend/add RPCs
-- 20251106_payg_credits.sql

-- 1) Change integer credits to NUMERIC(18,4)
ALTER TABLE credits_wallet
  ALTER COLUMN balance TYPE NUMERIC(18,4) USING balance::numeric,
  ALTER COLUMN total_purchased TYPE NUMERIC(18,4) USING total_purchased::numeric,
  ALTER COLUMN total_spent TYPE NUMERIC(18,4) USING total_spent::numeric;

ALTER TABLE credit_transactions
  ALTER COLUMN credits TYPE NUMERIC(18,4) USING credits::numeric;

-- 2) Auto top-up controls
ALTER TABLE credits_wallet
  ADD COLUMN IF NOT EXISTS auto_top_up BOOLEAN DEFAULT FALSE NOT NULL,
  ADD COLUMN IF NOT EXISTS top_up_threshold NUMERIC(18,4) DEFAULT 5.0000 NOT NULL;

-- 3) Ensure wallet function
CREATE OR REPLACE FUNCTION ensure_user_wallet(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO credits_wallet (user_id, balance, total_purchased, total_spent)
  SELECT p_user_id, 0, 0, 0
  WHERE NOT EXISTS (
    SELECT 1 FROM credits_wallet w WHERE w.user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- 4) Add credits (purchase/earn)
CREATE OR REPLACE FUNCTION add_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'credit_top_up',
  p_reference UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS NUMERIC AS $$
DECLARE v_balance NUMERIC; BEGIN
  PERFORM ensure_user_wallet(p_user_id);
  UPDATE credits_wallet
     SET balance = ROUND(balance + p_amount, 4),
         total_purchased = ROUND(total_purchased + GREATEST(p_amount, 0), 4),
         updated_at = NOW()
   WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, tx_type, credits, description, reference_id, metadata, created_at)
  VALUES (p_user_id, 'purchase', ROUND(p_amount, 4), p_description, p_reference, p_metadata, NOW());

  SELECT balance INTO v_balance FROM credits_wallet WHERE user_id = p_user_id;
  RETURN v_balance;
END; $$ LANGUAGE plpgsql;

-- 5) Spend credits (usage)
CREATE OR REPLACE FUNCTION spend_credits(
  p_user_id UUID,
  p_amount NUMERIC,
  p_description TEXT DEFAULT 'openai_usage',
  p_reference UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS TABLE(success BOOLEAN, new_balance NUMERIC) AS $$
DECLARE v_balance NUMERIC; BEGIN
  PERFORM ensure_user_wallet(p_user_id);

  SELECT balance INTO v_balance FROM credits_wallet WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL THEN
    success := FALSE; new_balance := NULL; RETURN;
  END IF;
  IF v_balance < p_amount THEN
    success := FALSE; new_balance := v_balance; RETURN;
  END IF;

  UPDATE credits_wallet
     SET balance = ROUND(balance - p_amount, 4),
         total_spent = ROUND(total_spent + p_amount, 4),
         updated_at = NOW()
   WHERE user_id = p_user_id;

  INSERT INTO credit_transactions (user_id, tx_type, credits, description, reference_id, metadata, created_at)
  VALUES (p_user_id, 'spend', ROUND(-p_amount, 4), p_description, p_reference, p_metadata, NOW());

  SELECT balance INTO new_balance FROM credits_wallet WHERE user_id = p_user_id;
  success := TRUE; RETURN;
END; $$ LANGUAGE plpgsql;

-- 6) Helpful index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at);

-- =====================================================
-- CLEAN RESET (SAFE): DROP EXISTING OBJECTS IF THEY EXIST
-- =====================================================

-- Drop triggers safely
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        DROP TRIGGER update_users_updated_at ON users;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_connected_accounts_updated_at') THEN
        DROP TRIGGER update_connected_accounts_updated_at ON connected_accounts;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
        DROP TRIGGER update_conversations_updated_at ON conversations;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_updated_at') THEN
        DROP TRIGGER update_posts_updated_at ON posts;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaigns_updated_at') THEN
        DROP TRIGGER update_campaigns_updated_at ON campaigns;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_subscriptions_updated_at') THEN
        DROP TRIGGER update_subscriptions_updated_at ON subscriptions;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_composio_connections_updated_at') THEN
        DROP TRIGGER update_composio_connections_updated_at ON composio_connections;
    END IF;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states() CASCADE;

-- Drop tables (in dependency order)
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS connected_accounts CASCADE;
DROP TABLE IF EXISTS oauth_states CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS composio_connections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_plan CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS platform_type CASCADE;
DROP TYPE IF EXISTS post_status CASCADE;
DROP TYPE IF EXISTS campaign_status CASCADE;
DROP TYPE IF EXISTS conversation_source CASCADE;
DROP TYPE IF EXISTS message_role CASCADE;

-- =====================================================
-- RECREATE EVERYTHING
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_plan AS ENUM ('growth', 'scale', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');
CREATE TYPE platform_type AS ENUM ('twitter', 'reddit');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE conversation_source AS ENUM ('web', 'whatsapp');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    phone TEXT UNIQUE,
    country TEXT,
    api_key TEXT,
    plan user_plan DEFAULT 'growth',
    subscription_status subscription_status DEFAULT 'active',
    subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT DEFAULT 'onboarding',
    onboarding_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected accounts
CREATE TABLE connected_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    platform_user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    scopes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
);

-- Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source conversation_source DEFAULT 'web',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    platforms platform_type[] DEFAULT '{}',
    duration_days INTEGER DEFAULT 7,
    posts_per_day INTEGER DEFAULT 1,
    topic TEXT,
    status campaign_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Composio connections
CREATE TABLE composio_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    composio_connection_id TEXT NOT NULL UNIQUE,
    toolkit_slug TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Posts
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    composio_connection_id UUID REFERENCES composio_connections(id),
    platform platform_type NOT NULL,
    content TEXT NOT NULL,
    status post_status DEFAULT 'draft',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    platform_post_id TEXT,
    platform_post_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    stripe_subscription_id TEXT,
    flutterwave_subscription_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    interval TEXT DEFAULT 'month',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    impressions INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,4) DEFAULT 0,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth states
CREATE TABLE oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform platform_type NOT NULL,
    redirect_uri TEXT,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES + TRIGGERS + POLICIES
-- =====================================================

CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_composio_connections_updated_at BEFORE UPDATE ON composio_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE composio_connections ENABLE ROW LEVEL SECURITY;

-- Policies (kept same)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own connected accounts" ON connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connected accounts" ON connected_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connected accounts" ON connected_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connected accounts" ON connected_accounts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view analytics for own posts" ON analytics FOR SELECT USING (EXISTS (SELECT 1 FROM posts WHERE id = analytics.post_id AND user_id = auth.uid()));
CREATE POLICY "Users can view own activity log" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity log" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own oauth states" ON oauth_states FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert oauth states" ON oauth_states FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can delete own oauth states" ON oauth_states FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own composio connections" ON composio_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own composio connections" ON composio_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own composio connections" ON composio_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own composio connections" ON composio_connections FOR DELETE USING (auth.uid() = user_id);

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- START CREDIT-SYSTEM-SQL
-- Add credit_tx_type enum (if missing)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_tx_type') THEN
    CREATE TYPE credit_tx_type AS ENUM ('earn','spend','purchase','refund','adjust');
  END IF;
END $$;

-- credits_wallet table: integer credits (1 credit = $0.10)
CREATE TABLE IF NOT EXISTS credits_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,                -- integer credits
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- credit_transactions: audit log for earnings/spends/purchases
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_type credit_tx_type NOT NULL,
  credits INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  operation_type TEXT, -- e.g., 'CONTENT_GENERATION', 'CAMPAIGN_CREATION'
  operation_id UUID,   -- links to specific operation records
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_history: external payment records for top-ups
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_usd NUMERIC(10,2) NOT NULL,
  credits_issued INTEGER NOT NULL,
  payment_provider TEXT NOT NULL,
  provider_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending/completed/failed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- credit_usage_analytics: aggregated daily/weekly credit usage per user
CREATE TABLE IF NOT EXISTS credit_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_credits_spent INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  operation_breakdown JSONB DEFAULT '{}', -- breakdown by operation type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- credit_failures: log failed operations due to insufficient credits
CREATE TABLE IF NOT EXISTS credit_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL,
  credits_required INTEGER NOT NULL,
  credits_available INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_credits_wallet_user_id ON credits_wallet(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_operation_type ON credit_transactions(operation_type);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_analytics_user_id ON credit_usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_analytics_date ON credit_usage_analytics(date);
CREATE INDEX IF NOT EXISTS idx_credit_failures_user_id ON credit_failures(user_id);

-- Ensure updated_at trigger function exists (do not overwrite if present)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on new tables
DROP TRIGGER IF EXISTS update_credits_wallet_updated_at ON credits_wallet;
CREATE TRIGGER update_credits_wallet_updated_at BEFORE UPDATE ON credits_wallet
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_history_updated_at ON payment_history;
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON payment_history
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_credit_usage_analytics_updated_at ON credit_usage_analytics;
CREATE TRIGGER update_credit_usage_analytics_updated_at BEFORE UPDATE ON credit_usage_analytics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update credit analytics when transactions occur
CREATE OR REPLACE FUNCTION update_credit_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  tx_type TEXT;
  credit_change INTEGER;
BEGIN
  -- Determine transaction type and credit change
  IF NEW.tx_type = 'spend' THEN
    tx_type := 'spent';
    credit_change := NEW.credits;
  ELSIF NEW.tx_type = 'purchase' THEN
    tx_type := 'purchased';
    credit_change := NEW.credits;
  ELSE
    -- Skip non-spend/purchase transactions for analytics
    RETURN NEW;
  END IF;

  -- Insert or update analytics record
  INSERT INTO credit_usage_analytics (
    user_id,
    date,
    total_credits_spent,
    credits_purchased,
    operation_breakdown
  ) VALUES (
    NEW.user_id,
    today_date,
    CASE WHEN tx_type = 'spent' THEN credit_change ELSE 0 END,
    CASE WHEN tx_type = 'purchased' THEN credit_change ELSE 0 END,
    jsonb_build_object(
      COALESCE(NEW.operation_type, 'unknown'),
      credit_change
    )
  ) ON CONFLICT (user_id, date) DO UPDATE SET
    total_credits_spent = CASE
      WHEN tx_type = 'spent' THEN credit_usage_analytics.total_credits_spent + credit_change
      ELSE credit_usage_analytics.total_credits_spent
    END,
    credits_purchased = CASE
      WHEN tx_type = 'purchased' THEN credit_usage_analytics.credits_purchased + credit_change
      ELSE credit_usage_analytics.credits_purchased
    END,
    operation_breakdown = jsonb_set(
      COALESCE(credit_usage_analytics.operation_breakdown, '{}'),
      ARRAY[COALESCE(NEW.operation_type, 'unknown')],
      to_jsonb(COALESCE(credit_usage_analytics.operation_breakdown->>COALESCE(NEW.operation_type, 'unknown'), '0')::integer + credit_change)
    ),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update analytics on credit transactions
DROP TRIGGER IF EXISTS trigger_update_credit_analytics ON credit_transactions;
CREATE TRIGGER trigger_update_credit_analytics
  AFTER INSERT ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION update_credit_analytics();

-- Enable Row Level Security on new tables
ALTER TABLE credits_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_failures ENABLE ROW LEVEL SECURITY;

-- RLS policies (user-only access for read/insert; admin/service role expected for balance updates)
DROP POLICY IF EXISTS "Users can view own wallet" ON credits_wallet;
CREATE POLICY "Users can view own wallet" ON credits_wallet
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert wallet" ON credits_wallet;
CREATE POLICY "Users can insert wallet" ON credits_wallet
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to select their transactions and insert transactions they perform (in practice writes are made by server)
DROP POLICY IF EXISTS "Users can view own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own credit transactions" ON credit_transactions;
CREATE POLICY "Users can insert own credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payments" ON payment_history;
CREATE POLICY "Users can view own payments" ON payment_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payment histories" ON payment_history;
CREATE POLICY "Users can insert own payment histories" ON payment_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payment histories" ON payment_history;
CREATE POLICY "Users can update own payment histories" ON payment_history
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own credit analytics" ON credit_usage_analytics;
CREATE POLICY "Users can view own credit analytics" ON credit_usage_analytics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own credit failures" ON credit_failures;
CREATE POLICY "Users can view own credit failures" ON credit_failures
  FOR SELECT USING (auth.uid() = user_id);

-- Safe backfill: create wallets for existing users who don't have one yet, and grant 100 welcome credits
-- (1 credit = $0.10, so 100 credits = $10 welcome credit)
DO $$
BEGIN
  -- create missing wallets
  INSERT INTO credits_wallet (user_id, balance, total_purchased, total_spent, created_at, updated_at)
  SELECT u.id, 100, 0, 0, NOW(), NOW()
  FROM users u
  LEFT JOIN credits_wallet w ON w.user_id = u.id
  WHERE w.user_id IS NULL;

  -- create matching earn transactions, avoid duplicates by checking for existing welcome tx
  INSERT INTO credit_transactions (user_id, tx_type, credits, description, created_at)
  SELECT u.id, 'earn', 100, 'Welcome bonus: $10 free credits', NOW()
  FROM users u
  LEFT JOIN LATERAL (
    SELECT 1 FROM credit_transactions t
    WHERE t.user_id = u.id AND t.tx_type = 'earn' AND t.description ILIKE '%Welcome bonus%'
    LIMIT 1
  ) prev ON prev IS NOT NULL
  WHERE prev IS NULL;

END;
$$ LANGUAGE plpgsql;

-- END CREDIT-SYSTEM-SQL



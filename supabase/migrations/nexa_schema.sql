-- =====================================================
-- NEXA FULL SCHEMA (CORE + CREDITS + ANALYTICS + BI)
-- Single-file migration: DROP + CREATE (idempotent where possible)
-- =====================================================

/* ---------------------------
   CLEAN RESET (SAFE)
   --------------------------- */
-- Drop triggers safely (if exist)
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
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_credits_wallet_updated_at') THEN
        DROP TRIGGER update_credits_wallet_updated_at ON credits_wallet;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payment_history_updated_at') THEN
        DROP TRIGGER update_payment_history_updated_at ON payment_history;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_credit_analytics') THEN
        DROP TRIGGER trigger_update_credit_analytics ON credit_transactions;
    END IF;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_oauth_states() CASCADE;
DROP FUNCTION IF EXISTS update_credit_analytics() CASCADE;
DROP FUNCTION IF EXISTS update_revenue_on_payment() CASCADE;
DROP FUNCTION IF EXISTS update_subscriptions_analytics() CASCADE;

-- Drop tables (in dependency-safe order)
DROP TABLE IF EXISTS financial_insights CASCADE;
DROP TABLE IF EXISTS revenue_tracking CASCADE;
DROP TABLE IF EXISTS subscription_analytics CASCADE;
DROP TABLE IF EXISTS billing_reports CASCADE;
DROP TABLE IF EXISTS credit_failures CASCADE;
DROP TABLE IF EXISTS credit_usage_analytics CASCADE;
DROP TABLE IF EXISTS payment_history CASCADE;
DROP TABLE IF EXISTS credit_transactions CASCADE;
DROP TABLE IF EXISTS credits_wallet CASCADE;
DROP TABLE IF EXISTS composio_connections CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS connected_accounts CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS oauth_states CASCADE;

-- Drop enums (if exist)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
    DROP TYPE user_plan;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    DROP TYPE subscription_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    DROP TYPE platform_type;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_status') THEN
    DROP TYPE post_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'campaign_status') THEN
    DROP TYPE campaign_status;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversation_source') THEN
    DROP TYPE conversation_source;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_role') THEN
    DROP TYPE message_role;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_tx_type') THEN
    DROP TYPE credit_tx_type;
  END IF;
END $$;

-- =====================================================
-- RECREATE EVERYTHING
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enum types
CREATE TYPE user_plan AS ENUM ('growth', 'scale', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'cancelled', 'past_due');
CREATE TYPE platform_type AS ENUM ('twitter', 'reddit');
CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE conversation_source AS ENUM ('web', 'whatsapp');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE credit_tx_type AS ENUM ('earn','spend','purchase','refund','adjust');

-- =========================
-- Core application tables
-- =========================

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
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Connected accounts table
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

-- Conversations & messages (chat)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source conversation_source DEFAULT 'web',
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Analytics (platform-level)
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

-- Auto campaigns
CREATE TABLE auto_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'inactive',
    platforms TEXT[] DEFAULT '{}',
    style TEXT,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content variants
CREATE TABLE content_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    variant TEXT NOT NULL,
    score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent states
CREATE TABLE agent_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    task JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    feedback JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics daily summary
CREATE TABLE analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    posts_count INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics insights
CREATE TABLE analytics_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
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

-- =========================
-- Credit system & payments
-- =========================

-- credits_wallet table: integer credits (1 credit = $0.10)
CREATE TABLE credits_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0,
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- credit_transactions: audit log for earnings/spends/purchases
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_type credit_tx_type NOT NULL,
  credits INTEGER NOT NULL,
  description TEXT,
  reference_id UUID,
  operation_category TEXT,   -- e.g., 'CONTENT_GENERATION', 'CAMPAIGN_CREATION'
  operation_ref UUID,        -- links to specific operation records
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- payment_history: external payment records for top-ups
CREATE TABLE payment_history (
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
CREATE TABLE credit_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_credits_spent INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  operation_breakdown JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- credit_failures: log failed operations due to insufficient credits
CREATE TABLE credit_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation_category TEXT NOT NULL,
  credits_required INTEGER NOT NULL,
  credits_available INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- billing_reports: automated monthly billing and analytics reports
CREATE TABLE billing_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_credits_spent INTEGER NOT NULL DEFAULT 0,
  total_credits_purchased INTEGER NOT NULL DEFAULT 0,
  total_credits_refunded INTEGER NOT NULL DEFAULT 0,
  total_credits_earned INTEGER NOT NULL DEFAULT 0,
  net_balance_change INTEGER NOT NULL DEFAULT 0,
  report_type TEXT NOT NULL CHECK (report_type IN ('user', 'admin')),
  report_json JSONB DEFAULT '{}',
  email_sent BOOLEAN DEFAULT false,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, period_start, report_type)
);

-- =========================
-- Subscription & revenue analytics
-- =========================

-- revenue_tracking: daily aggregated revenue (credits + subscriptions)
CREATE TABLE revenue_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  credits_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,      -- $ value
  subscription_revenue NUMERIC(12,2) NOT NULL DEFAULT 0, -- $ value
  total_revenue NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date)
);

-- subscription_analytics: metrics per plan per day
CREATE TABLE subscription_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  plan TEXT NOT NULL,
  subscribers_count INTEGER NOT NULL DEFAULT 0,
  new_subscriptions INTEGER NOT NULL DEFAULT 0,
  cancelled_subscriptions INTEGER NOT NULL DEFAULT 0,
  mrr NUMERIC(12,2) NOT NULL DEFAULT 0,
  arr NUMERIC(12,2) NOT NULL DEFAULT 0,
  churn_rate DECIMAL(5,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, plan)
);

-- financial_insights: AI-summarized insights and alerts
CREATE TABLE financial_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL,  -- 'growth', 'risk', 'opportunity', etc.
  severity TEXT NOT NULL DEFAULT 'info', -- 'info','warning','critical'
  summary TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  related_user UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID
);

-- =========================
-- INDEXES
-- =========================
CREATE INDEX idx_connected_accounts_user_id ON connected_accounts(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_campaign_id ON posts(campaign_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_analytics_post_id ON analytics(post_id);
CREATE INDEX idx_auto_campaigns_user_id ON auto_campaigns(user_id);
CREATE INDEX idx_content_variants_user_id ON content_variants(user_id);
CREATE INDEX idx_agent_states_agent_id ON agent_states(agent_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_feedback_task_id ON feedback(task_id);
CREATE INDEX idx_analytics_daily_summary_user_id ON analytics_daily_summary(user_id);
CREATE INDEX idx_analytics_insights_user_id ON analytics_insights(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_credits_wallet_user_id ON credits_wallet(user_id);
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_operation_category ON credit_transactions(operation_category);
CREATE INDEX idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX idx_credit_usage_analytics_user_id ON credit_usage_analytics(user_id);
CREATE INDEX idx_credit_usage_analytics_date ON credit_usage_analytics(date);
CREATE INDEX idx_credit_failures_user_id ON credit_failures(user_id);
CREATE INDEX idx_billing_reports_user_id ON billing_reports(user_id);
CREATE INDEX idx_billing_reports_period ON billing_reports(period_start, period_end);
CREATE INDEX idx_revenue_tracking_date ON revenue_tracking(date);
CREATE INDEX idx_subscription_analytics_date_plan ON subscription_analytics(date, plan);

-- =========================
-- TRIGGERS & FUNCTIONS
-- =========================

-- updated_at trigger function (used across many tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_connected_accounts_updated_at BEFORE UPDATE ON connected_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_auto_campaigns_updated_at BEFORE UPDATE ON auto_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_composio_connections_updated_at BEFORE UPDATE ON composio_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credits_wallet_updated_at BEFORE UPDATE ON credits_wallet FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_history_updated_at BEFORE UPDATE ON payment_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_credit_usage_analytics_updated_at BEFORE UPDATE ON credit_usage_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_revenue_tracking_updated_at BEFORE UPDATE ON revenue_tracking FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_analytics_updated_at BEFORE UPDATE ON subscription_analytics FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: cleanup expired oauth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: update credit analytics when a credit transaction is inserted
CREATE OR REPLACE FUNCTION update_credit_analytics()
RETURNS TRIGGER AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  credit_change INTEGER := 0;
  op_key TEXT := 'unknown';
BEGIN
  -- ensure NEW exists
  IF NEW IS NULL THEN
    RETURN NULL;
  END IF;

  -- Calculate credit change depending on tx_type
  IF NEW.tx_type = 'spend' THEN
    credit_change := NEW.credits;
    op_key := COALESCE(NEW.operation_category, 'unknown');
    -- spent
    INSERT INTO credit_usage_analytics (user_id, date, total_credits_spent, credits_purchased, operation_breakdown, created_at, updated_at)
    VALUES (NEW.user_id, today_date, credit_change, 0, jsonb_build_object(op_key, credit_change), NOW(), NOW())
    ON CONFLICT (user_id, date) DO UPDATE SET
      total_credits_spent = credit_usage_analytics.total_credits_spent + EXCLUDED.total_credits_spent,
      operation_breakdown = jsonb_set(
        COALESCE(credit_usage_analytics.operation_breakdown, '{}'),
        ARRAY[op_key],
        to_jsonb(COALESCE((credit_usage_analytics.operation_breakdown ->> op_key)::integer, 0) + EXCLUDED.total_credits_spent)
      ),
      updated_at = NOW();
  ELSIF NEW.tx_type = 'purchase' THEN
    credit_change := NEW.credits;
    op_key := COALESCE(NEW.operation_category, 'purchase');
    INSERT INTO credit_usage_analytics (user_id, date, total_credits_spent, credits_purchased, operation_breakdown, created_at, updated_at)
    VALUES (NEW.user_id, today_date, 0, credit_change, jsonb_build_object(op_key, credit_change), NOW(), NOW())
    ON CONFLICT (user_id, date) DO UPDATE SET
      credits_purchased = credit_usage_analytics.credits_purchased + EXCLUDED.credits_purchased,
      operation_breakdown = jsonb_set(
        COALESCE(credit_usage_analytics.operation_breakdown, '{}'),
        ARRAY[op_key],
        to_jsonb(COALESCE((credit_usage_analytics.operation_breakdown ->> op_key)::integer, 0) + EXCLUDED.credits_purchased)
      ),
      updated_at = NOW();
  ELSE
    -- for earn/refund/adjust: record as appropriate if you want; currently skip
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that calls update_credit_analytics after insert on credit_transactions
CREATE TRIGGER trigger_update_credit_analytics
  AFTER INSERT ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION update_credit_analytics();

-- Function: update revenue_tracking when a payment_history record is completed
CREATE OR REPLACE FUNCTION update_revenue_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  payment_date DATE := CAST(NOW() AT TIME ZONE 'UTC' AS DATE);
  credit_rev NUMERIC := 0;
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.status = 'completed' THEN
      credit_rev := (COALESCE(NEW.credits_issued, 0) * 0.10); -- $0.10 per credit
      INSERT INTO revenue_tracking (date, credits_revenue, subscription_revenue, total_revenue, created_at, updated_at)
      VALUES (payment_date, credit_rev, 0, credit_rev, NOW(), NOW())
      ON CONFLICT (date) DO UPDATE SET
        credits_revenue = revenue_tracking.credits_revenue + EXCLUDED.credits_revenue,
        total_revenue = revenue_tracking.total_revenue + EXCLUDED.total_revenue,
        updated_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_revenue_on_payment
  AFTER INSERT OR UPDATE ON payment_history
  FOR EACH ROW EXECUTE FUNCTION update_revenue_on_payment();

-- Function: update subscription_analytics when subscriptions change (INSERT/UPDATE/DELETE)
CREATE OR REPLACE FUNCTION update_subscriptions_analytics()
RETURNS TRIGGER AS $$
DECLARE
  day DATE := CAST(NOW() AT TIME ZONE 'UTC' AS DATE);
  plan_name TEXT;
  mrr_amount NUMERIC := 0;
BEGIN
  IF TG_OP = 'INSERT' THEN
    plan_name := NEW.plan;
    -- assume amount is monthly price in NEW.amount
    mrr_amount := COALESCE(NEW.amount::NUMERIC, 0);
    INSERT INTO subscription_analytics (date, plan, subscribers_count, new_subscriptions, cancelled_subscriptions, mrr, arr, churn_rate, created_at, updated_at)
    VALUES (day, plan_name, 1, 1, 0, mrr_amount, mrr_amount * 12, 0, NOW(), NOW())
    ON CONFLICT (date, plan) DO UPDATE SET
      subscribers_count = subscription_analytics.subscribers_count + 1,
      new_subscriptions = subscription_analytics.new_subscriptions + 1,
      mrr = subscription_analytics.mrr + EXCLUDED.mrr,
      arr = (subscription_analytics.mrr + EXCLUDED.mrr) * 12,
      updated_at = NOW();
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- handle status changes (active -> cancelled or vice versa)
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      plan_name := NEW.plan;
      IF NEW.status = 'active' AND OLD.status <> 'active' THEN
        -- a reactivation/new active
        mrr_amount := COALESCE(NEW.amount::NUMERIC, 0);
        INSERT INTO subscription_analytics (date, plan, subscribers_count, new_subscriptions, cancelled_subscriptions, mrr, arr, churn_rate, created_at, updated_at)
        VALUES (day, plan_name, 1, 1, 0, mrr_amount, mrr_amount * 12, 0, NOW(), NOW())
        ON CONFLICT (date, plan) DO UPDATE SET
          subscribers_count = subscription_analytics.subscribers_count + 1,
          new_subscriptions = subscription_analytics.new_subscriptions + 1,
          mrr = subscription_analytics.mrr + EXCLUDED.mrr,
          arr = (subscription_analytics.mrr + EXCLUDED.mrr) * 12,
          updated_at = NOW();
      ELSIF NEW.status <> 'active' AND OLD.status = 'active' THEN
        -- cancellation
        mrr_amount := COALESCE(OLD.amount::NUMERIC, 0);
        INSERT INTO subscription_analytics (date, plan, subscribers_count, new_subscriptions, cancelled_subscriptions, mrr, arr, churn_rate, created_at, updated_at)
        VALUES (day, plan_name, -1, 0, 1, -mrr_amount, -mrr_amount * 12, 0, NOW(), NOW())
        ON CONFLICT (date, plan) DO UPDATE SET
          subscribers_count = subscription_analytics.subscribers_count - 1,
          cancelled_subscriptions = subscription_analytics.cancelled_subscriptions + 1,
          mrr = subscription_analytics.mrr + EXCLUDED.mrr,
          arr = (subscription_analytics.mrr + EXCLUDED.mrr) * 12,
          updated_at = NOW();
      END IF;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- a subscription deleted: treat as cancellation for analytics
    plan_name := OLD.plan;
    mrr_amount := COALESCE(OLD.amount::NUMERIC, 0);
    INSERT INTO subscription_analytics (date, plan, subscribers_count, new_subscriptions, cancelled_subscriptions, mrr, arr, churn_rate, created_at, updated_at)
    VALUES (day, plan_name, -1, 0, 1, -mrr_amount, -mrr_amount*12, 0, NOW(), NOW())
    ON CONFLICT (date, plan) DO UPDATE SET
      subscribers_count = subscription_analytics.subscribers_count - 1,
      cancelled_subscriptions = subscription_analytics.cancelled_subscriptions + 1,
      mrr = subscription_analytics.mrr + EXCLUDED.mrr,
      arr = (subscription_analytics.mrr + EXCLUDED.mrr) * 12,
      updated_at = NOW();
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_analytics
  AFTER INSERT OR UPDATE OR DELETE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_subscriptions_analytics();

-- =========================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- =========================

-- Enable RLS on tables that hold user data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE composio_connections ENABLE ROW LEVEL SECURITY;

ALTER TABLE credits_wallet ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_insights ENABLE ROW LEVEL SECURITY;

-- Policies for users and basic objects
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own connected accounts" ON connected_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connected accounts" ON connected_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connected accounts" ON connected_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connected accounts" ON connected_accounts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations WHERE id = messages.conversation_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own posts" ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own auto campaigns" ON auto_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own auto campaigns" ON auto_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto campaigns" ON auto_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own auto campaigns" ON auto_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content variants" ON content_variants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content variants" ON content_variants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content variants" ON content_variants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content variants" ON content_variants FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view analytics for own posts" ON analytics FOR SELECT USING (
    EXISTS (SELECT 1 FROM posts WHERE id = analytics.post_id AND user_id = auth.uid())
);

CREATE POLICY "Users can view own analytics daily summary" ON analytics_daily_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics daily summary" ON analytics_daily_summary FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics insights" ON analytics_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics insights" ON analytics_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

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

-- Credit system policies
CREATE POLICY "Users can view own wallet" ON credits_wallet FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON credits_wallet FOR INSERT WITH CHECK (auth.uid() = user_id);
-- wallet updates should be performed by service role (server) using service key

CREATE POLICY "Users can view own credit transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credit transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- inserts are allowed, but sensitive operations (spend/deduct) should be validated server-side.

CREATE POLICY "Users can view own payments" ON payment_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment histories" ON payment_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payment histories" ON payment_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credit analytics" ON credit_usage_analytics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own credit failures" ON credit_failures FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own billing reports" ON billing_reports FOR SELECT USING (auth.uid() = user_id);

-- Admin policies (selective)
CREATE POLICY "Admins can view all billing reports" ON billing_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can view revenue_tracking" ON revenue_tracking FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can view subscription_analytics" ON subscription_analytics FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

CREATE POLICY "Admins can view financial_insights" ON financial_insights FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = TRUE)
);

-- =========================
-- SAFE BACKFILL / INITIAL DATA
-- =========================

-- Create wallets for existing users and give welcome 100 credits if they lack a wallet
DO $$
BEGIN
  -- create missing wallets
  INSERT INTO credits_wallet (user_id, balance, total_purchased, total_spent, created_at, updated_at)
  SELECT u.id, 100, 0, 0, NOW(), NOW()
  FROM users u
  LEFT JOIN credits_wallet w ON w.user_id = u.id
  WHERE w.user_id IS NULL;

  -- create matching welcome transactions only if not already present
  INSERT INTO credit_transactions (user_id, tx_type, credits, description, created_at)
  SELECT u.id, 'earn', 100, 'Welcome bonus: $10 free credits', NOW()
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM credit_transactions t
    WHERE t.user_id = u.id AND t.tx_type = 'earn' AND t.description ILIKE '%Welcome bonus%'
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF FILE
-- =====================================================

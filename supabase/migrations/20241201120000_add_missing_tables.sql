-- Add missing tables to Nexa schema
-- This migration adds tables that were referenced in the codebase but missing from the initial schema

-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tables
CREATE TABLE IF NOT EXISTS auto_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'inactive',
    platforms TEXT[] DEFAULT '{}',
    style TEXT,
    next_run TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_content TEXT NOT NULL,
    variant TEXT NOT NULL,
    score NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    state JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id TEXT NOT NULL,
    task JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    feedback JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_daily_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    posts_count INTEGER DEFAULT 0,
    total_engagement INTEGER DEFAULT 0,
    insights JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_auto_campaigns_user_id ON auto_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_content_variants_user_id ON content_variants(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_states_agent_id ON agent_states(agent_id);
CREATE INDEX IF NOT EXISTS idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX IF NOT EXISTS idx_feedback_task_id ON feedback(task_id);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_user_id ON analytics_daily_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_insights_user_id ON analytics_insights(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Trigger function for updated_at
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        EXECUTE '
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $func$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;
        ';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto_campaigns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE event_object_table='auto_campaigns' AND trigger_name='update_auto_campaigns_updated_at'
    ) THEN
        EXECUTE '
            CREATE TRIGGER update_auto_campaigns_updated_at
            BEFORE UPDATE ON auto_campaigns
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        ';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE auto_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: drop if exist, then recreate
-- Auto campaigns
DROP POLICY IF EXISTS "Users can view own auto campaigns" ON auto_campaigns;
CREATE POLICY "Users can view own auto campaigns" ON auto_campaigns FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own auto campaigns" ON auto_campaigns;
CREATE POLICY "Users can insert own auto campaigns" ON auto_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own auto campaigns" ON auto_campaigns;
CREATE POLICY "Users can update own auto campaigns" ON auto_campaigns FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own auto campaigns" ON auto_campaigns;
CREATE POLICY "Users can delete own auto campaigns" ON auto_campaigns FOR DELETE USING (auth.uid() = user_id);

-- Content variants
DROP POLICY IF EXISTS "Users can view own content variants" ON content_variants;
CREATE POLICY "Users can view own content variants" ON content_variants FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own content variants" ON content_variants;
CREATE POLICY "Users can insert own content variants" ON content_variants FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own content variants" ON content_variants;
CREATE POLICY "Users can update own content variants" ON content_variants FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own content variants" ON content_variants;
CREATE POLICY "Users can delete own content variants" ON content_variants FOR DELETE USING (auth.uid() = user_id);

-- Analytics daily summary
DROP POLICY IF EXISTS "Users can view own analytics daily summary" ON analytics_daily_summary;
CREATE POLICY "Users can view own analytics daily summary" ON analytics_daily_summary FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics daily summary" ON analytics_daily_summary;
CREATE POLICY "Users can insert own analytics daily summary" ON analytics_daily_summary FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Analytics insights
DROP POLICY IF EXISTS "Users can view own analytics insights" ON analytics_insights;
CREATE POLICY "Users can view own analytics insights" ON analytics_insights FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analytics insights" ON analytics_insights;
CREATE POLICY "Users can insert own analytics insights" ON analytics_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

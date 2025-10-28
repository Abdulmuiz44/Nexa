-- Add missing tables to Nexa schema
-- This migration adds tables that were referenced in the codebase but missing from the initial schema

-- Enable extensions if not already
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Indexes
CREATE INDEX idx_auto_campaigns_user_id ON auto_campaigns(user_id);
CREATE INDEX idx_content_variants_user_id ON content_variants(user_id);
CREATE INDEX idx_agent_states_agent_id ON agent_states(agent_id);
CREATE INDEX idx_tasks_agent_id ON tasks(agent_id);
CREATE INDEX idx_feedback_task_id ON feedback(task_id);
CREATE INDEX idx_analytics_daily_summary_user_id ON analytics_daily_summary(user_id);
CREATE INDEX idx_analytics_insights_user_id ON analytics_insights(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Triggers
CREATE TRIGGER update_auto_campaigns_updated_at BEFORE UPDATE ON auto_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE auto_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own auto campaigns" ON auto_campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own auto campaigns" ON auto_campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own auto campaigns" ON auto_campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own auto campaigns" ON auto_campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own content variants" ON content_variants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own content variants" ON content_variants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own content variants" ON content_variants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own content variants" ON content_variants FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics daily summary" ON analytics_daily_summary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics daily summary" ON analytics_daily_summary FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analytics insights" ON analytics_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analytics insights" ON analytics_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

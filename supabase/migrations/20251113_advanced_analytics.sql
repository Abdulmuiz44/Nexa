-- Advanced Analytics Features Migration
-- Adds tables and features for predictive insights, competitor analysis, and automated recommendations

-- Safely clean up any existing objects (ignore errors if they don't exist)
DO $$
BEGIN
    -- Drop policies (only if tables exist)
    BEGIN
        DROP POLICY IF EXISTS "Users can access social posts from their repurposed content" ON repurposed_social_posts;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can only access their own repurposed content" ON repurposed_content;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can access variants of their A/B tests" ON ab_test_variants;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can only access their own A/B tests" ON ab_tests;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can only access their own notifications" ON notifications;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can only access their own recommendations" ON recommendations;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP POLICY IF EXISTS "Users can only access their own competitor tracking" ON competitor_tracking;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    -- Drop triggers (only if tables exist)
    BEGIN
        DROP TRIGGER IF EXISTS update_repurposed_content_updated_at ON repurposed_content;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP TRIGGER IF EXISTS update_ab_tests_updated_at ON ab_tests;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;

    BEGIN
        DROP TRIGGER IF EXISTS update_competitor_tracking_updated_at ON competitor_tracking;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
END $$;

-- Drop tables (these will succeed even if tables don't exist)
DROP TABLE IF EXISTS repurposed_social_posts;
DROP TABLE IF EXISTS repurposed_content;
DROP TABLE IF EXISTS ab_test_variants;
DROP TABLE IF EXISTS ab_tests;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS competitor_tracking;

-- Create function to update updated_at timestamp (create it first)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create competitor tracking table
CREATE TABLE competitor_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    handle TEXT NOT NULL,
    platform TEXT NOT NULL,
    name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, handle, platform)
);

-- Create recommendations table
CREATE TABLE recommendations (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    expected_impact TEXT NOT NULL,
    time_to_implement TEXT NOT NULL,
    confidence INTEGER NOT NULL,
    implemented BOOLEAN DEFAULT FALSE,
    implemented_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, id)
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_text TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, id)
);

-- Create A/B testing tables
CREATE TABLE ab_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    winner_variant_id UUID,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

CREATE TABLE ab_test_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES ab_tests(id) ON DELETE CASCADE,
    variant_name TEXT NOT NULL,
    content TEXT NOT NULL,
    headline TEXT,
    impressions INTEGER DEFAULT 0,
    engagements INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(test_id, variant_name)
);

-- Create content repurposing tables
CREATE TABLE repurposed_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    original_url TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    status TEXT NOT NULL DEFAULT 'processing',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, original_url)
);

CREATE TABLE repurposed_social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES repurposed_content(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    hashtags TEXT[] DEFAULT '{}',
    character_count INTEGER DEFAULT 0,
    tone TEXT DEFAULT 'neutral',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(content_id, platform)
);

-- Add CHECK constraints after table creation
ALTER TABLE competitor_tracking ADD CONSTRAINT competitor_tracking_platform_check CHECK (platform IN ('twitter', 'reddit'));
ALTER TABLE recommendations ADD CONSTRAINT recommendations_type_check CHECK (type IN ('content', 'timing', 'strategy', 'optimization'));
ALTER TABLE recommendations ADD CONSTRAINT recommendations_priority_check CHECK (priority IN ('high', 'medium', 'low'));
ALTER TABLE recommendations ADD CONSTRAINT recommendations_confidence_check CHECK (confidence >= 0 AND confidence <= 100);
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN ('approval', 'analytics', 'credits', 'system', 'achievement'));
ALTER TABLE notifications ADD CONSTRAINT notifications_priority_check CHECK (priority IN ('low', 'medium', 'high'));
ALTER TABLE ab_tests ADD CONSTRAINT ab_tests_platform_check CHECK (platform IN ('twitter', 'reddit'));
ALTER TABLE ab_tests ADD CONSTRAINT ab_tests_status_check CHECK (status IN ('draft', 'running', 'completed', 'stopped'));
ALTER TABLE repurposed_content ADD CONSTRAINT repurposed_content_content_type_check CHECK (content_type IN ('blog', 'video', 'article', 'webpage'));
ALTER TABLE repurposed_content ADD CONSTRAINT repurposed_content_status_check CHECK (status IN ('processing', 'completed', 'failed'));
ALTER TABLE repurposed_social_posts ADD CONSTRAINT repurposed_social_posts_platform_check CHECK (platform IN ('twitter', 'reddit', 'linkedin'));

-- Create indexes for better performance
CREATE INDEX idx_competitor_tracking_user_id ON competitor_tracking(user_id);
CREATE INDEX idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX idx_recommendations_implemented ON recommendations(implemented);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_ab_tests_user_id ON ab_tests(user_id);
CREATE INDEX idx_ab_tests_status ON ab_tests(status);
CREATE INDEX idx_ab_test_variants_test_id ON ab_test_variants(test_id);
CREATE INDEX idx_repurposed_content_user_id ON repurposed_content(user_id);
CREATE INDEX idx_repurposed_content_status ON repurposed_content(status);
CREATE INDEX idx_repurposed_social_posts_content_id ON repurposed_social_posts(content_id);

-- Enable Row Level Security
ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_test_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurposed_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE repurposed_social_posts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for competitor_tracking
CREATE POLICY "Users can only access their own competitor tracking"
ON competitor_tracking
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for recommendations
CREATE POLICY "Users can only access their own recommendations"
ON recommendations
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for notifications
CREATE POLICY "Users can only access their own notifications"
ON notifications
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for ab_tests
CREATE POLICY "Users can only access their own A/B tests"
ON ab_tests
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for ab_test_variants
CREATE POLICY "Users can access variants of their A/B tests"
ON ab_test_variants
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM ab_tests
        WHERE ab_tests.id = ab_test_variants.test_id
        AND ab_tests.user_id = auth.uid()
    )
);

-- Create RLS policies for repurposed_content
CREATE POLICY "Users can only access their own repurposed content"
ON repurposed_content
FOR ALL
USING (auth.uid() = user_id);

-- Create RLS policies for repurposed_social_posts
CREATE POLICY "Users can access social posts from their repurposed content"
ON repurposed_social_posts
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM repurposed_content
        WHERE repurposed_content.id = repurposed_social_posts.content_id
        AND repurposed_content.user_id = auth.uid()
    )
);

-- Create triggers for updated_at
CREATE TRIGGER update_competitor_tracking_updated_at
    BEFORE UPDATE ON competitor_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repurposed_content_updated_at
    BEFORE UPDATE ON repurposed_content
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE competitor_tracking IS 'Tracks competitors that users want to monitor for analytics and insights';
COMMENT ON TABLE recommendations IS 'Stores AI-generated recommendations for users to improve their social media strategy';
COMMENT ON TABLE notifications IS 'User notifications for approvals, analytics, credits, and system alerts';
COMMENT ON TABLE ab_tests IS 'A/B testing campaigns for content optimization';
COMMENT ON TABLE ab_test_variants IS 'Different content variants being tested in A/B tests';
COMMENT ON TABLE repurposed_content IS 'Original content that has been repurposed for social media';
COMMENT ON TABLE repurposed_social_posts IS 'Generated social media posts from repurposed content';

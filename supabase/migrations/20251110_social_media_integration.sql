-- =====================================================
-- SOCIAL MEDIA INTEGRATION MIGRATION
-- Adds support for Composio OAuth connections and social media automation
-- Date: 2025-11-10
-- =====================================================

-- This migration ensures all tables needed for the social media integration
-- are properly set up. Run this after nexa_schema.sql

-- =====================================================
-- VERIFY AND ADD MISSING COLUMNS TO COMPOSIO_CONNECTIONS
-- =====================================================

-- Add status column if not exists (to track connection health)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='composio_connections' AND column_name='status'
    ) THEN
        ALTER TABLE composio_connections ADD COLUMN status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add account_username column if not exists (for display purposes)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='composio_connections' AND column_name='account_username'
    ) THEN
        ALTER TABLE composio_connections ADD COLUMN account_username TEXT;
    END IF;
END $$;

-- Add account_id column if not exists (platform-specific account ID)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='composio_connections' AND column_name='account_id'
    ) THEN
        ALTER TABLE composio_connections ADD COLUMN account_id TEXT;
    END IF;
END $$;

-- =====================================================
-- VERIFY USERS.ONBOARDING_DATA FOR AGENT CONFIGURATION
-- =====================================================

-- Ensure onboarding_data JSONB column exists (already in schema, but verify)
-- This stores agent configuration like:
-- {
--   "auto_post_enabled": true,
--   "posting_frequency": "daily",
--   "auto_engage_enabled": true,
--   "auto_like": true,
--   "auto_reply": true,
--   "min_engagement_score": 70,
--   "content_topics": ["AI", "automation"],
--   "target_audience": "tech professionals",
--   "tweet_patterns": { ... }
-- }

-- =====================================================
-- ADD CREDITS COLUMNS TO USERS IF NOT EXISTS
-- =====================================================

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='credits'
    ) THEN
        ALTER TABLE users ADD COLUMN credits INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add credits_used column for tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='credits_used'
    ) THEN
        ALTER TABLE users ADD COLUMN credits_used INTEGER DEFAULT 0;
    END IF;
END $$;

-- =====================================================
-- ADD INDEXES FOR PERFORMANCE
-- =====================================================

-- Index on composio_connections for faster lookups
CREATE INDEX IF NOT EXISTS idx_composio_connections_user_id ON composio_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_composio_connections_toolkit_slug ON composio_connections(toolkit_slug);
CREATE INDEX IF NOT EXISTS idx_composio_connections_status ON composio_connections(status);

-- Index on posts for scheduled posts
CREATE INDEX IF NOT EXISTS idx_posts_scheduled_at ON posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);

-- Index on activity_log for user activity tracking
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at);

-- =====================================================
-- ADD RLS POLICIES FOR SECURITY
-- =====================================================

-- Enable RLS on composio_connections
ALTER TABLE composio_connections ENABLE ROW LEVEL SECURITY;

-- Users can only view their own connections
CREATE POLICY IF NOT EXISTS "Users can view own composio connections"
    ON composio_connections FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY IF NOT EXISTS "Users can insert own composio connections"
    ON composio_connections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY IF NOT EXISTS "Users can update own composio connections"
    ON composio_connections FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY IF NOT EXISTS "Users can delete own composio connections"
    ON composio_connections FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- ADD HELPFUL VIEWS
-- =====================================================

-- View for active connections
CREATE OR REPLACE VIEW active_connections AS
SELECT 
    c.id,
    c.user_id,
    c.composio_connection_id,
    c.toolkit_slug,
    c.account_username,
    c.status,
    c.created_at,
    u.email as user_email,
    u.name as user_name
FROM composio_connections c
JOIN users u ON c.user_id = u.id
WHERE c.status = 'active';

-- View for user social media stats
CREATE OR REPLACE VIEW user_social_stats AS
SELECT 
    u.id as user_id,
    u.email,
    u.name,
    COUNT(DISTINCT c.id) as total_connections,
    COUNT(DISTINCT CASE WHEN c.toolkit_slug = 'twitter' THEN c.id END) as twitter_connections,
    COUNT(DISTINCT CASE WHEN c.toolkit_slug = 'reddit' THEN c.id END) as reddit_connections,
    COUNT(DISTINCT p.id) as total_posts,
    COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) as published_posts,
    COUNT(DISTINCT CASE WHEN p.status = 'scheduled' THEN p.id END) as scheduled_posts,
    u.credits,
    u.credits_used
FROM users u
LEFT JOIN composio_connections c ON u.id = c.user_id
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.email, u.name, u.credits, u.credits_used;

-- =====================================================
-- ADD TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Ensure composio_connections has updated_at trigger
DROP TRIGGER IF EXISTS update_composio_connections_updated_at ON composio_connections;
CREATE TRIGGER update_composio_connections_updated_at
    BEFORE UPDATE ON composio_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ADD FUNCTION TO LOG SOCIAL MEDIA ACTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION log_social_action(
    p_user_id UUID,
    p_action TEXT,
    p_platform TEXT,
    p_description TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO activity_log (user_id, action, description, metadata)
    VALUES (p_user_id, p_action, p_description, p_metadata)
    RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD FUNCTION TO UPDATE USER CREDITS
-- =====================================================

CREATE OR REPLACE FUNCTION deduct_credits(
    p_user_id UUID,
    p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO v_current_credits
    FROM users
    WHERE id = p_user_id
    FOR UPDATE;
    
    -- Check if user has enough credits
    IF v_current_credits < p_amount THEN
        RETURN FALSE;
    END IF;
    
    -- Deduct credits
    UPDATE users
    SET 
        credits = credits - p_amount,
        credits_used = credits_used + p_amount
    WHERE id = p_user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ADD SAMPLE DATA FOR TESTING (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- =====================================================

-- Uncomment below to add sample data for testing

-- INSERT INTO users (email, name, plan, credits, status) 
-- VALUES ('test@example.com', 'Test User', 'growth', 100, 'active')
-- ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, authenticated;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify migration)
-- =====================================================

-- Check composio_connections table structure
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'composio_connections' 
-- ORDER BY ordinal_position;

-- Check if views were created
-- SELECT table_name FROM information_schema.views 
-- WHERE table_schema = 'public' 
-- AND table_name IN ('active_connections', 'user_social_stats');

-- Check user credits columns
-- SELECT column_name FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- AND column_name IN ('credits', 'credits_used');

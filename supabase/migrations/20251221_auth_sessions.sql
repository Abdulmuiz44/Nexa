-- Create auth_sessions table for OAuth flow tracking
-- Stores temporary OAuth sessions during the authorization process

CREATE TABLE IF NOT EXISTS auth_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    state TEXT NOT NULL UNIQUE,
    composio_connection_id TEXT,
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes'),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for fast lookups during OAuth callback
CREATE INDEX IF NOT EXISTS idx_auth_sessions_state ON auth_sessions(state);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_status ON auth_sessions(status);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

-- Enable RLS
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own auth sessions" ON auth_sessions 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auth sessions" ON auth_sessions 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auth sessions" ON auth_sessions 
    FOR UPDATE USING (auth.uid() = user_id);

-- Cleanup function for expired sessions (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_auth_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_sessions 
    WHERE expires_at < NOW() 
    AND status = 'pending';
END;
$$ LANGUAGE plpgsql;

-- Add composio_connections table
CREATE TABLE composio_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    composio_connection_id TEXT NOT NULL UNIQUE,
    toolkit_slug TEXT NOT NULL,
    meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add connection_id to posts table
ALTER TABLE posts ADD COLUMN composio_connection_id UUID REFERENCES composio_connections(id);

-- Add updated_at trigger
CREATE TRIGGER update_composio_connections_updated_at BEFORE UPDATE ON composio_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE composio_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own composio connections" ON composio_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own composio connections" ON composio_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own composio connections" ON composio_connections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own composio connections" ON composio_connections FOR DELETE USING (auth.uid() = user_id);

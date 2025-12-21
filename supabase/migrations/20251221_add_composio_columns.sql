-- Add missing columns to composio_connections table
-- These columns are needed for the OAuth flow implementation

ALTER TABLE composio_connections 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

ALTER TABLE composio_connections 
ADD COLUMN IF NOT EXISTS account_username TEXT;

ALTER TABLE composio_connections 
ADD COLUMN IF NOT EXISTS account_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_composio_connections_user_id ON composio_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_composio_connections_toolkit_slug ON composio_connections(toolkit_slug);
CREATE INDEX IF NOT EXISTS idx_composio_connections_status ON composio_connections(status);

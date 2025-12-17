-- Create content_hub table
CREATE TABLE IF NOT EXISTS content_hub (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    raw_content TEXT NOT NULL,
    content_type TEXT CHECK (content_type IN ('tweet', 'thread', 'blog', 'video', 'image', 'other')),
    source_url TEXT,
    tags TEXT[] DEFAULT '{}',
    summary TEXT,
    engagement_potential INTEGER DEFAULT 0,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'processed' CHECK (status IN ('draft', 'processed', 'used')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE content_hub ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own content items
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'content_hub' AND policyname = 'Users can manage their own content hub items'
    ) THEN
        CREATE POLICY "Users can manage their own content hub items" 
        ON content_hub FOR ALL 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Track updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_content_hub_updated_at
    BEFORE UPDATE ON content_hub
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

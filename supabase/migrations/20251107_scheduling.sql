-- Nexa scheduling and tokens schema
-- Creates user_tokens and scheduled_posts tables

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform_type') THEN
    CREATE TYPE platform_type AS ENUM ('twitter', 'reddit');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scheduled_post_status') THEN
    CREATE TYPE scheduled_post_status AS ENUM ('pending','posted','failed');
  END IF;
END $$;

-- user_tokens table
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- scheduled_posts table
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  status scheduled_post_status NOT NULL DEFAULT 'pending',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_platform ON user_tokens(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_user ON scheduled_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_status_time ON scheduled_posts(status, scheduled_at);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_tokens_updated_at ON user_tokens;
CREATE TRIGGER update_user_tokens_updated_at BEFORE UPDATE ON user_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_posts_updated_at ON scheduled_posts;
CREATE TRIGGER update_scheduled_posts_updated_at BEFORE UPDATE ON scheduled_posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_tokens' AND policyname = 'Users can view own tokens'
  ) THEN
    CREATE POLICY "Users can view own tokens" ON user_tokens FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_tokens' AND policyname = 'Users can manage own tokens'
  ) THEN
    CREATE POLICY "Users can manage own tokens" ON user_tokens FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can view own scheduled posts'
  ) THEN
    CREATE POLICY "Users can view own scheduled posts" ON scheduled_posts FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can insert own scheduled posts'
  ) THEN
    CREATE POLICY "Users can insert own scheduled posts" ON scheduled_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can update own scheduled posts'
  ) THEN
    CREATE POLICY "Users can update own scheduled posts" ON scheduled_posts FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'scheduled_posts' AND policyname = 'Users can delete own scheduled posts'
  ) THEN
    CREATE POLICY "Users can delete own scheduled posts" ON scheduled_posts FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
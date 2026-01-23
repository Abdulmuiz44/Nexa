-- Migration: Reply Agent Tables
-- Creates tables for tracking user interests and AI-generated reply queue

-- User interests for tweet discovery
CREATE TABLE IF NOT EXISTS twitter_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  hashtag TEXT,
  account_to_monitor TEXT,
  is_active BOOLEAN DEFAULT true,
  auto_engage_type TEXT DEFAULT 'reply', -- reply, like, retweet
  max_replies_per_hour INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reply queue for AI-generated replies awaiting approval
CREATE TABLE IF NOT EXISTS reply_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id UUID REFERENCES twitter_interests(id) ON DELETE SET NULL,
  source_tweet_id TEXT NOT NULL,
  source_tweet_content TEXT NOT NULL,
  source_author_username TEXT NOT NULL,
  source_author_id TEXT,
  generated_reply TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, posted, failed
  ai_confidence DECIMAL(3,2), -- 0.00 to 1.00
  posted_at TIMESTAMP WITH TIME ZONE,
  posted_reply_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_twitter_interests_user ON twitter_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_twitter_interests_active ON twitter_interests(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_reply_queue_user ON reply_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_reply_queue_status ON reply_queue(user_id, status);
CREATE INDEX IF NOT EXISTS idx_reply_queue_pending ON reply_queue(status) WHERE status = 'pending';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_twitter_interests_updated_at ON twitter_interests;
CREATE TRIGGER update_twitter_interests_updated_at BEFORE UPDATE ON twitter_interests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reply_queue_updated_at ON reply_queue;
CREATE TRIGGER update_reply_queue_updated_at BEFORE UPDATE ON reply_queue
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE twitter_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reply_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for twitter_interests
CREATE POLICY "Users can view own interests" ON twitter_interests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interests" ON twitter_interests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own interests" ON twitter_interests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own interests" ON twitter_interests FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for reply_queue
CREATE POLICY "Users can view own replies" ON reply_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own replies" ON reply_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own replies" ON reply_queue FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own replies" ON reply_queue FOR DELETE USING (auth.uid() = user_id);

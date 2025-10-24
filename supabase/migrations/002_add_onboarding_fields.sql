-- Add onboarding fields to users table
ALTER TABLE users ADD COLUMN onboarding_data JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'onboarding';

-- Create subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL, -- growth, scale, enterprise
    status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, past_due
    stripe_subscription_id TEXT,
    flutterwave_subscription_id TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'USD',
    interval TEXT DEFAULT 'month', -- month, year
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add updated_at trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own subscriptions" ON subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- Create the onboarding table
CREATE TABLE IF NOT EXISTS onboarding (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  company_name TEXT,
  brand_voice TEXT,
  content_pillars TEXT,
  target_audience TEXT,
  twitter TEXT,
  linkedin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Secure the table with Row Level Security
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own onboarding data
CREATE POLICY "Allow users to read their own onboarding data" 
ON onboarding 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to create their own onboarding data
CREATE POLICY "Allow users to create their own onboarding data" 
ON onboarding 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own onboarding data
CREATE POLICY "Allow users to update their own onboarding data" 
ON onboarding 
FOR UPDATE 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

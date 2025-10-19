
-- Create the generated_contents table
CREATE TABLE IF NOT EXISTS generated_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  tool_name TEXT,
  tool_description TEXT,
  website_url TEXT,
  website_context TEXT,
  platform TEXT,
  tone TEXT,
  content_type TEXT,
  generated_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Allow users to read their own generated content"
ON generated_contents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own generated content"
ON generated_contents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

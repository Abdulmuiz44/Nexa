-- 1. First, ensure the role column exists on the users table
-- We use public.users to be explicit
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'new',
  responded_at TIMESTAMPTZ
);

-- 3. Add indexes
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- 4. Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Only admins can view contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_submissions;

-- 6. Re-create policies
-- Only admins can view (checks the public.users.role column we ensured exists above)
CREATE POLICY "Only admins can view contact submissions" ON public.contact_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE public.users.id = auth.uid()
      AND public.users.role = 'admin'
    )
  );

-- Anyone can insert
CREATE POLICY "Anyone can submit contact form" ON public.contact_submissions
  FOR INSERT
  WITH CHECK (true);

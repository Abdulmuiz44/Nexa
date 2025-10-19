-- Allow public insert access to the users table for sign-ups
CREATE POLICY "Allow public insert for new users" 
ON users 
FOR INSERT 
WITH CHECK (true);

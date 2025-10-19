-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';

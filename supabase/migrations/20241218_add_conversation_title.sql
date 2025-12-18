-- Migration to add title column to conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title TEXT;

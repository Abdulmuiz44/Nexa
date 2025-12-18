-- Add 'tool' to message_role enum
ALTER TYPE message_role ADD VALUE IF NOT EXISTS 'tool';

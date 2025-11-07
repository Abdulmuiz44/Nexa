-- Add 'cancelled' to scheduled_post_status enum if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'scheduled_post_status' AND e.enumlabel = 'cancelled'
  ) THEN
    ALTER TYPE scheduled_post_status ADD VALUE 'cancelled';
  END IF;
END $$;
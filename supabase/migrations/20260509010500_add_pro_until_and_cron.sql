-- 1. Add pro_until column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;

-- 2. Create the function to revoke expired Pro status
CREATE OR REPLACE FUNCTION revoke_expired_pro()
RETURNS VOID AS $$
BEGIN
    UPDATE profiles
    SET 
        is_pro = FALSE,
        pro_until = NULL,
        updated_at = NOW()
    WHERE is_pro = TRUE 
      AND pro_until IS NOT NULL 
      AND pro_until <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable pg_cron if it's not already enabled (Supabase local/hosted compatibility)
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- 4. Schedule the cron job to run daily at midnight
-- If the job already exists, this will replace/update it
SELECT cron.schedule(
    'revoke-expired-pro-daily', -- Job name
    '0 0 * * *',               -- Cron schedule: Everyday at 00:00
    $$SELECT revoke_expired_pro()$$
);

-- Enable required extensions for async network requests and scheduling
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Create the cron job to run every day at 3:00 AM
select cron.schedule(
  'cron-revert-coupon-discount', -- name of the cron job
  '0 3 * * *',                   -- schedule: everyday at 3:00 AM
  $$
    select net.http_post(
      -- The URL uses the decrypted 'project_url' from vault and appends the edge function path
      url:= (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cron-revert-coupon-discount',
      -- We pass the anon_key (or service_role key depending on function setup) via the Authorization header
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
      )
    );
  $$
);

-- NOTE: 
-- You must ensure that 'project_url' and 'anon_key' are stored as secrets in Supabase Vault 
-- for this function to be invoked correctly in production.
-- 
-- Example to add secrets to vault (run this in your Supabase dashboard SQL editor):
-- select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
-- select vault.create_secret('<your-anon-key>', 'anon_key');

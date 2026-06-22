-- Add access_until column to subscriptions to track the end of the paid billing period
-- This is set on cancellation so the user retains PRÓ access until the already-paid cycle ends.
alter table subscriptions
    add column if not exists access_until timestamptz null;

-- Cron job: runs daily at 2:00 AM and revokes PRÓ access for profiles whose pro_until has passed.
-- This is the final authority for expiring cancelled subscriptions.
select cron.schedule(
    'expire-pro-access',   -- unique job name
    '0 2 * * *',           -- every day at 02:00 AM UTC
    $$
        update profiles
        set is_pro = false
        where is_pro = true
          and pro_until is not null
          and pro_until < now();
    $$
);

-- NOTE:
-- pg_cron and pg_net extensions must already be enabled (done in a prior migration).
-- This job runs entirely within the database and does not need an Edge Function call.

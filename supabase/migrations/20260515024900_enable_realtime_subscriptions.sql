-- Enable Supabase Realtime for the subscriptions table.
-- Required for the payment-pending page to receive live status updates
-- via postgres_changes without polling.
alter publication supabase_realtime add table subscriptions;

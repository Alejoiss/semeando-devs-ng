BEGIN;

-- Task 1.1: Add a check constraint on subscriptions.status to enforce valid values
ALTER TABLE public.subscriptions
    ADD CONSTRAINT subscriptions_status_check
    CHECK (status = ANY (ARRAY['pending'::text, 'active'::text, 'cancelled'::text, 'payment_failed'::text]));

-- Task 1.2: Create subscription_billing_events audit table
CREATE TABLE public.subscription_billing_events (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    mp_event_id     text NOT NULL UNIQUE,
    topic           text NOT NULL,
    payload         jsonb,
    status          text NOT NULL,
    error_message   text,
    created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscription_billing_events ENABLE ROW LEVEL SECURITY;

-- Only the service role (Edge Functions) may insert or update billing events
CREATE POLICY "service_role_manage_billing_events"
    ON public.subscription_billing_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

COMMIT;

CREATE TABLE public.subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    plan_id uuid NOT NULL REFERENCES public.plans(id),
    coupon_id uuid REFERENCES public.coupons(id),
    mp_preapproval_id text NOT NULL,
    billing_cycle text NOT NULL CHECK (billing_cycle IN ('monthly', 'yearly')),
    transaction_amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
    ON public.subscriptions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to subscriptions"
    ON public.subscriptions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

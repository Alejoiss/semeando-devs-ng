-- Migration: Valores financeiros dos pagamentos em subscription_billing_events
--
-- O webhook passa a gravar os valores do pagamento do Mercado Pago. Eventos anteriores
-- ficam com os campos nulos (não há backfill).

ALTER TABLE public.subscription_billing_events
    ADD COLUMN IF NOT EXISTS mp_payment_id text,
    ADD COLUMN IF NOT EXISTS gross_amount numeric(12, 2),
    ADD COLUMN IF NOT EXISTS net_amount numeric(12, 2),
    ADD COLUMN IF NOT EXISTS fee_amount numeric(12, 2),
    ADD COLUMN IF NOT EXISTS refunded_amount numeric(12, 2),
    ADD COLUMN IF NOT EXISTS paid_at timestamptz;

CREATE INDEX IF NOT EXISTS subscription_billing_events_paid_at_idx
    ON public.subscription_billing_events (paid_at)
    WHERE paid_at IS NOT NULL;

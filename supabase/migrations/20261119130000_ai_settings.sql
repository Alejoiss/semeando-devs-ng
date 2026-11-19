-- Models used by the OpenRouter features become data: an ordered list per feature (first = primary,
-- the rest are fallbacks) plus the e-mails that receive the daily model health alert.

CREATE TABLE IF NOT EXISTS public.ai_model_settings (
    feature text PRIMARY KEY CHECK (feature IN ('evaluate_challenge', 'evaluate_lesson_content')),
    models text[] NOT NULL CHECK (cardinality(models) BETWEEN 1 AND 5),
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.ai_alert_settings (
    id boolean PRIMARY KEY DEFAULT true CHECK (id),
    emails text[] NOT NULL DEFAULT '{}',
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

ALTER TABLE public.ai_model_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alert_settings ENABLE ROW LEVEL SECURITY;

-- Model ids are not secret and the Edge Functions read them with the caller's token.
DROP POLICY IF EXISTS "Authenticated users can read AI model settings" ON public.ai_model_settings;
CREATE POLICY "Authenticated users can read AI model settings"
ON public.ai_model_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can insert AI model settings" ON public.ai_model_settings;
CREATE POLICY "Admins can insert AI model settings"
ON public.ai_model_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update AI model settings" ON public.ai_model_settings;
CREATE POLICY "Admins can update AI model settings"
ON public.ai_model_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can read AI alert settings" ON public.ai_alert_settings;
CREATE POLICY "Admins can read AI alert settings"
ON public.ai_alert_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can insert AI alert settings" ON public.ai_alert_settings;
CREATE POLICY "Admins can insert AI alert settings"
ON public.ai_alert_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "Admins can update AI alert settings" ON public.ai_alert_settings;
CREATE POLICY "Admins can update AI alert settings"
ON public.ai_alert_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed with the models that were hardcoded in the Edge Functions
INSERT INTO public.ai_model_settings (feature, models) VALUES
    ('evaluate_challenge', ARRAY['openai/gpt-5-nano']),
    ('evaluate_lesson_content', ARRAY['inclusionai/ring-2.6-1t'])
ON CONFLICT (feature) DO NOTHING;

INSERT INTO public.ai_alert_settings (id, emails) VALUES (true, '{}')
ON CONFLICT (id) DO NOTHING;

-- Record which model actually answered, so a fallback in use shows up in the data
ALTER TABLE public.ai_usage_logs ADD COLUMN IF NOT EXISTS model text;

-- Daily health check at 12:00 UTC. It needs the service role key in Vault:
--   select vault.create_secret('<service-role-key>', 'service_role_key');
-- ('project_url' is already stored for the other cron jobs.)
SELECT cron.schedule(
    'check-ai-models',
    '0 12 * * *',
    $$
        select net.http_post(
            url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/check-ai-models',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key')
            ),
            body := '{}'::jsonb
        );
    $$
);

-- Migration: Allow admins to read all data needed for the admin dashboard

-- 1. subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. xp_log
DROP POLICY IF EXISTS "Admins can view all xp_log" ON public.xp_log;
CREATE POLICY "Admins can view all xp_log"
ON public.xp_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. ai_usage_logs
DROP POLICY IF EXISTS "Admins can view all ai_usage_logs" ON public.ai_usage_logs;
CREATE POLICY "Admins can view all ai_usage_logs"
ON public.ai_usage_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. seed_log
DROP POLICY IF EXISTS "Admins can view all seed_log" ON public.seed_log;
CREATE POLICY "Admins can view all seed_log"
ON public.seed_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);


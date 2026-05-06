-- Revise RLS for XP tables to allow authenticated users to have their XP managed
-- Even if Edge Functions use service_role, having these policies ensures the role has necessary permissions if needed
-- and allows future client-side updates if the architecture changes.

-- xp_log
DROP POLICY IF EXISTS "Users can insert own xp log." ON public.xp_log;
CREATE POLICY "Users can insert own xp log."
  ON public.xp_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own xp log." ON public.xp_log;
CREATE POLICY "Users can read own xp log."
  ON public.xp_log
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- xp
DROP POLICY IF EXISTS "Users can insert own xp." ON public.xp;
CREATE POLICY "Users can insert own xp."
  ON public.xp
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own xp." ON public.xp;
CREATE POLICY "Users can update own xp."
  ON public.xp
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- xp_month
DROP POLICY IF EXISTS "Users can insert own xp_month." ON public.xp_month;
CREATE POLICY "Users can insert own xp_month."
  ON public.xp_month
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own xp_month." ON public.xp_month;
CREATE POLICY "Users can update own xp_month."
  ON public.xp_month
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- xp_week
DROP POLICY IF EXISTS "Users can insert own xp_week." ON public.xp_week;
CREATE POLICY "Users can insert own xp_week."
  ON public.xp_week
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own xp_week." ON public.xp_week;
CREATE POLICY "Users can update own xp_week."
  ON public.xp_week
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

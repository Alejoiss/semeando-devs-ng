-- Ensure RLS Consistency for XP and User Progress Tables

-- 1. XP Tables
-- XP Total
DROP POLICY IF EXISTS "Users can read their own xp" ON public.xp;
CREATE POLICY "Users can read their own xp" ON public.xp FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own xp" ON public.xp;
CREATE POLICY "Users can insert their own xp" ON public.xp FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own xp" ON public.xp;
CREATE POLICY "Users can update their own xp" ON public.xp FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XP Log
DROP POLICY IF EXISTS "Users can read own xp log" ON public.xp_log;
DROP POLICY IF EXISTS "Users can read own xp log." ON public.xp_log;
CREATE POLICY "Users can read own xp log" ON public.xp_log FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own xp log" ON public.xp_log;
CREATE POLICY "Users can insert own xp log" ON public.xp_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- XP Week
DROP POLICY IF EXISTS "Users can read own xp week" ON public.xp_week;
CREATE POLICY "Users can read own xp week" ON public.xp_week FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own xp week" ON public.xp_week;
CREATE POLICY "Users can insert own xp week" ON public.xp_week FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own xp week" ON public.xp_week;
CREATE POLICY "Users can update own xp week" ON public.xp_week FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- XP Month
DROP POLICY IF EXISTS "Users can read own xp month" ON public.xp_month;
CREATE POLICY "Users can read own xp month" ON public.xp_month FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own xp month" ON public.xp_month;
CREATE POLICY "Users can insert own xp month" ON public.xp_month FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own xp month" ON public.xp_month;
CREATE POLICY "Users can update own xp month" ON public.xp_month FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. User Progress Tables
-- User Quizzes
DROP POLICY IF EXISTS "Users can read own user_quizzes" ON public.user_quizzes;
CREATE POLICY "Users can read own user_quizzes" ON public.user_quizzes FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_quizzes" ON public.user_quizzes;
CREATE POLICY "Users can insert own user_quizzes" ON public.user_quizzes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_quizzes" ON public.user_quizzes;
CREATE POLICY "Users can update own user_quizzes" ON public.user_quizzes FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Lessons
DROP POLICY IF EXISTS "Users can read own user_lessons" ON public.user_lessons;
CREATE POLICY "Users can read own user_lessons" ON public.user_lessons FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own user_lessons" ON public.user_lessons;
CREATE POLICY "Users can insert own user_lessons" ON public.user_lessons FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own user_lessons" ON public.user_lessons;
CREATE POLICY "Users can update own user_lessons" ON public.user_lessons FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Submodules
DROP POLICY IF EXISTS "Users can read their own user_submodules" ON public.user_submodules;
CREATE POLICY "Users can read their own user_submodules" ON public.user_submodules FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own user_submodules" ON public.user_submodules;
CREATE POLICY "Users can insert their own user_submodules" ON public.user_submodules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own user_submodules" ON public.user_submodules;
CREATE POLICY "Users can update their own user_submodules" ON public.user_submodules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- User Modules
DROP POLICY IF EXISTS "Users can read their own user_modules" ON public.user_modules;
CREATE POLICY "Users can read their own user_modules" ON public.user_modules FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own user_modules" ON public.user_modules;
CREATE POLICY "Users can insert their own user_modules" ON public.user_modules FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own user_modules" ON public.user_modules;
CREATE POLICY "Users can update their own user_modules" ON public.user_modules FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

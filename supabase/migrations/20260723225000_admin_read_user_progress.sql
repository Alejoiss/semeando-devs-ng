-- Migration: Allow admins to read all user progress data

-- 1. user_modules
DROP POLICY IF EXISTS "Admins can view all user_modules" ON public.user_modules;
CREATE POLICY "Admins can view all user_modules"
ON public.user_modules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 2. user_submodules
DROP POLICY IF EXISTS "Admins can view all user_submodules" ON public.user_submodules;
CREATE POLICY "Admins can view all user_submodules"
ON public.user_submodules
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3. user_lessons
DROP POLICY IF EXISTS "Admins can view all user_lessons" ON public.user_lessons;
CREATE POLICY "Admins can view all user_lessons"
ON public.user_lessons
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. xp
DROP POLICY IF EXISTS "Admins can view all xp" ON public.xp;
CREATE POLICY "Admins can view all xp"
ON public.xp
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. seed
DROP POLICY IF EXISTS "Admins can view all seed" ON public.seed;
CREATE POLICY "Admins can view all seed"
ON public.seed
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. user_achievements
DROP POLICY IF EXISTS "Admins can view all user_achievements" ON public.user_achievements;
CREATE POLICY "Admins can view all user_achievements"
ON public.user_achievements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Migration: Allow admins to read user_quizzes

DROP POLICY IF EXISTS "Admins can view all user_quizzes" ON public.user_quizzes;
CREATE POLICY "Admins can view all user_quizzes"
ON public.user_quizzes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

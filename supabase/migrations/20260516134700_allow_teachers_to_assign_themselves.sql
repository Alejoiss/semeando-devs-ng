-- Migration: Allow teachers to assign themselves to modules they created
-- Description: Updates teacher_modules RLS to allow self-assignment upon module creation

DROP POLICY IF EXISTS "Teachers can assign themselves to modules they created" ON public.teacher_modules;
CREATE POLICY "Teachers can assign themselves to modules they created"
  ON public.teacher_modules FOR INSERT
  WITH CHECK (
    auth.uid() = teacher_id AND
    EXISTS (
      SELECT 1 FROM public.modules
      WHERE id = module_id AND created_by = auth.uid()
    )
  );

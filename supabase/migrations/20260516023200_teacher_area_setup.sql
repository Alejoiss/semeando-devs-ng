-- 1. Add role to profiles
ALTER TABLE public.profiles
  ADD COLUMN role text NOT NULL DEFAULT 'student'
  CHECK (role IN ('student', 'teacher', 'admin'));

-- 2. Create teacher_modules table
CREATE TABLE IF NOT EXISTS public.teacher_modules (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id   uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id),
  UNIQUE(teacher_id, module_id)
);

-- 3. Add created_by to modules and lessons
ALTER TABLE public.modules
  ADD COLUMN created_by uuid REFERENCES auth.users(id);

ALTER TABLE public.lessons
  ADD COLUMN created_by uuid REFERENCES auth.users(id);

-- 4. Enable RLS for teacher_modules
ALTER TABLE public.teacher_modules ENABLE ROW LEVEL SECURITY;

-- 5. Policies for teacher_modules
DROP POLICY IF EXISTS "Teacher assignments are viewable by everyone" ON public.teacher_modules;
CREATE POLICY "Teacher assignments are viewable by everyone"
  ON public.teacher_modules FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Only admins can manage teacher assignments" ON public.teacher_modules;
CREATE POLICY "Only admins can manage teacher assignments"
  ON public.teacher_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

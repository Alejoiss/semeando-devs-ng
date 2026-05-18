-- Migration: Add module_id to section_content and update RLS policies
-- Timestamp: 20260519000000

-- 1. Alter lesson_id column to be nullable
ALTER TABLE public.section_content ALTER COLUMN lesson_id DROP NOT NULL;

-- 2. Add module_id column referencing modules table with cascade delete
ALTER TABLE public.section_content ADD COLUMN module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE;

-- 3. Update RLS policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage section content" ON public.section_content;
CREATE POLICY "Admins and assigned teachers can manage section content"
  ON public.section_content FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND (
          (lesson_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.lessons
            JOIN public.submodules ON submodules.id = lessons.sub_module_id
            JOIN public.modules ON modules.id = submodules.module_id
            WHERE lessons.id = public.section_content.lesson_id AND (
              modules.created_by = auth.uid() OR
              EXISTS (
                SELECT 1 FROM public.teacher_modules
                WHERE teacher_id = auth.uid() AND module_id = modules.id
              )
            )
          )) OR
          (module_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.modules
            WHERE modules.id = public.section_content.module_id AND (
              modules.created_by = auth.uid() OR
              EXISTS (
                SELECT 1 FROM public.teacher_modules
                WHERE teacher_id = auth.uid() AND module_id = modules.id
              )
            )
          )) OR
          (lesson_id IS NULL AND module_id IS NULL AND question_id IS NOT NULL)
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND (
          (lesson_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.lessons
            JOIN public.submodules ON submodules.id = lessons.sub_module_id
            JOIN public.modules ON modules.id = submodules.module_id
            WHERE lessons.id = lesson_id AND (
              modules.created_by = auth.uid() OR
              EXISTS (
                SELECT 1 FROM public.teacher_modules
                WHERE teacher_id = auth.uid() AND module_id = modules.id
              )
            )
          )) OR
          (module_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.modules
            WHERE modules.id = module_id AND (
              modules.created_by = auth.uid() OR
              EXISTS (
                SELECT 1 FROM public.teacher_modules
                WHERE teacher_id = auth.uid() AND module_id = modules.id
              )
            )
          )) OR
          (lesson_id IS NULL AND module_id IS NULL AND question_id IS NOT NULL)
        ))
      )
    )
  );

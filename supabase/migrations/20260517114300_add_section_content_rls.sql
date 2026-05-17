-- Migration: Add RLS policies for section_content table to allow teachers to manage content

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
          (lesson_id IS NULL AND question_id IS NOT NULL)
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
          (lesson_id IS NULL AND question_id IS NOT NULL)
        ))
      )
    )
  );

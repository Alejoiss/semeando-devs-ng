-- Migration: Add RLS policies for quizzes, questions, and answers table to allow teachers to manage content

-- Quizzes policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage quizzes" ON public.quizzes;
CREATE POLICY "Admins and assigned teachers can manage quizzes"
  ON public.quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.lessons
          JOIN public.submodules ON submodules.id = lessons.sub_module_id
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE lessons.id = public.quizzes.lesson_id AND (
            modules.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = modules.id
            )
          )
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
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
        ))
      )
    )
  );

-- Questions policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage questions" ON public.questions;
CREATE POLICY "Admins and assigned teachers can manage questions"
  ON public.questions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.quizzes
          JOIN public.lessons ON lessons.id = quizzes.lesson_id
          JOIN public.submodules ON submodules.id = lessons.sub_module_id
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE quizzes.id = public.questions.quiz_id AND (
            modules.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = modules.id
            )
          )
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.quizzes
          JOIN public.lessons ON lessons.id = quizzes.lesson_id
          JOIN public.submodules ON submodules.id = lessons.sub_module_id
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE quizzes.id = quiz_id AND (
            modules.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = modules.id
            )
          )
        ))
      )
    )
  );

-- Answers policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage answers" ON public.answers;
CREATE POLICY "Admins and assigned teachers can manage answers"
  ON public.answers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.questions
          JOIN public.quizzes ON quizzes.id = questions.quiz_id
          JOIN public.lessons ON lessons.id = quizzes.lesson_id
          JOIN public.submodules ON submodules.id = lessons.sub_module_id
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE questions.id = public.answers.question_id AND (
            modules.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = modules.id
            )
          )
        ))
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.questions
          JOIN public.quizzes ON quizzes.id = questions.quiz_id
          JOIN public.lessons ON lessons.id = quizzes.lesson_id
          JOIN public.submodules ON submodules.id = lessons.sub_module_id
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE questions.id = question_id AND (
            modules.created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = modules.id
            )
          )
        ))
      )
    )
  );

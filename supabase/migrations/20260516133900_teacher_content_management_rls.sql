-- Migration: Add RLS policies for teacher module management

-- 1. Modules Policies
DROP POLICY IF EXISTS "Users with teacher or admin role can insert modules" ON public.modules;
CREATE POLICY "Users with teacher or admin role can insert modules"
  ON public.modules FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Admins and assigned teachers can update modules" ON public.modules;
CREATE POLICY "Admins and assigned teachers can update modules"
  ON public.modules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND (
          created_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM public.teacher_modules
            WHERE teacher_id = auth.uid() AND module_id = public.modules.id
          )
        ))
      )
    )
  );

DROP POLICY IF EXISTS "Admins and creators can delete modules" ON public.modules;
CREATE POLICY "Admins and creators can delete modules"
  ON public.modules FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND created_by = auth.uid())
      )
    )
  );

-- 2. Submodules Policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage submodules" ON public.submodules;
CREATE POLICY "Admins and assigned teachers can manage submodules"
  ON public.submodules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.modules
          WHERE id = public.submodules.module_id AND (
            created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = public.modules.id
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
          SELECT 1 FROM public.modules
          WHERE id = module_id AND (
            created_by = auth.uid() OR
            EXISTS (
              SELECT 1 FROM public.teacher_modules
              WHERE teacher_id = auth.uid() AND module_id = public.modules.id
            )
          )
        ))
      )
    )
  );

-- 3. Lessons Policies
DROP POLICY IF EXISTS "Admins and assigned teachers can manage lessons" ON public.lessons;
CREATE POLICY "Admins and assigned teachers can manage lessons"
  ON public.lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (
        role = 'admin' OR
        (role = 'teacher' AND EXISTS (
          SELECT 1 FROM public.submodules
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE submodules.id = public.lessons.sub_module_id AND (
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
          SELECT 1 FROM public.submodules
          JOIN public.modules ON modules.id = submodules.module_id
          WHERE submodules.id = sub_module_id AND (
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

-- 4. Storage policies for module-avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('module-avatars', 'module-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Teachers can upload module avatars" ON storage.objects;
CREATE POLICY "Teachers can upload module avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'module-avatars' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Module avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Module avatars are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'module-avatars');

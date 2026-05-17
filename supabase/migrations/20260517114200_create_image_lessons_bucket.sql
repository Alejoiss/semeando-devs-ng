-- Migration: Create image-lessons storage bucket and setup RLS policies

INSERT INTO storage.buckets (id, name, public)
VALUES ('image-lessons', 'image-lessons', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Teachers can upload lesson images" ON storage.objects;
CREATE POLICY "Teachers can upload lesson images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'image-lessons' AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

DROP POLICY IF EXISTS "Lesson images are publicly viewable" ON storage.objects;
CREATE POLICY "Lesson images are publicly viewable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'image-lessons');

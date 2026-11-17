-- Migration: Allow admins to create newsletters from the admin panel

DROP POLICY IF EXISTS "Admins can insert newsletters" ON public.newsletter;
CREATE POLICY "Admins can insert newsletters"
ON public.newsletter
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE INDEX IF NOT EXISTS newsletter_created_at_idx ON public.newsletter (created_at DESC);

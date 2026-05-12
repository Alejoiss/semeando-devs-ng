-- Add in_revision column to modules
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS in_revision BOOLEAN NOT NULL DEFAULT true;

-- Update modules RLS to allow public access
DROP POLICY IF EXISTS "Authenticated users can read modules" ON public.modules;

CREATE POLICY "Enable read access for all users" ON public.modules
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

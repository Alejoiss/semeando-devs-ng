CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    avatar TEXT NOT NULL,
    icon TEXT NOT NULL
);

ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read modules"
    ON public.modules
    FOR SELECT
    TO authenticated
    USING (true);

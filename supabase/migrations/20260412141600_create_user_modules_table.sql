CREATE TABLE IF NOT EXISTS public.user_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ NULL
);

ALTER TABLE public.user_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own user_modules"
    ON public.user_modules
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user_modules"
    ON public.user_modules
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

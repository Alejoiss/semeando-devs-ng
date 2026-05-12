-- Migration to add viewed column to user_newsletter
ALTER TABLE public.user_newsletter ADD COLUMN IF NOT EXISTS viewed BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY "User newsletters are updatable by the user" ON public.user_newsletter
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

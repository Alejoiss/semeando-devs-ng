CREATE TABLE public.user_submodules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    sub_module_id uuid NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    CONSTRAINT user_submodules_pkey PRIMARY KEY (id),
    CONSTRAINT user_submodules_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_submodules_sub_module_id_fkey FOREIGN KEY (sub_module_id) REFERENCES public.submodules(id) ON DELETE CASCADE
);

ALTER TABLE public.user_submodules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own user_submodules" ON public.user_submodules
    AS PERMISSIVE FOR SELECT
    TO public
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own user_submodules" ON public.user_submodules
    AS PERMISSIVE FOR UPDATE
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own user_submodules" ON public.user_submodules
    AS PERMISSIVE FOR INSERT
    TO public
    WITH CHECK (auth.uid() = user_id);

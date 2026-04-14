CREATE TABLE public.lessons (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    sub_module_id uuid NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    type text NOT NULL CHECK (type IN ('LESSON', 'CHALLENGE', 'REVISION')),
    "order" integer NOT NULL DEFAULT 0,
    CONSTRAINT lessons_pkey PRIMARY KEY (id),
    CONSTRAINT lessons_sub_module_id_fkey FOREIGN KEY (sub_module_id) REFERENCES public.submodules(id) ON DELETE CASCADE
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.lessons
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

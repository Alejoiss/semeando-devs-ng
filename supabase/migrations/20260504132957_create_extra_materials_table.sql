CREATE TABLE public.extra_material (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL,
    title text NOT NULL,
    type text NOT NULL CHECK (type IN ('URL', 'FILE')),
    url text,
    file text,
    CONSTRAINT extra_materials_pkey PRIMARY KEY (id),
    CONSTRAINT extra_materials_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE
);

ALTER TABLE public.extra_material ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.extra_material
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

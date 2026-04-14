CREATE TABLE public.section_content (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL,
    type text NOT NULL CHECK (type IN ('TEXT', 'MARKDOWN', 'VIDEO', 'IMAGE')),
    content text,
    file text,
    file_description text,
    "order" integer NOT NULL DEFAULT 0,
    CONSTRAINT section_content_pkey PRIMARY KEY (id),
    CONSTRAINT section_content_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE
);

ALTER TABLE public.section_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.section_content
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

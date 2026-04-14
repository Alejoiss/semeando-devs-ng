CREATE TABLE public.submodules (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    module_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    description text NOT NULL,
    avatar text,
    icon text,
    "order" integer NOT NULL DEFAULT 0,
    CONSTRAINT submodules_pkey PRIMARY KEY (id),
    CONSTRAINT submodules_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE CASCADE
);

ALTER TABLE public.submodules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.submodules
    AS PERMISSIVE FOR SELECT
    TO public
    USING (true);

-- Migration: Trilhas de aprendizado (agrupadores ordenados de cursos)
--
-- Uma trilha reúne cursos em ordem. O mesmo curso pode estar em várias trilhas, e a posição é da relação
-- (track_courses), não do curso. A coluna module_id segue o nome legado da tabela de cursos (modules).
-- Trilhas nascem ocultas (published = false); aluno e visitante só leem as publicadas.

CREATE TABLE IF NOT EXISTS public.tracks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL DEFAULT '',
    icon text,
    "order" integer NOT NULL DEFAULT 0,
    published boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.track_courses (
    track_id uuid NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
    module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
    position integer NOT NULL,
    PRIMARY KEY (track_id, module_id),
    UNIQUE (track_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX IF NOT EXISTS track_courses_module_id_idx ON public.track_courses (module_id);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.track_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read published tracks"
    ON public.tracks FOR SELECT
    TO anon, authenticated
    USING (published);

CREATE POLICY "Admins manage tracks"
    ON public.tracks FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Read courses of published tracks"
    ON public.track_courses FOR SELECT
    TO anon, authenticated
    USING (EXISTS (SELECT 1 FROM public.tracks t WHERE t.id = track_id AND t.published));

CREATE POLICY "Admins manage track courses"
    ON public.track_courses FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

GRANT SELECT ON public.tracks, public.track_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tracks, public.track_courses TO authenticated;

INSERT INTO public.tracks (slug, title, description, icon, "order") VALUES
    ('fundamentos', 'Fundamentos', 'A base de qualquer pessoa desenvolvedora: versionamento, lógica e boas práticas.', 'foundation', 1),
    ('front-end', 'Front-end', 'Do HTML ao framework: construa interfaces modernas, acessíveis e rápidas.', 'web', 2),
    ('backend', 'Backend', 'APIs, regras de negócio, bancos de dados e testes do lado do servidor.', 'dns', 3),
    ('dados', 'Dados', 'Coleta, tratamento e análise de dados para decisões melhores.', 'monitoring', 4),
    ('ia', 'IA', 'Fundamentos e uso prático de inteligência artificial no desenvolvimento.', 'psychology', 5)
ON CONFLICT (slug) DO NOTHING;

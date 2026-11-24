-- Migration: Publicação independente de cada módulo (tabela submodules)
--
-- O curso (modules.in_revision) continua sendo o interruptor mestre. Dentro de um curso visível, só os
-- módulos com published = true liberam conteúdo ao aluno. A estrutura (modules e submodules) segue legível
-- por todos para o catálogo exibir módulos "em breve" apenas com título e descrição. Aulas, quizzes e todo
-- o conteúdo passam a respeitar a publicação, inclusive em acesso direto por link.
-- Administradores e professores do curso seguem lendo tudo pelas políticas de gestão já existentes (FOR ALL).

ALTER TABLE public.submodules ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

UPDATE public.submodules s
SET published = true
FROM public.modules m
WHERE m.id = s.module_id
  AND m.in_revision = false
  AND s.published = false;

CREATE OR REPLACE FUNCTION public.submodule_is_open(p_sub_module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.submodules s
        JOIN public.modules m ON m.id = s.module_id
        WHERE s.id = p_sub_module_id
          AND s.published
          AND m.in_revision = false
    );
$$;

CREATE OR REPLACE FUNCTION public.lesson_is_open(p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.lessons l
        WHERE l.id = p_lesson_id
          AND public.submodule_is_open(l.sub_module_id)
    );
$$;

CREATE OR REPLACE FUNCTION public.question_is_open(p_question_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.questions q
        JOIN public.quizzes z ON z.id = q.quiz_id
        WHERE q.id = p_question_id
          AND public.lesson_is_open(z.lesson_id)
    );
$$;

REVOKE ALL ON FUNCTION public.submodule_is_open(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lesson_is_open(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.question_is_open(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submodule_is_open(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lesson_is_open(uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.question_is_open(uuid) TO anon, authenticated, service_role;

-- lessons
DROP POLICY IF EXISTS "Enable read access for all users" ON public.lessons;
DROP POLICY IF EXISTS "Read lessons of published submodules" ON public.lessons;
CREATE POLICY "Read lessons of published submodules"
    ON public.lessons FOR SELECT
    TO public
    USING (public.submodule_is_open(sub_module_id));

-- quizzes
DROP POLICY IF EXISTS "Enable read access for all users" ON public.quizzes;
DROP POLICY IF EXISTS "Read quizzes of published submodules" ON public.quizzes;
CREATE POLICY "Read quizzes of published submodules"
    ON public.quizzes FOR SELECT
    TO public
    USING (public.lesson_is_open(lesson_id));

-- questions
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
DROP POLICY IF EXISTS "Read questions of published submodules" ON public.questions;
CREATE POLICY "Read questions of published submodules"
    ON public.questions FOR SELECT
    TO authenticated
    USING (public.lesson_is_open((SELECT z.lesson_id FROM public.quizzes z WHERE z.id = quiz_id)));

-- section_content: aulas e perguntas respeitam a publicação; a apresentação do curso (module_id) segue aberta
DROP POLICY IF EXISTS "Authenticated users can read section content" ON public.section_content;
DROP POLICY IF EXISTS "Read section content of published submodules" ON public.section_content;
CREATE POLICY "Read section content of published submodules"
    ON public.section_content FOR SELECT
    TO authenticated
    USING (
        CASE
            WHEN lesson_id IS NOT NULL THEN public.lesson_is_open(lesson_id)
            WHEN question_id IS NOT NULL THEN public.question_is_open(question_id)
            ELSE true
        END
    );

-- extra_material
DROP POLICY IF EXISTS "Authenticated users can read extra materials" ON public.extra_material;
DROP POLICY IF EXISTS "Read extra materials of published submodules" ON public.extra_material;
CREATE POLICY "Read extra materials of published submodules"
    ON public.extra_material FOR SELECT
    TO authenticated
    USING (public.lesson_is_open(lesson_id));

-- Prévia e amostra gratuita: só módulos publicados (substitui as versões que olhavam apenas o curso)
CREATE OR REPLACE FUNCTION public.get_free_lesson_sections(p_lesson_id uuid DEFAULT NULL)
RETURNS TABLE (
    lesson_id uuid,
    id uuid,
    type text,
    content text,
    file text,
    file_description text,
    "order" integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    WITH free_lessons AS (
        SELECT DISTINCT ON (l.sub_module_id) l.id
        FROM public.lessons l
        JOIN public.submodules s ON s.id = l.sub_module_id
        JOIN public.modules m ON m.id = s.module_id
        WHERE l.type = 'LESSON'
          AND s.published
          AND m.in_revision = false
        ORDER BY l.sub_module_id, l."order", l.id
    )
    SELECT sc.lesson_id, sc.id, sc.type, sc.content, sc.file, sc.file_description, sc."order"
    FROM public.section_content sc
    JOIN free_lessons f ON f.id = sc.lesson_id
    WHERE p_lesson_id IS NULL OR sc.lesson_id = p_lesson_id
    ORDER BY sc.lesson_id, sc."order";
$$;

CREATE OR REPLACE FUNCTION public.get_lesson_previews(p_lesson_id uuid DEFAULT NULL)
RETURNS TABLE (lesson_id uuid, preview text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    r record;
    body text;
    cut int;
    max_len int;
    paragraph_end int;
BEGIN
    FOR r IN
        SELECT DISTINCT ON (sc.lesson_id) sc.lesson_id, sc.content
        FROM public.section_content sc
        JOIN public.lessons l ON l.id = sc.lesson_id
        JOIN public.submodules s ON s.id = l.sub_module_id
        JOIN public.modules m ON m.id = s.module_id
        WHERE sc.type = 'MARKDOWN'
          AND sc.content IS NOT NULL
          AND l.type = 'LESSON'
          AND s.published
          AND m.in_revision = false
          AND (p_lesson_id IS NULL OR sc.lesson_id = p_lesson_id)
        ORDER BY sc.lesson_id, sc."order"
    LOOP
        body := regexp_replace(r.content, '^\s*#\s[^\n]*\n?', '');
        max_len := (length(body) * 0.35)::int;

        -- Início do segundo "##", ou seja, o fim da primeira seção
        cut := regexp_instr(body, '\n##\s', 1, 2) - 1;

        IF cut <= 0 OR cut > max_len THEN
            cut := (length(body) * 0.25)::int;
            paragraph_end := strpos(reverse(left(body, cut)), E'\n\n');
            IF paragraph_end > 0 THEN
                cut := cut - paragraph_end;
            END IF;
        END IF;

        preview := btrim(left(body, cut), E' \n\r\t');
        -- Um subtítulo no fim da prévia ficaria sem o conteúdo que ele introduz
        preview := regexp_replace(preview, '(\s*\n#{1,6}\s[^\n]*)+\s*$', '');

        -- Não deixa um bloco de código aberto quando o corte cai dentro dele
        IF (length(preview) - length(replace(preview, '```', ''))) / 3 % 2 = 1 THEN
            preview := preview || E'\n```';
        END IF;

        lesson_id := r.lesson_id;
        RETURN NEXT;
    END LOOP;
END;
$$;

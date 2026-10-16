-- Migration: Prévia pública das aulas
--
-- O conteúdo completo das aulas (section_content) é legível apenas por usuários logados. Esta função expõe,
-- para qualquer visitante, só o trecho inicial de cada aula publicada: até o fim da primeira seção "##",
-- limitado a 35% do texto. Sem subtítulos (ou com uma primeira seção longa demais), corta em ~25%,
-- sempre num fim de parágrafo. O título "# ..." do início é removido, pois a página já o exibe.

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

REVOKE ALL ON FUNCTION public.get_lesson_previews(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_lesson_previews(uuid) TO anon, authenticated, service_role;

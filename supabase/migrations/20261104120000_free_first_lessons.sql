-- Migration: Primeira aula de cada submódulo aberta ao público
--
-- section_content continua legível apenas por usuários logados. Esta função expõe o conteúdo completo
-- somente da primeira aula teórica (type = 'LESSON', menor "order") de cada submódulo de módulos publicados,
-- como amostra gratuita. As demais aulas seguem com a prévia de get_lesson_previews.
-- Mantenha a regra em sincronia com isFree em src/app/services/public-catalog/public-catalog.ts.

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
          AND m.in_revision = false
        ORDER BY l.sub_module_id, l."order", l.id
    )
    SELECT sc.lesson_id, sc.id, sc.type, sc.content, sc.file, sc.file_description, sc."order"
    FROM public.section_content sc
    JOIN free_lessons f ON f.id = sc.lesson_id
    WHERE p_lesson_id IS NULL OR sc.lesson_id = p_lesson_id
    ORDER BY sc.lesson_id, sc."order";
$$;

REVOKE ALL ON FUNCTION public.get_free_lesson_sections(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_free_lesson_sections(uuid) TO anon, authenticated, service_role;

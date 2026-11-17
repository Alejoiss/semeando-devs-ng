-- Migration: Dados de lições concluídas para o relatório de receita do admin
--
-- Retorna as lições concluídas por alunos (role = 'student') no mês informado, no fuso America/Sao_Paulo,
-- agrupadas por módulo e por professor (lessons.created_by), com o mês anterior para comparação.
-- Os valores em dinheiro não vêm daqui: entrada e saída são informadas manualmente na tela.

CREATE OR REPLACE FUNCTION public.admin_revenue_report(p_year integer, p_month integer)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_tz constant text := 'America/Sao_Paulo';
    v_local_start timestamp;
    v_start timestamptz;
    v_end timestamptz;
    v_prev_start timestamptz;
    v_result json;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
    END IF;

    IF p_month NOT BETWEEN 1 AND 12 OR p_year NOT BETWEEN 2000 AND 2100 THEN
        RAISE EXCEPTION 'Período inválido' USING ERRCODE = '22023';
    END IF;

    v_local_start := make_timestamp(p_year, p_month, 1, 0, 0, 0);
    v_start := v_local_start AT TIME ZONE v_tz;
    v_end := (v_local_start + interval '1 month') AT TIME ZONE v_tz;
    v_prev_start := (v_local_start - interval '1 month') AT TIME ZONE v_tz;

    WITH completions AS (
        SELECT
            ul.user_id,
            ul.completed_at,
            l.id AS lesson_id,
            l.title AS lesson_title,
            l.created_by,
            m.id AS module_id,
            m.title AS module_title
        FROM public.user_lessons ul
        JOIN public.profiles pr ON pr.id = ul.user_id AND pr.role = 'student'
        JOIN public.lessons l ON l.id = ul.lesson_id
        JOIN public.submodules s ON s.id = l.sub_module_id
        JOIN public.modules m ON m.id = s.module_id
        WHERE ul.completed
          AND ul.completed_at >= v_prev_start
          AND ul.completed_at < v_end
    ),
    cur AS (
        SELECT * FROM completions WHERE completed_at >= v_start
    ),
    prev AS (
        SELECT * FROM completions WHERE completed_at < v_start
    ),
    by_module AS (
        SELECT module_id, module_title, count(*) AS lessons
        FROM cur
        GROUP BY module_id, module_title
    ),
    by_teacher AS (
        SELECT
            c.created_by AS teacher_id,
            COALESCE(NULLIF(p.name, ''), p.email) AS teacher_name,
            count(*) AS lessons
        FROM cur c
        LEFT JOIN public.profiles p ON p.id = c.created_by
        GROUP BY c.created_by, COALESCE(NULLIF(p.name, ''), p.email)
    ),
    top_lessons AS (
        SELECT lesson_id, lesson_title, module_title, count(*) AS lessons
        FROM cur
        GROUP BY lesson_id, lesson_title, module_title
        ORDER BY count(*) DESC, lesson_title
        LIMIT 5
    )
    SELECT json_build_object(
        'year', p_year,
        'month', p_month,
        'totalLessons', (SELECT count(*) FROM cur),
        'activeStudents', (SELECT count(DISTINCT user_id) FROM cur),
        'previousTotalLessons', (SELECT count(*) FROM prev),
        'previousActiveStudents', (SELECT count(DISTINCT user_id) FROM prev),
        'byModule', COALESCE((
            SELECT json_agg(
                json_build_object('moduleId', module_id, 'title', module_title, 'lessons', lessons)
                ORDER BY lessons DESC, module_title
            ) FROM by_module
        ), '[]'::json),
        'byTeacher', COALESCE((
            SELECT json_agg(
                json_build_object('teacherId', teacher_id, 'name', teacher_name, 'lessons', lessons)
                ORDER BY lessons DESC, teacher_name
            ) FROM by_teacher
        ), '[]'::json),
        'topLessons', COALESCE((
            SELECT json_agg(
                json_build_object(
                    'lessonId', lesson_id,
                    'title', lesson_title,
                    'moduleTitle', module_title,
                    'lessons', lessons
                )
                ORDER BY lessons DESC, lesson_title
            ) FROM top_lessons
        ), '[]'::json)
    ) INTO v_result;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_revenue_report(integer, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revenue_report(integer, integer) TO authenticated;

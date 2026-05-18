-- Migration: Secure Quiz Answers
-- Drop standard public select policy on answers table
DROP POLICY IF EXISTS "Enable read access for all users" ON public.answers;

-- Create secure RPC to fetch safe answer columns (student/general view)
CREATE OR REPLACE FUNCTION public.get_quiz_answers_safe(p_question_id UUID)
RETURNS TABLE (
    id UUID,
    question_id UUID,
    text TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privilege of creator to bypass RLS on answers
AS $$
BEGIN
    RETURN QUERY
    SELECT a.id, a.question_id, a.text
    FROM public.answers a
    WHERE a.question_id = p_question_id;
END;
$$;

-- Create secure RPC to verify correct answer selection upon submission
CREATE OR REPLACE FUNCTION public.verify_quiz_answer(p_answer_id UUID)
RETURNS TABLE (
    is_correct BOOLEAN,
    reason TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privilege of creator to bypass RLS on answers
AS $$
BEGIN
    RETURN QUERY
    SELECT a.is_correct, a.reason
    FROM public.answers a
    WHERE a.id = p_answer_id;
END;
$$;

-- Create secure RPC to retrieve hint text (explanation of correct answer) for a question
CREATE OR REPLACE FUNCTION public.get_quiz_question_hint(p_question_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privilege of creator to bypass RLS on answers
AS $$
DECLARE
    v_reason TEXT;
BEGIN
    SELECT a.reason INTO v_reason
    FROM public.answers a
    WHERE a.question_id = p_question_id AND a.is_correct = true
    LIMIT 1;

    RETURN v_reason;
END;
$$;

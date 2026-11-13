CREATE TABLE public.social_published_questions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    question_id uuid NOT NULL,
    networks text[] NOT NULL DEFAULT '{}',
    post_ref text,
    published_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT social_published_questions_pkey PRIMARY KEY (id),
    CONSTRAINT social_published_questions_question_id_key UNIQUE (question_id),
    CONSTRAINT social_published_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id) ON DELETE CASCADE
);

ALTER TABLE public.social_published_questions ENABLE ROW LEVEL SECURITY;

-- Sem policies: apenas a service role (servidor MCP) acessa a tabela.
REVOKE ALL ON public.social_published_questions FROM anon, authenticated;
GRANT ALL ON public.social_published_questions TO service_role;

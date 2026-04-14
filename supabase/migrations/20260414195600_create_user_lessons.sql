CREATE TABLE public.user_lessons (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    lesson_id uuid NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    CONSTRAINT user_lessons_pkey PRIMARY KEY (id),
    CONSTRAINT user_lessons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT user_lessons_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE
);

ALTER TABLE public.user_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user_lessons" ON public.user_lessons
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own user_lessons" ON public.user_lessons
    AS PERMISSIVE FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_lessons" ON public.user_lessons
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

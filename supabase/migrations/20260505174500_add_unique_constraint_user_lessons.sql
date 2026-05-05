-- Add unique constraint to user_lessons to allow upsert by user_id and lesson_id
ALTER TABLE public.user_lessons
ADD CONSTRAINT user_lessons_user_id_lesson_id_key UNIQUE (user_id, lesson_id);

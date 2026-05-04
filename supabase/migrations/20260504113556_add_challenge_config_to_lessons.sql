ALTER TABLE public.lessons
ADD COLUMN language TEXT DEFAULT 'javascript',
ADD COLUMN initial_code TEXT;

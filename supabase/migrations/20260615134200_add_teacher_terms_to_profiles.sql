-- Add teacher_terms_accepted and teacher_terms_accepted_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_terms_accepted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_terms_accepted_at timestamptz;

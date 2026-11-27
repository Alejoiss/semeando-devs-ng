ALTER TABLE public.user_achievements
ADD COLUMN completed_at timestamptz;

UPDATE public.user_achievements
SET completed_at = created_at
WHERE completed AND completed_at IS NULL;

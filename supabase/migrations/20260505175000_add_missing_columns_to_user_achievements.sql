-- Add missing columns to user_achievements table
ALTER TABLE public.user_achievements
ADD COLUMN completed boolean NOT NULL DEFAULT false,
ADD COLUMN progress integer NOT NULL DEFAULT 0,
ADD COLUMN last_value text;

-- Migration to add viewed column to user_newsletter
ALTER TABLE public.user_newsletter ADD COLUMN IF NOT EXISTS viewed BOOLEAN NOT NULL DEFAULT false;

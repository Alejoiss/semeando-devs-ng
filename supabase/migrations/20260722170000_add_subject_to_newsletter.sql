-- Migration to add subject column to public.newsletter
ALTER TABLE public.newsletter ADD COLUMN IF NOT EXISTS subject text;

-- Migration: Make avatar and icon optional in modules table
ALTER TABLE public.modules
  ALTER COLUMN avatar DROP NOT NULL,
  ALTER COLUMN icon DROP NOT NULL;

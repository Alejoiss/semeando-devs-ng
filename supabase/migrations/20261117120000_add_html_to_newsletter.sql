-- Allows a newsletter to carry a fully designed HTML email; `body` stays as the plain-text version.
ALTER TABLE public.newsletter ADD COLUMN IF NOT EXISTS html text;

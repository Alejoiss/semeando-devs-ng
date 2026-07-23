-- Add name, email, and avatar columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Backfill existing data from auth.users
UPDATE public.profiles p
SET 
  name = u.raw_user_meta_data->>'name',
  avatar = u.raw_user_meta_data->>'avatar',
  email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- Update the trigger function to include these fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_pro, name, email, avatar)
  VALUES (
    new.id, 
    false, 
    new.raw_user_meta_data->>'name',
    new.email,
    new.raw_user_meta_data->>'avatar'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    avatar = EXCLUDED.avatar;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Indexes removed to prevent pg_trgm dependency issues. Add them later if performance requires it.)

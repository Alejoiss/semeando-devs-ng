-- Add terms_accepted and terms_accepted_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

-- Backfill existing users to have accepted terms at their creation date
UPDATE public.profiles
SET terms_accepted = true, terms_accepted_at = updated_at
WHERE terms_accepted = false OR terms_accepted IS NULL;

-- Update the handle_new_user trigger function to populate terms_accepted and terms_accepted_at
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_pro, newsletter_active, terms_accepted, terms_accepted_at)
  VALUES (
    new.id, 
    false, 
    COALESCE((new.raw_user_meta_data->>'newsletter_active')::boolean, false),
    COALESCE((new.raw_user_meta_data->>'terms_accepted')::boolean, false),
    (new.raw_user_meta_data->>'terms_accepted_at')::timestamptz
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

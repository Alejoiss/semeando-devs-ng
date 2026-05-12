CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_pro, newsletter_active)
  VALUES (
    new.id, 
    false, 
    COALESCE((new.raw_user_meta_data->>'newsletter_active')::boolean, false)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

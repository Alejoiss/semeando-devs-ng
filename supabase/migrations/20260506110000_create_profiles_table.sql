-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, is_pro)
  VALUES (new.id, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.profiles (id, is_pro)
SELECT id, false FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Update ranking functions to include is_pro and fix permissions
CREATE OR REPLACE FUNCTION public.get_ranking_overall(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_user_xp int;
  v_current_user_updated_at timestamp without time zone;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP and updated_at
  SELECT total_xp, updated_at INTO v_current_user_xp, v_current_user_updated_at
  FROM public.xp
  WHERE user_id = p_user_id;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp
    WHERE total_xp > v_current_user_xp 
       OR (total_xp = v_current_user_xp AND updated_at < v_current_user_updated_at);
  ELSE
    v_current_user_position := NULL;
    v_current_user_xp := 0;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.total_xp as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      ROW_NUMBER() OVER (ORDER BY x.total_xp DESC, x.updated_at ASC) as position
    FROM public.xp x
    JOIN auth.users u ON x.user_id = u.id
    LEFT JOIN public.profiles p ON p.id = u.id
    ORDER BY x.total_xp DESC, x.updated_at ASC
    LIMIT 50
  )
  SELECT COALESCE(json_agg(row_to_json(ranked_users)), '[]'::json) INTO v_ranking
  FROM ranked_users;

  -- 4. Build result JSON
  v_result := json_build_object(
    'ranking', v_ranking,
    'currentUser', json_build_object(
      'position', v_current_user_position,
      'xp', v_current_user_xp
    )
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ranking_monthly(p_user_id uuid, p_year int, p_month int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_user_xp int;
  v_current_user_updated_at timestamp without time zone;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP and updated_at
  SELECT xp_amount, updated_at INTO v_current_user_xp, v_current_user_updated_at
  FROM public.xp_month
  WHERE user_id = p_user_id AND year = p_year AND month = p_month;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp_month
    WHERE year = p_year AND month = p_month
      AND (xp_amount > v_current_user_xp 
           OR (xp_amount = v_current_user_xp AND updated_at < v_current_user_updated_at));
  ELSE
    v_current_user_position := NULL;
    v_current_user_xp := 0;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_month x
    JOIN auth.users u ON x.user_id = u.id
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE x.year = p_year AND x.month = p_month
    ORDER BY x.xp_amount DESC, x.updated_at ASC
    LIMIT 50
  )
  SELECT COALESCE(json_agg(row_to_json(ranked_users)), '[]'::json) INTO v_ranking
  FROM ranked_users;

  -- 4. Build result JSON
  v_result := json_build_object(
    'ranking', v_ranking,
    'currentUser', json_build_object(
      'position', v_current_user_position,
      'xp', v_current_user_xp
    )
  );

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ranking_weekly(p_user_id uuid, p_year int, p_week int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_user_xp int;
  v_current_user_updated_at timestamp without time zone;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP and updated_at
  SELECT xp_amount, updated_at INTO v_current_user_xp, v_current_user_updated_at
  FROM public.xp_week
  WHERE user_id = p_user_id AND year = p_year AND week = p_week;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp_week
    WHERE year = p_year AND week = p_week
      AND (xp_amount > v_current_user_xp 
           OR (xp_amount = v_current_user_xp AND updated_at < v_current_user_updated_at));
  ELSE
    v_current_user_position := NULL;
    v_current_user_xp := 0;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_week x
    JOIN auth.users u ON x.user_id = u.id
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE x.year = p_year AND x.week = p_week
    ORDER BY x.xp_amount DESC, x.updated_at ASC
    LIMIT 50
  )
  SELECT COALESCE(json_agg(row_to_json(ranked_users)), '[]'::json) INTO v_ranking
  FROM ranked_users;

  -- 4. Build result JSON
  v_result := json_build_object(
    'ranking', v_ranking,
    'currentUser', json_build_object(
      'position', v_current_user_position,
      'xp', v_current_user_xp
    )
  );

  RETURN v_result;
END;
$$;

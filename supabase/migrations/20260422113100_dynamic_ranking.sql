-- 1. Add updated_at to XP tables and setup triggers
ALTER TABLE public.xp ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE public.xp_month ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;
ALTER TABLE public.xp_week ADD COLUMN updated_at timestamp without time zone DEFAULT now() NOT NULL;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_xp_set_updated_at
BEFORE INSERT OR UPDATE ON public.xp
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_xp_month_set_updated_at
BEFORE INSERT OR UPDATE ON public.xp_month
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_xp_week_set_updated_at
BEFORE INSERT OR UPDATE ON public.xp_week
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Update RLS policies for authenticated reads
-- Drop existing owner-only SELECT policies
DROP POLICY IF EXISTS "Users can read own xp." ON public.xp;
DROP POLICY IF EXISTS "Users can read own xp month." ON public.xp_month;
DROP POLICY IF EXISTS "Users can read own xp week." ON public.xp_week;

-- Create new policies allowing any authenticated user to read all rows
CREATE POLICY "Authenticated users can read all xp"
  ON public.xp
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read all xp_month"
  ON public.xp_month
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read all xp_week"
  ON public.xp_week
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Create Postgres RPC functions for ranking
-- get_ranking_overall
CREATE OR REPLACE FUNCTION public.get_ranking_overall(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      x.user_id,
      x.total_xp as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      ROW_NUMBER() OVER (ORDER BY x.total_xp DESC, x.updated_at ASC) as position
    FROM public.xp x
    JOIN auth.users u ON x.user_id = u.id
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

-- get_ranking_monthly
CREATE OR REPLACE FUNCTION public.get_ranking_monthly(p_user_id uuid, p_year int, p_month int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      x.user_id,
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_month x
    JOIN auth.users u ON x.user_id = u.id
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

-- get_ranking_weekly
CREATE OR REPLACE FUNCTION public.get_ranking_weekly(p_user_id uuid, p_year int, p_week int)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
      x.user_id,
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_week x
    JOIN auth.users u ON x.user_id = u.id
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

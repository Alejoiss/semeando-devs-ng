-- Adjusts the ranking functions to only include profiles with role = 'student'

CREATE OR REPLACE FUNCTION public.get_ranking_overall(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_user_xp int;
  v_current_user_updated_at timestamp without time zone;
  v_current_user_role text;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP, updated_at, and role
  SELECT x.total_xp, x.updated_at, COALESCE(p.role, 'student') INTO v_current_user_xp, v_current_user_updated_at, v_current_user_role
  FROM public.xp x
  LEFT JOIN public.profiles p ON p.id = x.user_id
  WHERE x.user_id = p_user_id;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL AND v_current_user_role = 'student' THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp x
    JOIN public.profiles p ON p.id = x.user_id
    WHERE p.role = 'student' AND (
       x.total_xp > v_current_user_xp 
       OR (x.total_xp = v_current_user_xp AND x.updated_at < v_current_user_updated_at)
    );
  ELSE
    v_current_user_position := NULL;
    IF v_current_user_xp IS NULL THEN
        v_current_user_xp := 0;
    END IF;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.total_xp as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      p.role,
      ROW_NUMBER() OVER (ORDER BY x.total_xp DESC, x.updated_at ASC) as position
    FROM public.xp x
    JOIN auth.users u ON x.user_id = u.id
    JOIN public.profiles p ON p.id = u.id
    WHERE p.role = 'student'
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
  v_current_user_role text;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP, updated_at, and role
  SELECT x.xp_amount, x.updated_at, COALESCE(p.role, 'student') INTO v_current_user_xp, v_current_user_updated_at, v_current_user_role
  FROM public.xp_month x
  LEFT JOIN public.profiles p ON p.id = x.user_id
  WHERE x.user_id = p_user_id AND x.year = p_year AND x.month = p_month;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL AND v_current_user_role = 'student' THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp_month x
    JOIN public.profiles p ON p.id = x.user_id
    WHERE x.year = p_year AND x.month = p_month AND p.role = 'student'
      AND (x.xp_amount > v_current_user_xp 
           OR (x.xp_amount = v_current_user_xp AND x.updated_at < v_current_user_updated_at));
  ELSE
    v_current_user_position := NULL;
    IF v_current_user_xp IS NULL THEN
        v_current_user_xp := 0;
    END IF;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      p.role,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_month x
    JOIN auth.users u ON x.user_id = u.id
    JOIN public.profiles p ON p.id = u.id
    WHERE x.year = p_year AND x.month = p_month AND p.role = 'student'
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
  v_current_user_role text;
  v_current_user_position int;
  v_ranking json;
  v_result json;
BEGIN
  -- 1. Get current user's XP, updated_at, and role
  SELECT x.xp_amount, x.updated_at, COALESCE(p.role, 'student') INTO v_current_user_xp, v_current_user_updated_at, v_current_user_role
  FROM public.xp_week x
  LEFT JOIN public.profiles p ON p.id = x.user_id
  WHERE x.user_id = p_user_id AND x.year = p_year AND x.week = p_week;

  -- 2. Calculate current user's position
  IF v_current_user_xp IS NOT NULL AND v_current_user_role = 'student' THEN
    SELECT count(*) + 1 INTO v_current_user_position
    FROM public.xp_week x
    JOIN public.profiles p ON p.id = x.user_id
    WHERE x.year = p_year AND x.week = p_week AND p.role = 'student'
      AND (x.xp_amount > v_current_user_xp 
           OR (x.xp_amount = v_current_user_xp AND x.updated_at < v_current_user_updated_at));
  ELSE
    v_current_user_position := NULL;
    IF v_current_user_xp IS NULL THEN
        v_current_user_xp := 0;
    END IF;
  END IF;

  -- 3. Get top 50 ranking
  WITH ranked_users AS (
    SELECT 
      x.user_id as "userId",
      x.xp_amount as xp,
      u.raw_user_meta_data->>'name' as name,
      u.raw_user_meta_data->>'avatar' as avatar,
      COALESCE(p.is_pro, false) as is_pro,
      p.role,
      ROW_NUMBER() OVER (ORDER BY x.xp_amount DESC, x.updated_at ASC) as position
    FROM public.xp_week x
    JOIN auth.users u ON x.user_id = u.id
    JOIN public.profiles p ON p.id = u.id
    WHERE x.year = p_year AND x.week = p_week AND p.role = 'student'
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

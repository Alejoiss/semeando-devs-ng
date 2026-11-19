CREATE OR REPLACE FUNCTION public.consume_coupon(p_coupon_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    WITH updated AS (
        UPDATE coupons
        SET used_count = COALESCE(used_count, 0) + 1
        WHERE id = p_coupon_id
          AND (usage_limit IS NULL OR COALESCE(used_count, 0) < usage_limit)
        RETURNING 1
    )
    SELECT EXISTS (SELECT 1 FROM updated);
$$;

CREATE OR REPLACE FUNCTION public.release_coupon(p_coupon_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE coupons
    SET used_count = GREATEST(COALESCE(used_count, 0) - 1, 0)
    WHERE id = p_coupon_id;
$$;

REVOKE ALL ON FUNCTION public.consume_coupon(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_coupon(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_coupon(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_coupon(uuid) TO service_role;

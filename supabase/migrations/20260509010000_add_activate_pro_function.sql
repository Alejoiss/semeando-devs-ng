-- Function to handle 100% discount coupon activation atomically
-- Bypasses RLS on coupons table to increment used_count, but strictly validates ownership and limits

CREATE OR REPLACE FUNCTION activate_pro_with_coupon_id(p_coupon_id UUID)
RETURNS VOID AS $$
DECLARE
    v_usage_limit INT;
    v_used_count INT;
    v_duration_months INT;
    v_user_id UUID;
BEGIN
    -- Obter ID do usuário autenticado
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Sessão inválida. Faça login novamente.';
    END IF;

    -- Obter detalhes do cupom e bloquear a linha para atualização atômica
    SELECT usage_limit, used_count, duration_months 
    INTO v_usage_limit, v_used_count, v_duration_months
    FROM coupons
    WHERE id = p_coupon_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cupom não encontrado.';
    END IF;

    -- Verificar limite de uso com COALESCE para evitar erros com nulos
    IF v_usage_limit IS NOT NULL AND COALESCE(v_used_count, 0) >= v_usage_limit THEN
        RAISE EXCEPTION 'Este cupom atingiu o limite máximo de usos.';
    END IF;

    -- Verificar se possui duração
    IF v_duration_months IS NULL THEN
        RAISE EXCEPTION 'O cupom não possui uma duração definida.';
    END IF;

    -- Atualizar o perfil do usuário
    UPDATE profiles
    SET is_pro = TRUE,
        pro_until = (NOW() + (v_duration_months || ' month')::INTERVAL),
        updated_at = NOW()
    WHERE id = v_user_id;

    -- Incrementar o contador de uso do cupom (usando COALESCE para evitar NULL + 1)
    UPDATE coupons
    SET used_count = COALESCE(used_count, 0) + 1
    WHERE id = p_coupon_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

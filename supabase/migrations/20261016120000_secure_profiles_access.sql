-- Migration: Restringe o acesso à tabela profiles
--
-- 1. Leitura: antes qualquer pessoa (inclusive anônimos, com a chave pública do site) lia todos os
--    perfis, incluindo nome e e-mail. Agora cada usuário lê apenas o próprio perfil e admins leem todos.
--    Ranking, cadastro, cron e ativação de Pró usam funções SECURITY DEFINER e edge functions usam
--    service_role, então não dependem destas políticas.
-- 2. Escrita: antes o usuário podia alterar qualquer coluna da própria linha (ex.: role = 'admin',
--    is_pro = true). Agora só pode alterar as colunas que o app de fato atualiza.
-- 3. Os GRANTs ficam explícitos para que qualquer ambiente novo tenha exatamente as mesmas permissões.

-- Checagem de admin fora do RLS de profiles, para a política de admin não consultar a própria tabela (recursão)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = (SELECT auth.uid()) AND role = 'admin'
    );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- Políticas de leitura
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Política de atualização (mantida): o usuário só altera a própria linha
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = id)
    WITH CHECK ((SELECT auth.uid()) = id);

-- Privilégios de tabela e de coluna
REVOKE ALL ON TABLE public.profiles FROM anon, authenticated;

-- SELECT para anon continua concedido porque políticas de outras tabelas consultam profiles em subqueries;
-- sem política para anon, o RLS devolve zero linhas em vez de erro de permissão.
GRANT SELECT ON TABLE public.profiles TO anon, authenticated;

GRANT UPDATE (newsletter_active, teacher_terms_accepted, teacher_terms_accepted_at)
    ON TABLE public.profiles TO authenticated;

GRANT ALL ON TABLE public.profiles TO service_role;

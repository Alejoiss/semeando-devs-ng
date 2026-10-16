-- Migration: Conteúdo das aulas legível apenas por usuários logados
--
-- section_content (teoria das aulas e explicações), questions (enunciados dos quizzes) e extra_material
-- (materiais extras) eram legíveis por qualquer pessoa com a chave pública do site. Agora exigem login.
-- O catálogo público (modules, submodules, lessons e quizzes) continua aberto, pois só expõe a estrutura
-- e os títulos. As respostas dos quizzes (answers) já eram protegidas e são corrigidas no servidor.

-- section_content
DROP POLICY IF EXISTS "Enable read access for all users" ON public.section_content;
DROP POLICY IF EXISTS "Authenticated users can read section content" ON public.section_content;
CREATE POLICY "Authenticated users can read section content"
    ON public.section_content FOR SELECT
    TO authenticated
    USING (true);

-- questions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can read questions" ON public.questions;
CREATE POLICY "Authenticated users can read questions"
    ON public.questions FOR SELECT
    TO authenticated
    USING (true);

-- extra_material
DROP POLICY IF EXISTS "Enable read access for all users" ON public.extra_material;
DROP POLICY IF EXISTS "Authenticated users can read extra materials" ON public.extra_material;
CREATE POLICY "Authenticated users can read extra materials"
    ON public.extra_material FOR SELECT
    TO authenticated
    USING (true);

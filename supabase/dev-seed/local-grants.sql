-- Somente para o banco LOCAL.
-- O Supabase CLI recente cria as tabelas sem INSERT/UPDATE/DELETE para o papel `authenticated`, então as escritas feitas
-- direto pelo app (iniciar lição, salvar progresso, marcar conquista como vista, CRUD do professor) retornam 403.
-- Os GRANTs abaixo liberam apenas as tabelas que o front-end escreve; as políticas de RLS continuam valendo.
-- `profiles` fica de fora de propósito (a migração secure_profiles_access restringe a escrita).
grant insert, update, delete on
  public.answers, public.extra_material, public.lessons, public.modules, public.questions, public.quizzes,
  public.section_content, public.seed_log, public.submodules, public.teacher_modules, public.user_achievements,
  public.user_lessons, public.user_modules, public.user_newsletter, public.user_questions, public.user_quizzes,
  public.user_submodules
to authenticated;
-- Para desfazer: revoke insert, update, delete on <as mesmas tabelas> from authenticated;

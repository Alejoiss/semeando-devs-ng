-- Apaga o estado das contas E2E (progresso, XP, assinaturas, uso de IA) e devolve os perfis ao padrão.
-- O conteúdo do seed (módulos, lições, quizzes) e as contas ficam intactos.
do $$
declare
  e2e_users uuid[];
  t text;
begin
  select coalesce(array_agg(id), '{}') into e2e_users from auth.users where email like '%@e2e.test';
  for t in
    select table_name from information_schema.columns
    where table_schema = 'public' and column_name = 'user_id' and table_name not in ('seed', 'seed_log')
      and table_name in (select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE')
  loop
    execute format('delete from public.%I where user_id = any($1)', t) using e2e_users;
  end loop;
  delete from public.coupons where code like 'E2E%';
  delete from public.modules where title like 'E2E %';
  delete from public.newsletter where subject like 'E2E %';
  delete from auth.users where email like 'e2e-novo-%@e2e.test';
  update public.profiles set teacher_terms_accepted = false, teacher_terms_accepted_at = null where id = any(e2e_users);
  update public.profiles set is_pro = false, pro_until = null, newsletter_active = false where id = any(e2e_users);
end $$;

-- Remove o conteúdo de teste (e, por cascata, submódulos, lições, quizzes, questões e o progresso dos usuários nesses módulos).
begin;
delete from public.modules where id in ('11ba5020-4323-5483-9824-1410497398fa', '381a7121-0664-5437-a734-631e004ae378', 'a0c69d6c-cb8b-556a-b947-f861a5bcfc34');
commit;

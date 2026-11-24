# Servidor MCP do Semeando Devs

Servidor MCP **local (stdio)** que opera o Supabase de produção. Não abre porta nem endpoint: o Claude Code inicia o processo via [.mcp.json](../.mcp.json).

## Segurança

- Sem endpoint público. Só quem tem esta máquina e o arquivo `mcp/.env` consegue usar.
- Usa a service role (ignora RLS): `mcp/.env` está coberto pelo `.gitignore` e é separado do `.env` da raiz, que aponta para o banco local.
- Sem as variáveis, o servidor não inicia. URL remota exige https.
- `MCP_READ_ONLY=1` bloqueia todas as escritas.
- `delete_lesson` exige `confirm_title` igual ao título; toda escrita registra um audit (só ids) no stderr.
- Lições criadas nascem como rascunho (`is_validated = null`) e só aparecem aos alunos após `validate_lesson`.

## Configuração

```bash
cd mcp && npm install
cp .env.example .env   # preencher URL e service role de produção
supabase db push        # cria social_published_questions
```

Para testar sem risco, aponte `MCP_SUPABASE_*` para o Supabase local (`http://127.0.0.1:54321`).

## Tools

| Grupo | Tools |
| --- | --- |
| Quiz nas redes | `get_random_quiz_question`, `mark_question_published`, `unmark_question_published`, `list_published_questions` |
| Navegação | `list_courses`, `list_modules`, `find_module`, `list_lessons`, `get_lesson` |
| Trilhas | `list_tracks`, `create_track`, `update_track`, `delete_track` |
| Estrutura | `create_roadmap`, `create_course`, `update_course`, `delete_course`, `create_module`, `update_module`, `delete_module` |
| Lições | `create_lesson`, `set_lesson_content`, `update_lesson`, `delete_lesson`, `validate_lesson` |
| Partes da lição | `add_section`, `update_section`, `delete_section`, `add_extra_material`, `delete_extra_material`, `add_quiz_question`, `update_quiz_question`, `delete_quiz_question` |

Prompts: `post-quiz-do-dia`, `novo-roadmap`, `detalhar-licao`, `criar-desafio`.

Cursos nascem ocultos (`in_revision = true`); `delete_course` e `delete_module` só atuam em cursos ocultos.

`get_random_quiz_question` só sorteia perguntas de lições validadas, com 4 alternativas e 1 correta, ainda ausentes de `social_published_questions`. A marcação é feita à parte, por `mark_question_published`, depois que o post der certo.

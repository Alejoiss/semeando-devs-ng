import { z } from 'zod';

const user = (text) => ({ messages: [{ role: 'user', content: { type: 'text', text } }] });

export function registerPrompts(server) {
  server.registerPrompt(
    'post-quiz-do-dia',
    {
      title: 'Post de quiz do dia',
      description: 'Sorteia uma pergunta inédita e conduz o post de quiz via skill criar-post-social.',
      argsSchema: { module: z.string().optional().describe("Ex.: python, html (omitido = todos)") },
    },
    ({ module }) =>
      user(
        `Quero o post de quiz do dia do Semeando Devs.\n` +
          `1. Chame get_random_quiz_question${module ? ` com module="${module}"` : ''}.\n` +
          `2. Siga a skill criar-post-social (modalidade Quiz) usando a pergunta, as alternativas, a correta e as justificativas retornadas. Respeite os dois pontos de aprovação (texto e arte).\n` +
          `3. Só depois que o post for agendado/publicado com sucesso, chame mark_question_published com question_id, networks e post_ref. Nunca marque antes.\n` +
          `4. Se eu rejeitar a pergunta, sorteie outra sem marcá-la.`,
      ),
  );

  server.registerPrompt(
    'nova-licao',
    {
      title: 'Criar nova lição',
      description: 'Roteiro para criar uma lição completa e válida em um submódulo.',
      argsSchema: { submodule: z.string().describe('Título do submódulo, ex.: A história do HTML'), topic: z.string().describe('Assunto da lição') },
    },
    ({ submodule, topic }) =>
      user(
        `Crie uma nova lição sobre "${topic}" no submódulo "${submodule}".\n` +
          `1. find_submodule para achar o submódulo e list_lessons para ver as lições existentes (tom, tamanho, ordem). Use get_lesson em uma delas como referência de estilo.\n` +
          `2. Escreva o conteúdo em português, em markdown. Fatos históricos ou datas: sinalize o que for "de memória, confira".\n` +
          `3. Uma LESSON válida exige: >=1 seção, >=1 material extra (link confiável, ex.: MDN) e exatamente 10 perguntas, cada uma com 4 alternativas, 1 correta, e justificativa em todas.\n` +
          `4. Mostre o rascunho completo e espere minha aprovação antes de gravar em produção.\n` +
          `5. Grave com create_lesson (publish=false), revise com get_lesson e rode validate_lesson com dry_run. Só publique (validate_lesson sem dry_run) quando eu confirmar.`,
      ),
  );
}

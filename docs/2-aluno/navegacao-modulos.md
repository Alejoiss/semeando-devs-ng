# Navegação de Módulos (Jornada do Aluno)

## 1. Objetivo do Fluxo
Orientar o aluno autenticado pela sua trilha de aprendizagem. A jornada vai do macro (Módulos/Cursos) para o micro (Lições), mantendo o aluno engajado com indicadores de progresso visuais.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
A navegação é dividida em três níveis de profundidade:

**Nível 1: Dashboard de Módulos (`/app`)**
1. O aluno acessa a página inicial logada.
2. É exibido um painel lateral (*Sidebar*) e o pódio semanal de XP no topo.
3. A tela lista todos os Módulos ativos. Para cada módulo, o sistema calcula o progresso (*Status:* `not-started`, `in-progress` ou `completed`) e a porcentagem.
4. O aluno clica em **Iniciar Módulo** (ou Continuar), registrando o início no banco (`UserModuleService.startModule`).

**Nível 2: Lista de Submódulos (`/app/s/:slug`)**
1. O aluno acessa o módulo específico.
2. A tela lista a Apresentação do Módulo (que pode ser retraída/expandida) e a recompensa (Conquista) por concluí-lo.
3. Exibe a esteira de Submódulos. Os submódulos possuem regras de desbloqueio sequencial (um submódulo só fica disponível se o anterior estiver `completed`).
4. O aluno clica para acessar o submódulo desejado.

**Nível 3: Detalhes do Submódulo / Lista de Lições (`/app/s/:slug/ss/:slugSubmodule`)**
1. Semelhante ao Nível 2, mas focado no micro.
2. Lista sequencialmente todas as Aulas Teóricas, Desafios e Revisões.
3. Mostra o status de conclusão de cada lição (icone de *check*).
4. O aluno clica em uma lição para consumi-la, sendo barrado se houver limitação de vidas/lições diárias (plano gratuito).

## 4. Gatilhos de Marketing e Comunicação
- **Restrição de Plano:** Usuários *Free* podem bater no teto de lições diárias, exibindo o gatilho visual para assinar o plano PRÓ (*Upgrade*).

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "O Módulo 2 está bloqueado (cadeado)".
  - **Solução:** Explicar ao aluno a premissa gamificada de que o conhecimento é linear. Ele precisa terminar 100% das lições do Módulo 1 para desbloquear o Módulo 2.

## 6. Casos de Erro e Tratamento
- Em qualquer das 3 telas, falhas de rede ao comunicar com a API disparam a mensagem de erro padrão: `"Erro ao carregar os módulos/submódulos"`.
- As regras de progressão (cálculo de porcentagem) dependem das lições completadas vinculadas àquele usuário no banco de dados Supabase (`UserLessonService`).

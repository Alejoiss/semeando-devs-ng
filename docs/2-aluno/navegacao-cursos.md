# Navegação de Cursos (Jornada do Aluno)

## 1. Objetivo do Fluxo
Orientar o aluno autenticado pela sua trilha de aprendizagem. A jornada vai do macro (Cursos e Módulos) para o micro (Lições), mantendo o aluno engajado com indicadores de progresso visuais.

## 2. Público-Alvo
Alunos logados na plataforma.

## 3. Passo a Passo (Jornada do Usuário)
A navegação é dividida em três níveis de profundidade:

**Nível 1: Dashboard de Cursos (`/app`)**
1. O aluno acessa a página inicial logada.
2. É exibido um painel lateral (*Sidebar*) e o pódio semanal de XP no topo.
3. A tela lista todos os Cursos ativos. Para cada curso, o sistema calcula o progresso (*Status:* `not-started`, `in-progress` ou `completed`) e a porcentagem.
4. O aluno clica em **Iniciar Curso** (ou Continuar), registrando o início no banco (`UserCourseService.startCourse`).

**Nível 2: Lista de Módulos (`/app/s/:slug`)**
1. O aluno acessa o curso específico.
2. A tela lista a Apresentação do Curso (que pode ser retraída/expandida) e a recompensa (Conquista) por concluí-lo.
3. Exibe a esteira de Módulos. Os módulos possuem regras de desbloqueio sequencial (um módulo só fica disponível se o anterior estiver `completed`).
4. O aluno clica para acessar o módulo desejado.

**Nível 3: Detalhes do Módulo / Lista de Lições (`/app/s/:slug/ss/:slugModule`)**
1. Semelhante ao Nível 2, mas focado no micro.
2. Lista sequencialmente todas as Aulas Teóricas, Desafios e Revisões.
3. Mostra o status de conclusão de cada lição (icone de *check*).
4. O aluno clica em uma lição para consumi-la, sendo barrado se o limite de 5 lições concluídas por dia do plano gratuito já tiver sido atingido (o plano PRÓ não tem limite).

## 4. Gatilhos de Marketing e Comunicação
- **Restrição de Plano:** Usuários *Free* podem bater no teto de lições diárias, exibindo o gatilho visual para assinar o plano PRÓ (*Upgrade*).

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "O Módulo 2 está bloqueado (cadeado)".
  - **Solução:** Os cursos são independentes e o aluno pode iniciar qualquer um. O bloqueio acontece entre módulos: o aluno precisa concluir o módulo anterior (e suas lições, em ordem) para liberar o próximo.

## 6. Casos de Erro e Tratamento
- Em qualquer das 3 telas, falhas de rede ao comunicar com a API disparam a mensagem de erro padrão: `"Erro ao carregar os cursos/módulos"`.
- As regras de progressão (cálculo de porcentagem) dependem das lições completadas vinculadas àquele usuário no banco de dados Supabase (`UserLessonService`).

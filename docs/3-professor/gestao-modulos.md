# Gestão de Módulos

## 1. Objetivo do Fluxo
Permitir que o professor crie a estrutura macro de um curso (Módulo), definindo seu título, descrição, identidade visual (capa) e conteúdo inicial de apresentação, além de gerenciar a ordenação de seus submódulos.

## 2. Público-Alvo
Professores e Administradores.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo ocorre na rota `/professor/criar-modulo` ou `/professor/editar-modulo/:id`.

**Aba 1: Dados do Módulo**
1. O professor preenche **Título** e **Descrição**.
2. Ele escolhe a identidade visual via Ícone ou Upload de Imagem de Capa (até 2MB).
3. Ao salvar um módulo novo, a estrutura é gerada no banco e a página recarrega para o modo de Edição. Por padrão, novos módulos nascem com status *Em Revisão* (ocultos).

**Aba 2: Apresentação**
1. O professor pode construir páginas de apresentação usando blocos empilháveis (Textos em Markdown, alertas, imagens).
2. Pode reordenar esses blocos usando *Drag and Drop*.

**Aba 3: Submódulos**
1. Lista todos os submódulos que pertencem a este módulo pai.
2. O professor pode reordená-los facilmente clicando e arrastando (*Drag and Drop*), com a ordem sendo salva automaticamente na nuvem em tempo real.
3. Permite acesso direto à criação ou edição dos submódulos filhos.

## 4. Gatilhos de Marketing e Comunicação
- Nenhum gatilho gerado diretamente nesta etapa de construção.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Não consigo enviar a imagem da capa, nada acontece".
  - **Solução:** Lembrar o professor de que o arquivo deve ter menos de 2MB. O navegador lança um alerta se o arquivo for excessivamente pesado.

## 6. Casos de Erro e Tratamento
- **Validações:** Título curto (menos de 2 caracteres) ou descrição curta bloqueiam o botão de Salvar.
- **Falha de Reordenação:** Se a reordenação por *Drag and Drop* falhar por falta de conexão, o sistema avisa: `"Erro ao reordenar submódulos. A ordem anterior foi restaurada."` e volta os itens visualmente ao estado original.

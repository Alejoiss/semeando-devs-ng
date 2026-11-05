# Perfil do Aluno

## 1. Objetivo do Fluxo
Permitir a gestão autônoma dos dados pessoais, avatar, preferências de comunicação e credenciais de acesso da conta do usuário.

## 2. Público-Alvo
Todos os usuários logados.

## 3. Passo a Passo (Jornada do Usuário)
A tela de perfil fica em `/app/perfil`.

O painel é dividido em três seções de atualização independentes:

**Avatar / Foto de Perfil:**
1. O usuário clica na foto atual (ou ícone padrão).
2. O sistema operacional abre a janela de seleção de arquivo.
3. Ao selecionar, o arquivo é automaticamente enviado (Upload). Se sucesso, a foto atualiza.

**Dados Pessoais:**
1. Formulário exibe o **Nome** e um checkbox de **Opt-in de Newsletter**.
2. O usuário altera os valores e clica em Salvar.
3. O sistema valida se o nome possui no mínimo 3 caracteres e envia a atualização ao Supabase.

**Segurança (Senha):**
1. Usuário preenche a "Senha Atual", "Nova Senha" e "Confirmação".
2. O front-end valida reativamente se a nova senha confere com a confirmação.
3. Ao salvar, a API valida a senha antiga e consolida a troca.

## 4. Gatilhos de Marketing e Comunicação
- A opção de **Newsletter** ativa/desativa diretamente as comunicações de Marketing disparadas via *Painel Admin*.

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Esqueci minha senha atual para poder trocar".
  - **Solução:** Orientar a sair da conta (Logout) e utilizar o fluxo de 'Esqueci minha Senha' público.
- **Problema:** "A foto não carrega".
  - **Solução:** Certificar que o tamanho/formato estão dentro dos padrões (normalmente <2MB em `.png` ou `.jpg`).

## 6. Casos de Erro e Tratamento
- Senhas divergentes são bloqueadas na própria interface e o botão de salvar não é liberado.
- Todas as requisições geram *Feedbacks* via banners flutuantes de Sucesso (Verde) ou Erro (Vermelho) abaixo dos botões de Salvar.

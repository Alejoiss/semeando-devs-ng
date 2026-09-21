# Fluxo de Assinatura e Checkout

## 1. Objetivo do Fluxo
Apresentar a oferta de valor da versão PRÓ da plataforma, validar cupons de desconto e processar o pagamento do aluno através do gateway parceiro (Mercado Pago).

## 2. Público-Alvo
Alunos do plano *Free* interessados em assinar o plano premium.

## 3. Passo a Passo (Jornada do Usuário)
O fluxo envolve as telas de Oferta (`/app/upgrade`), Checkout (`/app/checkout`) e Aguardando Pagamento (`/app/aguardando-pagamento`).

**Etapa 1: Oferta (`/app/upgrade`)**
1. O aluno acessa a página (clicando em um botão "Seja Pró").
2. O sistema carrega os dados do plano principal (valores mensal/anual).
3. O aluno pode inserir um cupom de desconto. A interface calcula reativamente os novos preços com o desconto aplicado.
4. **Fast-track:** Se o cupom der 100% de desconto, o sistema pula o checkout e ativa a assinatura de imediato.
5. O aluno escolhe o ciclo (Mensal/Anual) e é levado para o checkout.

**Etapa 2: Checkout (`/app/checkout`)**
1. O aluno seleciona a forma de pagamento (Cartão de Crédito ou PIX).
2. O SDK do Mercado Pago carrega os campos de cartão encriptados (`mp.fields.create`).
3. O aluno preenche os dados do cartão, CPF e Nome.
4. O componente solicita um Token seguro do cartão para o Mercado Pago e, em seguida, envia este Token para a API proprietária criar a assinatura.

**Etapa 3: Aguardando Pagamento**
1. Após sucesso no Checkout, a aplicação roteia o usuário para a página de confirmação.
2. Se a escolha foi PIX, exibe o QR Code / Copia e Cola gerado.
3. Se foi Cartão, a página exibe uma animação de processamento aguardando a confirmação do webhook no backend (que por sua vez via *Supabase* ativa o `isPro = true` no perfil do usuário).

## 4. Gatilhos de Marketing e Comunicação
- Todo acesso à página de Upgrade gera um dado de interesse. Abandonos de carrinho no Checkout devem ser trabalhados com réguas de remarketing (e-mail: "Você esqueceu sua assinatura").

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Paguei via PIX mas ainda consta como Free".
  - **Solução:** O PIX pode demorar alguns segundos. Se falhar, orientar a tentar relogar (F5) ou conferir o histórico no banco dele se o valor foi estornado.

## 6. Casos de Erro e Tratamento
- Mapeamento robusto de erros do Mercado Pago (Cartão sem saldo, bloqueado, data expirada) para mensagens amigáveis em português (evitar mostrar os códigos genéricos da API).

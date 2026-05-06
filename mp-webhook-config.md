Configurando o Webhook no Mercado Pago
Pré-requisito: A função precisa estar acessível publicamente
O MP precisa conseguir fazer um POST para a sua função. Em produção, ela já estará pública via Supabase. Para testes locais, você precisaria de um túnel (tipo ngrok), mas vou focar no fluxo de produção, que é o que importa.

Passo 1 — Deploy da Edge Function no Supabase
Antes de qualquer coisa, a função precisa estar deployada:

bash
npx supabase functions deploy mp-webhook --no-verify-jwt
O --no-verify-jwt é essencial aqui — o MP não vai mandar um JWT do Supabase, então a função precisa ser pública.

A URL resultante será algo como:

https://<SEU_PROJECT_REF>.supabase.co/functions/v1/mp-webhook
Passo 2 — Adicionar o Secret na Supabase (Produção)
No painel da Supabase → Project Settings → Edge Functions → Secrets, adicione:

Secret	Valor
MP_WEBHOOK_SECRET	(você vai pegar no próximo passo)
ML_ACCESS_TOKEN	(já deve estar lá)
Passo 3 — Configurar no Painel do Mercado Pago
Acesse: https://www.mercadopago.com.br/developers/panel/app

Selecione sua aplicação (a que você usa para gerar o ML_ACCESS_TOKEN)

Vá em "Webhooks" no menu lateral

Clique em "Configurar notificações"

Preencha:

URL de produção: https://<SEU_PROJECT_REF>.supabase.co/functions/v1/mp-webhook
Eventos para assinar: marque subscription_preapproval e subscription_authorized_payment
Clique em Salvar

Passo 4 — Pegar o MP_WEBHOOK_SECRET
Após salvar, o MP vai exibir (ou já exibe na tela de configuração) o campo "Secret" — é uma string longa. Copie esse valor e cole:

No .env local (para testes via ngrok)
No painel da Supabase em Project Settings → Edge Functions → Secrets como MP_WEBHOOK_SECRET
Passo 5 — Testar pelo próprio painel do MP
O painel do Mercado Pago tem um botão "Simular evento" (ou "Testar") que vai disparar um webhook de teste para a sua URL. Quando ele disparar:

Vá no Supabase Dashboard → Edge Functions → Logs e confirme que a função recebeu o evento
Verifique a tabela subscription_billing_events no Table Editor — um registro deve aparecer lá com status = 'success'
Resumo do fluxo após configurado
Renovação automática
     ↓
Mercado Pago cobra o cartão
     ↓
MP faz POST → /functions/v1/mp-webhook
     ↓
Nossa função valida o HMAC (MP_WEBHOOK_SECRET)
     ↓
Busca o pagamento na API do MP
     ↓
Atualiza subscriptions.status + profiles.is_pro
     ↓
Registra em subscription_billing_events
O seu sistema fica 100% passivo — não precisa fazer polling nem verificar nada manualmente. 🎯

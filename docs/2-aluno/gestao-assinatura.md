# Gestão de Assinatura

## 1. Objetivo do Fluxo
Dar transparência financeira ao aluno sobre a sua assinatura, plano ativo e datas de cobrança, além de oferecer a opção *Self-Service* de cancelamento.

## 2. Público-Alvo
Alunos logados na plataforma (prioritariamente os que possuem o Plano PRÓ).

## 3. Passo a Passo (Jornada do Usuário)
A página de gestão fica em `/app/gerenciar-assinatura`.

1. Ao acessar a rota, o componente (`subscription-management.ts`) verifica a existência de assinaturas ativas na conta do usuário no momento.
2. A tela exibe as informações contratuais:
   - **Plano Ativo:** Mensal ou Anual (exibindo o ciclo de cobrança).
   - **Próxima Cobrança:** A data em que o cartão será faturado novamente (calculada baseada na data de assinatura `createdAt` somada ao ciclo).
3. **Casos Especiais (Cupons/Descontos):** Se a assinatura atual tiver sido fechada usando um cupom promocional que possui duração (ex: *12 meses de desconto*), o sistema calcula os meses restantes de benefício e exibe para o aluno.
4. **Cancelamento:** Há um botão perigoso (Danger) para cancelar a assinatura. Ao clicar, o navegador exige uma confirmação via alerta padrão (`confirm`).
5. Ao aceitar o cancelamento, a API notifica o processador de pagamento (ex: Stripe/MercadoPago) e o status do usuário recarrega para refletir a mudança.

## 4. Gatilhos de Marketing e Comunicação
- **Churn:** O cancelamento de assinatura deve gerar um forte evento no sistema para a equipe de Marketing engatilhar um e-mail de recuperação de *Churn* ("Por que você nos deixou?").

## 5. Dúvidas Frequentes e Suporte
- **Problema:** "Cancelei minha assinatura, e agora?".
  - **Solução:** Em integrações padrões de recorrência, o cancelamento para de cobrar o usuário no próximo ciclo. Ele continua tendo acesso PRÓ até que o mês já pago acabe.

## 6. Casos de Erro e Tratamento
- Se a integração com a provedora de pagamentos falhar no momento de cancelar, um `alert()` simples é exibido informando: `"Houve um erro ao cancelar a assinatura. Tente novamente."`

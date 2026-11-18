<!-- SpecDriven:managed:start -->
# Testing Strategy

## Overview

Because testing evidence in this repository currently focuses primarily on basic unit test scaffolding (Jasmine/Karma) without a clear comprehensive coverage strategy, we default to the **Testing Trophy** philosophy to guide future investments.

## Testing Trophy

1. **Integration Tests (Main Confidence Layer):**
   - We prefer integration tests that exercise multiple units working together (e.g., a Page component loaded with its associated Service and child components).
   - This provides the maximum confidence coefficient per hour of effort.

2. **End-to-End (E2E) Tests:**
   - E2E testing frameworks (e.g., Cypress/Playwright) should be used selectively for critical user journeys and cross-system flows.
   - Do not overuse E2E tests for minor rendering assertions due to flakiness and runtime costs.

3. **Unit Tests:**
   - Use unit tests strictly for isolated, high-risk logic.
   - Example targets: custom validators in `src/utils/validators.ts`, deep state transformations, purely functional utilities.
   - Do not write overly mocked unit tests for simple structural Angular components.

## Running Tests

Current tooling uses Karma and Jasmine.

- **Run all:** `npm test`

## Test Organization
- Test files must be named `*.spec.ts` and reside alongside the component or service they test.
- Use `TestBed` appropriately to configure integrations and mock out boundary networks.
<!-- SpecDriven:managed:end -->

# Camadas e comandos

| Camada | Ferramenta | Comando | Onde |
| --- | --- | --- | --- |
| Unitário e integração (Angular) | Karma + Jasmine | `npm run test:ci` (ou `npm test` com watch) | `src/**/*.spec.ts` |
| Edge Functions (Supabase) | Deno test | `npm run test:edge` | `supabase/functions/**/*.test.ts` |
| E2E | Playwright | `npm run e2e` (UI: `npm run e2e:ui`) | `e2e/*.spec.ts` |

Rode `npm run test:ci` da raiz. Specs que mexem em datas devem passar com `TZ=UTC` e `TZ=Asia/Tokyo`. Cobertura (meta 70%, branches 60%) só é medida ao fim, com script próprio.

## Karma

- `SupabaseService` é substituído por um fake em todo spec (`src/testing/global-setup.spec.ts`); sobrescreva `client`/`from` quando precisar de dados e use `createQueryStub` (`src/testing/query-stub.ts`).
- Serviços que carregam dados no construtor rodam em background: aguarde antes de mudar signals.
- O evento `close` de `<dialog>` é assíncrono; `DecimalPipe`/`DatePipe` pedem `LOCALE_ID` `pt-BR`; `resource().value()` lança no estado de erro (use `hasValue()`).

## Edge Functions (Deno)

- Cada função tem `handler.ts` com `createHandler(createClient, ...)`; `index.ts` só chama `serve(createHandler(createClient))` e mantém os imports `npm:`.
- Fake do cliente em `supabase/functions/_testing/fake-supabase.ts`. `fetch` global é stubado e o tempo usa `FakeTime` (avance com `tickAsync` em loop).
- Achado confirmado vira `Deno.test` com `ignore: true` e nome `finding <id>`.

## E2E (Playwright)

**Backend isolado.** Os testes usam um stack Supabase local próprio (project `semeandodevsapp-e2e`: API 54421, DB 54400, Mailpit 54424), nunca o de desenvolvimento (543xx). A configuração recusa hosts que não sejam localhost e as portas de dev.

```
npm run e2e:backend:start   # sobe o stack, cria contas, aplica grants.sql e o seed
npm run e2e                 # sobe o app com `ng serve --configuration e2e` na porta 4301
npm run e2e:backend:stop
node e2e/backend/stack.mjs seed   # cria contas novas e reaplica grants.sql num stack já existente
```

- O `webServer` gera o snapshot do catálogo público a partir do banco local (`CATALOG_ENV_FILE=src/environments/environment.e2e.ts`); `scripts/fetch-public-catalog.mjs` recusa qualquer host não local nesse modo.
- A fixture `e2e/support/test.ts` bloqueia hosts externos (exceto `cdn.jsdelivr.net`, de onde o Monaco é carregado).
- Helpers: `support/backend.ts` (`sql()`), `support/users.ts` (contas e `storageStateFor`), `support/axe.ts` (`expectNoAxeViolations`), `support/mailbox.ts` (Mailpit).

**Independência.** O `globalSetup` zera o estado de todas as contas `@e2e.test` (progresso, XP, assinaturas, cupons e newsletters `E2E…`, módulos `E2E …`) a cada execução. Cada jornada que muda estado usa a sua conta, para os arquivos rodarem em paralelo: `student` (aprendizado), `challenger`, `limited`, `subscriber`, `reader`, `teacher`, `admin`. Dentro de um arquivo que compartilha a conta use `test.describe.configure({ mode: 'serial' })`. Dados novos precisam de limpeza em `e2e/backend/reset-user-state.sql`.

**Regras.**
- Nunca enviar pagamento com cartão: o SDK do Mercado Pago é stubado, `create-subscription` nunca é chamado e o webhook é simulado por `UPDATE` no banco.
- Avaliação de IA (OpenRouter) sempre stubada no navegador (`page.route`).
- Nunca usar "Salvar e enviar" nem "Enviar teste" da newsletter.
- Testes longos pedem `test.setTimeout`; o padrão é 45 s e a máquina de desenvolvimento costuma estar carregada.
- Semeie `user_achievements` com `viewed = true`, senão o modal de conquista cobre a tela.

**Achados.** Um fluxo que expõe bug ou problema de acessibilidade vira `test.fixme` com o nome `finding <id>` e uma task `BUG`/`A11Y` no artefato de progresso. Antes de registrar, rode o teste sem o `fixme` para confirmar. Ao corrigir, troque `fixme` por `test`.

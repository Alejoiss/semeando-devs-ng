#!/bin/bash
set -euo pipefail

# O CLI do Supabase pode sair com código 1 só porque a telemetria (PostHog) estourou o tempo ao encerrar,
# mesmo com o comando concluído; isso abortaria o deploy com `set -e`
export DO_NOT_TRACK=1

STEP="início"
step() {
  STEP="$1"
  echo "$1"
}
trap 'echo "❌ Deploy interrompido na etapa: ${STEP}. Nada foi publicado depois dela." >&2' ERR

if [ "${SKIP_TESTS:-0}" != "1" ]; then
  step "🧪 Running unit tests (Karma)..."
  npm run test:ci

  step "🧪 Running Edge Function tests (Deno)..."
  npm run test:edge

  step "🧪 Running E2E tests (Playwright, isolated local backend)..."
  npm run e2e:backend:start
  # 2 workers por padrão: com mais, a máquina fica carregada e jornadas longas estouram o tempo (E2E_WORKERS=N altera)
  npm run e2e -- --workers="${E2E_WORKERS:-2}"
  npm run e2e:backend:stop
fi

# O cron de cupons e as funções de pagamento falham cedo sem este segredo
step "🔑 Checking the ML_ACCESS_TOKEN secret..."
if ! SECRETS_OUTPUT="$(supabase secrets list 2>&1)"; then
  echo "Não foi possível consultar os segredos do Supabase (projeto linkado? autenticado?). Rode 'supabase secrets list' para ver o erro." >&2
  exit 1
fi
if ! grep -q "ML_ACCESS_TOKEN" <<<"$SECRETS_OUTPUT"; then
  echo "O segredo ML_ACCESS_TOKEN não existe no projeto Supabase. Defina com: supabase secrets set ML_ACCESS_TOKEN=..." >&2
  exit 1
fi

# As migrations vêm antes do build: a pré-renderização consulta funções do banco (ex.: get_lesson_previews)
# e antes das functions: create-subscription chama as RPCs consume_coupon/release_coupon
step "🚀 Deploying to Supabase Migrations..."
supabase db push

step "🔨 Building semeando devs app..."
npm run build -- --configuration production

step "🚀 Deploying to Firebase..."
firebase deploy --only hosting

step "🔄 Deploying to Supabase functions..."
supabase functions deploy

trap - ERR
echo "✅ Deploy complete!"

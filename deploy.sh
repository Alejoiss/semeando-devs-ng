#!/bin/bash
set -euo pipefail

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
  # E2E_WORKERS=2 reduz a carga em máquinas ocupadas (a jornada de aprendizado oscila com load alto)
  if [ -n "${E2E_WORKERS:-}" ]; then
    npm run e2e -- --workers="$E2E_WORKERS"
  else
    npm run e2e
  fi
  npm run e2e:backend:stop
fi

# O cron de cupons e as funções de pagamento falham cedo sem este segredo
step "🔑 Checking the ML_ACCESS_TOKEN secret..."
if ! supabase secrets list | grep -q "ML_ACCESS_TOKEN"; then
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

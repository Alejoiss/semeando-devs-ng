#!/bin/bash
set -e

if [ "${SKIP_TESTS:-0}" != "1" ]; then
  echo "🧪 Running unit tests (Karma)..."
  npm run test:ci

  echo "🧪 Running Edge Function tests (Deno)..."
  npm run test:edge

  echo "🧪 Running E2E tests (Playwright, isolated local backend)..."
  npm run e2e:backend:start
  npm run e2e
fi

# As migrations vêm antes do build: a pré-renderização consulta funções do banco (ex.: get_lesson_previews)
echo "🚀 Deploying to Supabase Migrations..."
supabase db push

echo "🔨 Building semeando devs app..."
npm run build -- --configuration production

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "🔄 Deploying to Supabase functions..."
supabase functions deploy

echo "✅ Deploy complete!"

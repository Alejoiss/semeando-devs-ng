#!/bin/bash
set -e

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

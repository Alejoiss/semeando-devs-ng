#!/bin/bash
echo "🔨 Building semeando devs app..."
ng build --configuration production

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "🚀 Deploying to Supabase Migrations..."
npx supabase db push

echo "🔄 Deploying to Supabase functions..."
npx supabase functions deploy

echo "✅ Deploy complete!"

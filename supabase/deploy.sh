#!/bin/bash
echo "🔨 Building semeando devs app..."
ng build --configuration production

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "🚀 Deploying to Supabase Migrations..."
supabase db push

echo "🔄 Deploying to Supabase functions..."
supabase functions deploy

echo "✅ Deploy complete!"

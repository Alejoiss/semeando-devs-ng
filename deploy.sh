#!/bin/bash
echo "🔨 Building semeando devs app..."
ng build --configuration production

echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Deploy complete!"

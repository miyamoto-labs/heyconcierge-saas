#!/bin/bash
set -e

echo "🚀 AgentForge Deployment Script"
echo "═══════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this from the project root."
  exit 1
fi

echo "📦 Building production version..."
npx next build

if [ $? -ne 0 ]; then
  echo "❌ Build failed. Fix errors and try again."
  exit 1
fi

echo "✅ Build successful!"
echo ""
echo "🚢 Deploying to Vercel..."
npx vercel --prod --yes

if [ $? -ne 0 ]; then
  echo "❌ Deployment failed."
  exit 1
fi

echo ""
echo "✅ Deployment successful!"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Set up Supabase tables (if not done yet):"
echo "   ./scripts/init-database.sh"
echo ""
echo "2. Run database migration:"
echo "   curl -X POST 'https://agent-builder-gamma.vercel.app/api/migrate?secret=agentforge-2026'"
echo ""
echo "3. Test the app:"
echo "   https://agent-builder-gamma.vercel.app"
echo ""
echo "═══════════════════════════════════════"
echo "🎉 Done!"

#!/bin/bash
# HeyConcierge Backend Setup Script

set -e

echo "================================================"
echo "HeyConcierge Backend Setup"
echo "================================================"
echo

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.9+"
    exit 1
fi

echo "✅ Python $(python3 --version) found"

# Install dependencies
echo
echo "📦 Installing Python dependencies..."
pip3 install -r requirements.txt

echo
echo "✅ Dependencies installed"

# Setup .env
if [ ! -f .env ]; then
    echo
    echo "⚙️  Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env - Please edit with your Supabase credentials"
    echo
    echo "Get your credentials from:"
    echo "  - SUPABASE_URL: Project Settings → API → Project URL"
    echo "  - SUPABASE_SERVICE_KEY: Project Settings → API → service_role"
    echo
else
    echo
    echo "✅ .env already exists"
fi

# Make scripts executable
chmod +x ical_sync.py test_ical.py

echo
echo "================================================"
echo "Setup Complete! 🎉"
echo "================================================"
echo
echo "Next steps:"
echo
echo "1. Edit .env with your Supabase credentials:"
echo "   nano .env"
echo
echo "2. Test with your iCal URL:"
echo "   python3 test_ical.py"
echo
echo "3. Run first sync:"
echo "   source .env && python3 ical_sync.py"
echo
echo "4. Setup automated sync (choose one):"
echo "   - System cron: See README.md"
echo "   - OpenClaw cron: See README.md"
echo "   - Vercel: See VERCEL_DEPLOY.md"
echo

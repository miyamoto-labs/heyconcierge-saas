#!/bin/bash
###############################################################################
# Hyperliquid Autonomous Trading Bot - Setup Script
# This script sets up the bot for first-time use
###############################################################################

set -e  # Exit on error

echo "========================================================================"
echo "🤖 Hyperliquid Autonomous Trading Bot - Setup"
echo "========================================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Python version
echo -e "${BLUE}📋 Checking Python version...${NC}"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Found Python $PYTHON_VERSION"

if ! python3 -c 'import sys; assert sys.version_info >= (3, 8)' 2>/dev/null; then
    echo -e "${RED}❌ Python 3.8+ required!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python version OK${NC}"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${BLUE}📦 Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠️  Virtual environment already exists${NC}"
fi

echo ""

# Activate virtual environment
echo -e "${BLUE}🔌 Activating virtual environment...${NC}"
source venv/bin/activate

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${NC}"
pip install --upgrade pip > /dev/null 2>&1

# Core dependencies
echo "   Installing hyperliquid-python-sdk..."
pip install hyperliquid-python-sdk > /dev/null 2>&1

echo "   Installing numpy..."
pip install numpy > /dev/null 2>&1

echo "   Installing pandas..."
pip install pandas > /dev/null 2>&1

echo "   Installing eth-account..."
pip install eth-account > /dev/null 2>&1

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check configuration files
echo -e "${BLUE}🔍 Checking configuration files...${NC}"

if [ ! -f "trading_config.json" ]; then
    echo -e "${RED}❌ trading_config.json not found!${NC}"
    echo "   This file should have been created during setup."
    exit 1
fi

echo -e "${GREEN}✅ trading_config.json found${NC}"

if [ ! -f ".hyperliquid_config.json" ]; then
    echo -e "${RED}❌ .hyperliquid_config.json not found!${NC}"
    echo ""
    echo "   You need to create this file with your Hyperliquid credentials."
    echo ""
    echo "   Template:"
    echo "   {"
    echo "     \"public_wallet\": \"0xYourMainWalletAddress\","
    echo "     \"api_private_key\": \"0xYourAPIWalletPrivateKey\","
    echo "     \"approved_for_trading\": true"
    echo "   }"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ .hyperliquid_config.json found${NC}"
echo ""

# Test Hyperliquid connection
echo -e "${BLUE}🌐 Testing Hyperliquid API connection...${NC}"

python3 << 'EOF'
import json
import sys

try:
    from hyperliquid.info import Info
    
    # Load config
    with open('.hyperliquid_config.json', 'r') as f:
        config = json.load(f)
    
    # Test connection
    info = Info(skip_ws=True)
    all_mids = info.all_mids()
    
    if not all_mids:
        print("❌ Failed to fetch market data")
        sys.exit(1)
    
    btc_price = all_mids.get('BTC', 0)
    print(f"✅ Connection successful! BTC: ${btc_price:,.2f}")
    
    # Check account
    wallet = config['public_wallet']
    user_state = info.user_state(wallet)
    margin_summary = user_state.get('marginSummary', {})
    balance = float(margin_summary.get('accountValue', 0))
    
    print(f"✅ Account connected: {wallet[:10]}...{wallet[-8:]}")
    print(f"💰 Balance: ${balance:,.2f}")
    
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Connection test failed: {e}")
    sys.exit(1)
EOF

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Hyperliquid connection test failed!${NC}"
    exit 1
fi

echo ""

# Make scripts executable
echo -e "${BLUE}🔧 Making scripts executable...${NC}"
chmod +x hyperliquid_autonomous_trader.py
chmod +x performance_stats.py
echo -e "${GREEN}✅ Scripts are executable${NC}"
echo ""

# Create data directories
echo -e "${BLUE}📁 Creating data directories...${NC}"
mkdir -p logs
mkdir -p backups
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Display summary
echo "========================================================================"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "========================================================================"
echo ""
echo "📋 Quick Start Guide:"
echo ""
echo "1. Review configuration:"
echo "   nano trading_config.json"
echo ""
echo "2. Test in paper mode (RECOMMENDED):"
echo "   python3 hyperliquid_autonomous_trader.py"
echo ""
echo "3. Monitor performance:"
echo "   python3 performance_stats.py"
echo ""
echo "4. When ready for live trading:"
echo "   Edit trading_config.json, set paper_mode: false"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT SAFETY NOTES:${NC}"
echo "   • Always test in paper mode first!"
echo "   • Start with small position sizes"
echo "   • Monitor the bot regularly"
echo "   • Set appropriate risk limits"
echo "   • Keep emergency_stop accessible"
echo ""
echo "📚 Full documentation: HYPERLIQUID_BOT_GUIDE.md"
echo ""
echo "========================================================================"
echo ""

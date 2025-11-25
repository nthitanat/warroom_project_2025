#!/bin/bash
# ============================================
# VPN Connection Script for Chula VPN
# ============================================
# This script connects to vpn.chula.ac.th VPN

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
else
    echo -e "${RED}❌ Error: .env file not found in project root${NC}"
    exit 1
fi

echo -e "${BLUE}🔐 Connecting to Chula VPN...${NC}"

# Check if openconnect is installed
if ! command -v openconnect &> /dev/null; then
    echo -e "${RED}❌ openconnect is not installed.${NC}"
    echo -e "${YELLOW}📦 Installing openconnect...${NC}"
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install openconnect
        else
            echo -e "${RED}❌ Homebrew is not installed. Please install Homebrew first:${NC}"
            echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
            exit 1
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y openconnect
        elif command -v yum &> /dev/null; then
            sudo yum install -y openconnect
        else
            echo -e "${RED}❌ Unable to install openconnect automatically. Please install it manually.${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Unsupported operating system${NC}"
        exit 1
    fi
fi

echo -e "${BLUE}📡 Establishing VPN connection to $VPN_HOST...${NC}"

# Check if SUDO_PASSWORD is set
if [ -z "$SUDO_PASSWORD" ]; then
    echo -e "${RED}❌ Error: SUDO_PASSWORD not set in .env file${NC}"
    echo -e "${YELLOW}💡 Please add SUDO_PASSWORD=your_mac_password to .env${NC}"
    exit 1
fi

# Connect to VPN (this will run in background)
# Note: This requires sudo privileges
echo -e "${YELLOW}⚠️  This script requires sudo privileges to establish VPN connection${NC}"

# Authenticate sudo first (this validates the password and caches credentials)
echo "$SUDO_PASSWORD" | sudo -S -v

# Create a script that will be run with sudo
SUDO_SCRIPT=$(mktemp)
CRED_FILE=$(mktemp)
trap "rm -f $SUDO_SCRIPT $CRED_FILE" EXIT

# Write VPN credentials to file
echo "$VPN_PASSWORD" > "$CRED_FILE"

cat > "$SUDO_SCRIPT" <<EOFSCRIPT
#!/bin/bash
openconnect \
    --background \
    --pid-file=/var/run/openconnect.pid \
    --user="$VPN_USERNAME" \
    --passwd-on-stdin \
    "$VPN_HOST" < "$CRED_FILE"
EOFSCRIPT

chmod +x "$SUDO_SCRIPT"

# Run the script with sudo (credentials are already cached from sudo -v)
sudo bash "$SUDO_SCRIPT"

# Wait a moment for connection to establish
sleep 5

# Check if VPN is connected
if pgrep -x "openconnect" > /dev/null; then
    echo -e "${GREEN}✅ VPN connection established successfully${NC}"
    echo -e "${BLUE}📌 PID file: /var/run/openconnect.pid${NC}"
    echo ""
    echo -e "${YELLOW}To disconnect VPN later, run:${NC}"
    echo "   sudo kill \$(cat /var/run/openconnect.pid)"
    exit 0
else
    echo -e "${RED}❌ Failed to establish VPN connection${NC}"
    exit 1
fi

#!/bin/bash
# VPN Connection Script for Chula VPN
# This script connects to vpn.chula.ac.th VPN

set -e  # Exit on any error

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
else
    echo "❌ Error: .env file not found in scripts directory"
    exit 1
fi

echo "🔐 Connecting to Chula VPN..."

# Check if openconnect is installed
if ! command -v openconnect &> /dev/null; then
    echo "❌ openconnect is not installed."
    echo "📦 Installing openconnect..."
    
    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install openconnect
        else
            echo "❌ Homebrew is not installed. Please install Homebrew first:"
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
            echo "❌ Unable to install openconnect automatically. Please install it manually."
            exit 1
        fi
    else
        echo "❌ Unsupported operating system"
        exit 1
    fi
fi

echo "📡 Establishing VPN connection to $VPN_HOST..."

# Check if SUDO_PASSWORD is set
if [ -z "$SUDO_PASSWORD" ]; then
    echo "❌ Error: SUDO_PASSWORD not set in .env file"
    echo "💡 Please add SUDO_PASSWORD=your_mac_password to scripts/.env"
    exit 1
fi

# Connect to VPN (this will run in background)
# Note: This requires sudo privileges
echo "⚠️  This script requires sudo privileges to establish VPN connection"

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
    echo "✅ VPN connection established successfully"
    echo "📌 PID file: /var/run/openconnect.pid"
    echo ""
    echo "To disconnect VPN later, run:"
    echo "   sudo kill \$(cat /var/run/openconnect.pid)"
    exit 0
else
    echo "❌ Failed to establish VPN connection"
    exit 1
fi

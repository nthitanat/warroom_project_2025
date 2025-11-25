#!/bin/bash
# ============================================
# VPN Disconnection Script
# ============================================

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
fi

echo -e "${BLUE}🔌 Disconnecting from VPN...${NC}"

# Check if openconnect is running
if pgrep -x "openconnect" > /dev/null; then
    # Check if PID file exists
    if [ -f /var/run/openconnect.pid ]; then
        echo -e "${YELLOW}⚠️  This script requires sudo privileges${NC}"
        if [ -n "$SUDO_PASSWORD" ]; then
            echo "$SUDO_PASSWORD" | sudo -S kill $(cat /var/run/openconnect.pid)
            echo "$SUDO_PASSWORD" | sudo -S rm -f /var/run/openconnect.pid
        else
            sudo kill $(cat /var/run/openconnect.pid)
            sudo rm -f /var/run/openconnect.pid
        fi
        echo -e "${GREEN}✅ VPN disconnected successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  PID file not found, killing all openconnect processes${NC}"
        if [ -n "$SUDO_PASSWORD" ]; then
            echo "$SUDO_PASSWORD" | sudo -S killall openconnect
        else
            sudo killall openconnect
        fi
        echo -e "${GREEN}✅ VPN disconnected${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  VPN is not connected${NC}"
fi

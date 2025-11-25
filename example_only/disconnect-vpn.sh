#!/bin/bash
# VPN Disconnection Script

set -e  # Exit on any error

# Load environment variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/.env" ]; then
    source "$SCRIPT_DIR/.env"
fi

echo "🔌 Disconnecting from VPN..."

# Check if openconnect is running
if pgrep -x "openconnect" > /dev/null; then
    # Check if PID file exists
    if [ -f /var/run/openconnect.pid ]; then
        echo "⚠️  This script requires sudo privileges"
        if [ -n "$SUDO_PASSWORD" ]; then
            echo "$SUDO_PASSWORD" | sudo -S kill $(cat /var/run/openconnect.pid)
            echo "$SUDO_PASSWORD" | sudo -S rm -f /var/run/openconnect.pid
        else
            sudo kill $(cat /var/run/openconnect.pid)
            sudo rm -f /var/run/openconnect.pid
        fi
        echo "✅ VPN disconnected successfully"
    else
        echo "⚠️  PID file not found, killing all openconnect processes"
        if [ -n "$SUDO_PASSWORD" ]; then
            echo "$SUDO_PASSWORD" | sudo -S killall openconnect
        else
            sudo killall openconnect
        fi
        echo "✅ VPN disconnected"
    fi
else
    echo "ℹ️  VPN is not connected"
fi

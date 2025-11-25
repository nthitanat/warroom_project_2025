#!/bin/bash
# ============================================
# Remote Deployment Script for WarRoom Project
# ============================================
# This script connects to VPN, SSHs to remote server, and deploys the application

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables from project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

if [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    echo -e "${RED}❌ Error: .env file not found in project root${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 WarRoom Remote Server Management Script${NC}"
echo ""

# Show menu for action selection
echo -e "${YELLOW}Select an action:${NC}"
echo "1) Full Deploy (git pull + build + restart containers)"
echo "2) Quick Update (git pull + restart containers, no rebuild)"
echo "3) Start containers"
echo "4) Stop containers"
echo "5) Restart containers"
echo "6) View logs"
echo "7) Container status"
echo ""
read -p "Enter your choice [1-7]: " ACTION_CHOICE

case $ACTION_CHOICE in
    1) ACTION="deploy" ;;
    2) ACTION="update" ;;
    3) ACTION="start" ;;
    4) ACTION="stop" ;;
    5) ACTION="restart" ;;
    6) ACTION="logs" ;;
    7) ACTION="status" ;;
    *)
        echo -e "${RED}❌ Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Action selected: $ACTION${NC}"
echo ""

# FORCE PRODUCTION MODE for remote deployment
echo -e "${YELLOW}🔧 Forcing PRODUCTION mode for remote operations...${NC}"
export DEPLOYMENT_MODE=production

# Create a temporary production .env file
TEMP_ENV_FILE=$(mktemp)
trap "rm -f $TEMP_ENV_FILE" EXIT

# Copy .env from project root and override DEPLOYMENT_MODE
cp "$PROJECT_ROOT/.env" "$TEMP_ENV_FILE"
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/^DEPLOYMENT_MODE=.*/DEPLOYMENT_MODE=production/' "$TEMP_ENV_FILE"
else
    sed -i 's/^DEPLOYMENT_MODE=.*/DEPLOYMENT_MODE=production/' "$TEMP_ENV_FILE"
fi

echo -e "${GREEN}✅ Environment set to: PRODUCTION${NC}"
echo ""

# Step 1: Check VPN connection
echo -e "${BLUE}📡 Step 1: Checking VPN connection...${NC}"

VPN_CONNECTED=false
if pgrep -x "openconnect" > /dev/null; then
    echo -e "${GREEN}✅ VPN is already connected${NC}"
    VPN_CONNECTED=true
else
    echo -e "${YELLOW}⚠️  VPN is not connected. Connecting now...${NC}"
    
    # Run VPN connection script
    if [ -f "$SCRIPT_DIR/connect-vpn.sh" ]; then
        bash "$SCRIPT_DIR/connect-vpn.sh"
        VPN_CONNECTED=true
    else
        echo -e "${RED}❌ Error: connect-vpn.sh not found${NC}"
        exit 1
    fi
fi

# Wait a moment for VPN to stabilize
sleep 3

# Step 2: Test connection to remote server
echo ""
echo -e "${BLUE}🔌 Step 2: Testing connection to remote server...${NC}"

# Test if server is reachable
if ping -c 1 -W 5 "$REMOTE_HOST" &> /dev/null; then
    echo -e "${GREEN}✅ Remote server is reachable${NC}"
else
    echo -e "${RED}❌ Cannot reach remote server at $REMOTE_HOST${NC}"
    echo -e "${YELLOW}💡 Make sure VPN is connected and server is online${NC}"
    exit 1
fi

# Step 3: Ensure sshpass is installed for automated SSH
echo ""
echo -e "${BLUE}🔧 Step 3: Checking SSH tools...${NC}"

if ! command -v sshpass &> /dev/null; then
    echo -e "${YELLOW}📦 Installing sshpass...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install hudochenkov/sshpass/sshpass
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update && sudo apt-get install -y sshpass
    fi
fi

echo -e "${GREEN}✅ SSH tools ready${NC}"

# Step 4: Upload .env file to remote server (since it's in .gitignore)
echo ""
echo -e "${BLUE}📤 Step 4: Uploading .env file to remote server...${NC}"

# Upload .env file from project root to remote server
sshpass -p "$REMOTE_PASSWORD" scp -P "$REMOTE_PORT" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o PreferredAuthentications=password \
    -o PubkeyAuthentication=no \
    "$TEMP_ENV_FILE" \
    "$REMOTE_USER@$REMOTE_HOST:/tmp/.env.warroom"

echo -e "${GREEN}✅ .env file uploaded from project root${NC}"

# Step 5: Execute action on remote server
echo ""
echo -e "${BLUE}🚀 Step 5: Executing action on remote server...${NC}"

# Execute commands on remote server based on selected action
# We'll set the remote env vars inline so the remote shell has GITHUB token and repo url
sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
    -o StrictHostKeyChecking=no \
    -o UserKnownHostsFile=/dev/null \
    -o PreferredAuthentications=password \
    -o PubkeyAuthentication=no \
    "$REMOTE_USER@$REMOTE_HOST" "REMOTE_SUDO_PASS='$REMOTE_PASSWORD' GITHUB_TOKEN='$GITHUB_TOKEN' REPO_URL='$REPO_URL' ACTION='$ACTION' bash -s" << 'ENDSSH'
set -e

DEPLOY_PATH=/www/warroom-deploy

# Function to deploy (full build)
deploy_app() {
    echo "📂 Preparing repository on remote host..."

    # Create /www directory if needed
    echo "$REMOTE_SUDO_PASS" | sudo -S mkdir -p /www
    echo "$REMOTE_SUDO_PASS" | sudo -S chown -R $USER:$USER /www || true

    if [ ! -d "$DEPLOY_PATH/.git" ]; then
        echo "Cloning repository into $DEPLOY_PATH..."
        git clone "https://${GITHUB_TOKEN}@${REPO_URL#https://}" "$DEPLOY_PATH"
    else
        echo "Repository exists, pulling latest changes..."
        cd "$DEPLOY_PATH"
        git fetch --all --prune
        git reset --hard origin/main || git pull origin main
    fi

    echo "📤 Deploying .env file to project root..."
    if [ -f /tmp/.env.warroom ]; then
        # Copy to project root only (single source of truth)
        cp /tmp/.env.warroom "$DEPLOY_PATH/.env"
        rm /tmp/.env.warroom
        echo "✅ .env file deployed to project root"
    else
        echo "⚠️  Warning: .env file not found in /tmp"
    fi

    echo "🔧 Setting up environment for production..."
    cd "$DEPLOY_PATH"
    # Update .env to force production mode
    if [ -f .env ]; then
        sed -i 's/^DEPLOYMENT_MODE=.*/DEPLOYMENT_MODE=production/' .env 2>/dev/null || true
    fi

    echo "📦 Checking Node.js version..."
    CURRENT_NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$CURRENT_NODE_VERSION" -lt 20 ]; then
        echo "⚠️  Node.js $CURRENT_NODE_VERSION detected. Upgrading to Node.js 20..."
        # Install Node.js 20 using nvm if available, or suggest manual upgrade
        if command -v nvm &> /dev/null; then
            nvm install 20
            nvm use 20
            echo "✅ Node.js upgraded to version $(node --version)"
        else
            echo "⚠️  nvm not found. Attempting to install Node.js 20 via package manager..."
            # Try to install via common package managers
            if command -v apt-get &> /dev/null; then
                curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                printf '%s\n' "$REMOTE_SUDO_PASS" | sudo -S apt-get install -y nodejs
            elif command -v yum &> /dev/null; then
                curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
                printf '%s\n' "$REMOTE_SUDO_PASS" | sudo -S yum install -y nodejs
            else
                echo "❌ Cannot automatically upgrade Node.js. Please upgrade manually to version 20+"
                echo "   Current version: $(node --version)"
            fi
        fi
    else
        echo "✅ Node.js $(node --version) is compatible"
    fi

    echo "🏗️ Building React client for production..."
    cd "$DEPLOY_PATH/war-front"
    # Try npm ci first, fall back to npm install if lock file is out of sync
    if [ -f package-lock.json ]; then
        echo "Attempting clean install with npm ci..."
        if ! npm ci; then
            echo "⚠️  npm ci failed, regenerating lock file with npm install..."
            rm -f package-lock.json
            npm install
        fi
    else
        npm install
    fi
    npm run build

    echo "📁 Deploying React build to /www/wwwroot/engagement.chula.ac.th/..."
    echo "$REMOTE_SUDO_PASS" | sudo -S mkdir -p /www/wwwroot/engagement.chula.ac.th
    echo "$REMOTE_SUDO_PASS" | sudo -S rm -rf /www/wwwroot/engagement.chula.ac.th/war-room || true
    echo "$REMOTE_SUDO_PASS" | sudo -S mv "$DEPLOY_PATH/war-front/build" /www/wwwroot/engagement.chula.ac.th/war-room
    echo "$REMOTE_SUDO_PASS" | sudo -S chown -R $USER:$USER /www/wwwroot/engagement.chula.ac.th 2>/dev/null || true
    echo "✅ React app deployed to web server"

    echo "🐳 Building and starting Docker containers..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build

    echo "🔥 Configuring firewall rules..."
    # Allow ports 4000 (API) and 4001 (Client)
    echo "$REMOTE_SUDO_PASS" | sudo -S ufw allow 4000/tcp comment 'WarRoom API Server' 2>/dev/null || true
    echo "$REMOTE_SUDO_PASS" | sudo -S ufw allow 4001/tcp comment 'WarRoom Client App' 2>/dev/null || true
    # Ensure UFW is enabled (won't affect if already enabled)
    echo "$REMOTE_SUDO_PASS" | sudo -S ufw --force enable 2>/dev/null || true
    echo "✅ Firewall rules updated"

    echo "🧹 Cleaning workspace (remote tmp)..."
    rm -rf /tmp/* || true

    echo "✅ Deployment complete!"

    echo ""
    echo "📊 Container status:"
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env ps
}

# Function to update (git pull + restart, no rebuild)
update_app() {
    echo "📥 Updating application from repository..."

    if [ ! -d "$DEPLOY_PATH/.git" ]; then
        echo "❌ Repository not found. Please run Full Deploy first."
        exit 1
    fi

    echo "Pulling latest changes..."
    cd "$DEPLOY_PATH"
    git fetch --all --prune
    git reset --hard origin/main || git pull origin main

    echo "📤 Updating .env file in project root..."
    if [ -f /tmp/.env.warroom ]; then
        # Copy to project root only (single source of truth)
        cp /tmp/.env.warroom "$DEPLOY_PATH/.env"
        rm /tmp/.env.warroom
        echo "✅ .env file updated in project root"
    else
        echo "⚠️  Warning: .env file not found in /tmp"
    fi

    echo "🔧 Setting up environment for production..."
    if [ -f .env ]; then
        sed -i 's/^DEPLOYMENT_MODE=.*/DEPLOYMENT_MODE=production/' .env 2>/dev/null || true
    fi

    echo "🔄 Restarting Docker containers..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env restart

    echo "✅ Update complete!"

    echo ""
    echo "📊 Container status:"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env ps
}

# Function to start containers
start_containers() {
    echo "🚀 Starting Docker containers..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d
    echo "✅ Containers started!"
    echo ""
    echo "📊 Container status:"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env ps
}

# Function to stop containers
stop_containers() {
    echo "🛑 Stopping Docker containers..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env down
    echo "✅ Containers stopped!"
}

# Function to restart containers
restart_containers() {
    echo "🔄 Restarting Docker containers..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env restart
    echo "✅ Containers restarted!"
    echo ""
    echo "📊 Container status:"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env ps
}

# Function to view logs
view_logs() {
    echo "📋 Viewing container logs (Press Ctrl+C to exit)..."
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env logs -f --tail=100
}

# Function to show status
show_status() {
    echo "📊 Container status:"
    cd "$DEPLOY_PATH"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env ps
    echo ""
    echo "💾 Disk usage:"
    echo "$REMOTE_SUDO_PASS" | sudo -S docker system df
}

# Execute action based on choice
case $ACTION in
    deploy)
        deploy_app
        ;;
    update)
        update_app
        ;;
    start)
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    logs)
        view_logs
        ;;
    status)
        show_status
        ;;
    *)
        echo "❌ Unknown action: $ACTION"
        exit 1
        ;;
esac

ENDSSH

# Step 6: Post-execution actions based on action type
echo ""

if [ "$ACTION" == "deploy" ] || [ "$ACTION" == "update" ]; then
    echo -e "${BLUE}🔍 Step 6: Verifying deployment...${NC}"

    sleep 5
elif [ "$ACTION" == "logs" ]; then
    echo -e "${GREEN}✅ Log viewing session ended${NC}"
    exit 0
else
    echo -e "${GREEN}✅ Action '$ACTION' completed successfully!${NC}"
    exit 0
fi

sleep 5

# Check if services are responding
echo -e "${YELLOW}Testing API endpoint...${NC}"
if curl -f -s "http://$REMOTE_HOST:4000/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Server is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API Server health check failed (may still be starting up)${NC}"
fi

echo -e "${YELLOW}Testing Web Client...${NC}"
if curl -f -s "http://$REMOTE_HOST:4001" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web Client is responding${NC}"
else
    echo -e "${YELLOW}⚠️  Web Client health check failed (may still be starting up)${NC}"
fi

# Summary
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
if [ "$ACTION" == "deploy" ]; then
    echo -e "${GREEN}🎉 Deployment Completed Successfully!${NC}"
else
    echo -e "${GREEN}🎉 Update Completed Successfully!${NC}"
fi
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🌐 Access your application at:${NC}"
echo -e "   Web Client:  ${YELLOW}http://$REMOTE_HOST:4001${NC}"
echo -e "   API Server:  ${YELLOW}http://$REMOTE_HOST:4000/api${NC}"
echo ""
echo -e "${BLUE}📌 Useful commands:${NC}"
echo -e "   Full Deploy: ${YELLOW}./remote-deploy.sh${NC} (select option 1)"
echo -e "   Quick Update:${YELLOW}./remote-deploy.sh${NC} (select option 2)"
echo -e "   View logs:   ${YELLOW}./remote-deploy.sh${NC} (select option 6)"
echo -e "   Status:      ${YELLOW}./remote-deploy.sh${NC} (select option 7)"
echo ""
echo -e "${BLUE}🔌 To disconnect VPN:${NC}"
echo -e "   ${YELLOW}./disconnect-vpn.sh${NC}"
echo ""

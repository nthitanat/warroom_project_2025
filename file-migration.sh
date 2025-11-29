#!/bin/bash
# ============================================
# File Migration Script for WarRoom Project
# ============================================
# This script syncs files between local and remote servers
# Files include: analytics data, charity images, lesson thumbnails

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

# Timestamp for logs
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_DIR="$PROJECT_ROOT/migration_logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/file_migration_$TIMESTAMP.log"

# Paths
LOCAL_FILES_DIR="$PROJECT_ROOT/war-server/files"
REMOTE_DEPLOY_PATH="/www/warroom-deploy"
REMOTE_FILES_DIR="$REMOTE_DEPLOY_PATH/war-server/files"

# ============================================
# Logging functions
# ============================================
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# ============================================
# SSH/SCP wrapper functions
# ============================================

remote_exec() {
    local cmd="$1"
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PreferredAuthentications=password \
        -o PubkeyAuthentication=no \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" "$cmd" 2>/dev/null
}

# Sync local directory to remote using rsync over SSH
sync_to_remote() {
    local local_path="$1"
    local remote_path="$2"
    local description="$3"
    
    log "${YELLOW}📤 Syncing $description to remote...${NC}"
    
    # Use rsync for efficient incremental sync
    sshpass -p "$REMOTE_PASSWORD" rsync -avz --progress \
        -e "ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PreferredAuthentications=password -o PubkeyAuthentication=no -o LogLevel=ERROR" \
        "$local_path/" \
        "$REMOTE_USER@$REMOTE_HOST:$remote_path/" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "${GREEN}✅ $description synced to remote${NC}"
        return 0
    else
        log "${RED}❌ Failed to sync $description to remote${NC}"
        return 1
    fi
}

# Sync remote directory to local using rsync over SSH
sync_to_local() {
    local remote_path="$1"
    local local_path="$2"
    local description="$3"
    
    log "${YELLOW}📥 Syncing $description to local...${NC}"
    
    # Ensure local directory exists
    mkdir -p "$local_path"
    
    # Use rsync for efficient incremental sync
    sshpass -p "$REMOTE_PASSWORD" rsync -avz --progress \
        -e "ssh -p $REMOTE_PORT -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o PreferredAuthentications=password -o PubkeyAuthentication=no -o LogLevel=ERROR" \
        "$REMOTE_USER@$REMOTE_HOST:$remote_path/" \
        "$local_path/" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log "${GREEN}✅ $description synced to local${NC}"
        return 0
    else
        log "${RED}❌ Failed to sync $description to local${NC}"
        return 1
    fi
}

# ============================================
# Comparison functions
# ============================================

get_local_file_stats() {
    local dir="$1"
    if [ -d "$dir" ]; then
        local count=$(find "$dir" -type f | wc -l | tr -d ' ')
        local size=$(du -sh "$dir" 2>/dev/null | cut -f1)
        echo "$count files, $size"
    else
        echo "Directory not found"
    fi
}

get_remote_file_stats() {
    local dir="$1"
    remote_exec "if [ -d '$dir' ]; then count=\$(find '$dir' -type f | wc -l); size=\$(du -sh '$dir' 2>/dev/null | cut -f1); echo \"\$count files, \$size\"; else echo 'Directory not found'; fi"
}

compare_directories() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}📊 Comparing Local and Remote File Directories${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    
    # Analytics
    log ""
    log "${CYAN}📊 Analytics files:${NC}"
    local local_analytics=$(get_local_file_stats "$LOCAL_FILES_DIR/analytics")
    local remote_analytics=$(get_remote_file_stats "$REMOTE_FILES_DIR/analytics")
    log "   Local:  $local_analytics"
    log "   Remote: $remote_analytics"
    
    # Charities
    log ""
    log "${CYAN}🏠 Charity files:${NC}"
    local local_charities=$(get_local_file_stats "$LOCAL_FILES_DIR/charities")
    local remote_charities=$(get_remote_file_stats "$REMOTE_FILES_DIR/charities")
    log "   Local:  $local_charities"
    log "   Remote: $remote_charities"
    
    # Lessons
    log ""
    log "${CYAN}📚 Lesson files:${NC}"
    local local_lessons=$(get_local_file_stats "$LOCAL_FILES_DIR/lessons")
    local remote_lessons=$(get_remote_file_stats "$REMOTE_FILES_DIR/lessons")
    log "   Local:  $local_lessons"
    log "   Remote: $remote_lessons"
    
    log ""
}

# ============================================
# Sync functions
# ============================================

sync_all_to_remote() {
    log ""
    log "${BLUE}📤 Syncing ALL files LOCAL → REMOTE...${NC}"
    log ""
    
    # Ensure remote directory structure exists
    log "${CYAN}Creating remote directory structure...${NC}"
    remote_exec "mkdir -p $REMOTE_FILES_DIR/analytics $REMOTE_FILES_DIR/charities $REMOTE_FILES_DIR/lessons"
    
    local success=true
    
    # Sync analytics
    if [ -d "$LOCAL_FILES_DIR/analytics" ]; then
        sync_to_remote "$LOCAL_FILES_DIR/analytics" "$REMOTE_FILES_DIR/analytics" "Analytics files" || success=false
    else
        log "${YELLOW}⚠️  Local analytics directory not found, skipping${NC}"
    fi
    
    # Sync charities
    if [ -d "$LOCAL_FILES_DIR/charities" ]; then
        sync_to_remote "$LOCAL_FILES_DIR/charities" "$REMOTE_FILES_DIR/charities" "Charity files" || success=false
    else
        log "${YELLOW}⚠️  Local charities directory not found, skipping${NC}"
    fi
    
    # Sync lessons
    if [ -d "$LOCAL_FILES_DIR/lessons" ]; then
        sync_to_remote "$LOCAL_FILES_DIR/lessons" "$REMOTE_FILES_DIR/lessons" "Lesson files" || success=false
    else
        log "${YELLOW}⚠️  Local lessons directory not found, skipping${NC}"
    fi
    
    if $success; then
        log ""
        log "${GREEN}✅ All files synced to remote successfully!${NC}"
    else
        log ""
        log "${YELLOW}⚠️  Some files failed to sync. Check log for details.${NC}"
    fi
}

sync_all_to_local() {
    log ""
    log "${BLUE}📥 Syncing ALL files REMOTE → LOCAL...${NC}"
    log ""
    
    # Ensure local directory structure exists
    log "${CYAN}Creating local directory structure...${NC}"
    mkdir -p "$LOCAL_FILES_DIR/analytics" "$LOCAL_FILES_DIR/charities" "$LOCAL_FILES_DIR/lessons"
    
    local success=true
    
    # Check if remote directories exist
    local remote_exists=$(remote_exec "[ -d '$REMOTE_FILES_DIR' ] && echo 'yes' || echo 'no'")
    
    if [ "$remote_exists" != "yes" ]; then
        log "${RED}❌ Remote files directory does not exist: $REMOTE_FILES_DIR${NC}"
        log "${YELLOW}💡 Hint: Deploy the application first using remote-deploy.sh${NC}"
        return 1
    fi
    
    # Sync analytics
    sync_to_local "$REMOTE_FILES_DIR/analytics" "$LOCAL_FILES_DIR/analytics" "Analytics files" || success=false
    
    # Sync charities
    sync_to_local "$REMOTE_FILES_DIR/charities" "$LOCAL_FILES_DIR/charities" "Charity files" || success=false
    
    # Sync lessons
    sync_to_local "$REMOTE_FILES_DIR/lessons" "$LOCAL_FILES_DIR/lessons" "Lesson files" || success=false
    
    if $success; then
        log ""
        log "${GREEN}✅ All files synced to local successfully!${NC}"
    else
        log ""
        log "${YELLOW}⚠️  Some files failed to sync. Check log for details.${NC}"
    fi
}

sync_specific_category() {
    local category="$1"
    local direction="$2"
    
    local local_path="$LOCAL_FILES_DIR/$category"
    local remote_path="$REMOTE_FILES_DIR/$category"
    local description
    
    case $category in
        analytics) description="Analytics files" ;;
        charities) description="Charity files" ;;
        lessons) description="Lesson files" ;;
        *) 
            log "${RED}❌ Unknown category: $category${NC}"
            return 1
            ;;
    esac
    
    if [ "$direction" == "push" ]; then
        remote_exec "mkdir -p $remote_path"
        sync_to_remote "$local_path" "$remote_path" "$description"
    else
        mkdir -p "$local_path"
        sync_to_local "$remote_path" "$local_path" "$description"
    fi
}

interactive_sync() {
    log ""
    log "${BLUE}🔄 Interactive File Sync Mode${NC}"
    log ""
    
    # Analytics
    echo ""
    echo -e "${CYAN}📊 Analytics files:${NC}"
    local local_analytics=$(get_local_file_stats "$LOCAL_FILES_DIR/analytics")
    local remote_analytics=$(get_remote_file_stats "$REMOTE_FILES_DIR/analytics")
    echo "   Local:  $local_analytics"
    echo "   Remote: $remote_analytics"
    echo ""
    echo "   1) Push local → remote"
    echo "   2) Pull remote → local"
    echo "   3) Skip"
    read -p "   Choice [1-3]: " choice < /dev/tty
    case $choice in
        1) sync_specific_category "analytics" "push" ;;
        2) sync_specific_category "analytics" "pull" ;;
    esac
    
    # Charities
    echo ""
    echo -e "${CYAN}🏠 Charity files:${NC}"
    local local_charities=$(get_local_file_stats "$LOCAL_FILES_DIR/charities")
    local remote_charities=$(get_remote_file_stats "$REMOTE_FILES_DIR/charities")
    echo "   Local:  $local_charities"
    echo "   Remote: $remote_charities"
    echo ""
    echo "   1) Push local → remote"
    echo "   2) Pull remote → local"
    echo "   3) Skip"
    read -p "   Choice [1-3]: " choice < /dev/tty
    case $choice in
        1) sync_specific_category "charities" "push" ;;
        2) sync_specific_category "charities" "pull" ;;
    esac
    
    # Lessons
    echo ""
    echo -e "${CYAN}📚 Lesson files:${NC}"
    local local_lessons=$(get_local_file_stats "$LOCAL_FILES_DIR/lessons")
    local remote_lessons=$(get_remote_file_stats "$REMOTE_FILES_DIR/lessons")
    echo "   Local:  $local_lessons"
    echo "   Remote: $remote_lessons"
    echo ""
    echo "   1) Push local → remote"
    echo "   2) Pull remote → local"
    echo "   3) Skip"
    read -p "   Choice [1-3]: " choice < /dev/tty
    case $choice in
        1) sync_specific_category "lessons" "push" ;;
        2) sync_specific_category "lessons" "pull" ;;
    esac
    
    log ""
    log "${GREEN}✅ Interactive sync complete!${NC}"
}

# ============================================
# Menu functions
# ============================================

show_menu() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}🔄 File Sync Options${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Select sync action:${NC}"
    echo "1) Sync LOCAL → REMOTE (push all local files to server)"
    echo "2) Sync REMOTE → LOCAL (pull all server files to local)"
    echo "3) Interactive sync (choose per category)"
    echo "4) Compare files (show statistics)"
    echo "5) Exit"
    echo ""
    read -p "Enter your choice [1-5]: " SYNC_CHOICE < /dev/tty
    
    case $SYNC_CHOICE in
        1) sync_all_to_remote ;;
        2) sync_all_to_local ;;
        3) interactive_sync ;;
        4) 
            compare_directories
            show_menu
            ;;
        5) log "${YELLOW}⏭️  Exiting${NC}" ;;
        *) 
            log "${RED}❌ Invalid choice${NC}"
            show_menu
            ;;
    esac
}

# ============================================
# Main execution
# ============================================

main() {
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📁 WarRoom File Migration Tool${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    
    log "Started at: $(date)"
    log "Log file: $LOG_FILE"
    echo ""
    
    # Check VPN connection
    echo -e "${CYAN}Checking VPN connection...${NC}"
    if ! pgrep -x "openconnect" > /dev/null; then
        echo -e "${YELLOW}⚠️  VPN is not connected. Connecting now...${NC}"
        if [ -f "$SCRIPT_DIR/connect-vpn.sh" ]; then
            bash "$SCRIPT_DIR/connect-vpn.sh"
            sleep 3
        else
            echo -e "${RED}❌ Error: connect-vpn.sh not found and VPN not connected${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ VPN is connected${NC}"
    fi
    
    # Check sshpass
    if ! command -v sshpass &> /dev/null; then
        echo -e "${RED}❌ sshpass is required. Install with: brew install hudochenkov/sshpass/sshpass${NC}"
        exit 1
    fi
    
    # Check rsync
    if ! command -v rsync &> /dev/null; then
        echo -e "${RED}❌ rsync is required. Install with: brew install rsync${NC}"
        exit 1
    fi
    
    # Test SSH connection
    echo -e "${CYAN}Testing SSH connection to remote server...${NC}"
    if ! remote_exec "echo 'Connected'" > /dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to remote server${NC}"
        echo -e "${YELLOW}   SSH: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ SSH connection successful${NC}"
    
    # Compare and show menu
    compare_directories
    show_menu
    
    echo ""
    log "Completed at: $(date)"
    log "${BLUE}📁 Log file saved to: $LOG_FILE${NC}"
}

# Run main function
main "$@"

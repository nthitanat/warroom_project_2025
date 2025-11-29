#!/bin/bash
# ============================================
# Database Migration Script for WarRoom Project
# ============================================
# This script compares and syncs local and remote databases
# Remote database is accessed through SSH tunnel

# Don't use set -e as we handle errors manually
# set -e

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
LOG_FILE="$LOG_DIR/migration_$TIMESTAMP.log"
CONFLICT_FILE="$LOG_DIR/conflicts_$TIMESTAMP.log"

# Database credentials
LOCAL_DB_HOST="${DEV_DB_HOST:-localhost}"
LOCAL_DB_PORT="${DEV_DB_PORT:-3306}"
LOCAL_DB_USER="${DEV_DB_USER}"
LOCAL_DB_PASSWORD="${DEV_DB_PASSWORD}"
LOCAL_DB_NAME="${DEV_DB_NAME:-war_room_db}"

REMOTE_DB_HOST="127.0.0.1"
REMOTE_DB_PORT="3306"
REMOTE_DB_USER="${PROD_DB_USER:-war_room_db}"
REMOTE_DB_PASSWORD="${PROD_DB_PASSWORD}"
REMOTE_DB_NAME="${PROD_DB_NAME:-war_room_db}"

# Temp directories for comparison
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

LOCAL_SCHEMA_DIR="$TEMP_DIR/local_schema"
REMOTE_SCHEMA_DIR="$TEMP_DIR/remote_schema"

mkdir -p "$LOCAL_SCHEMA_DIR" "$REMOTE_SCHEMA_DIR"

# Global arrays to store comparison results
declare -a G_TABLES_ONLY_LOCAL=()
declare -a G_TABLES_ONLY_REMOTE=()
declare -a G_TABLES_SCHEMA_DIFF=()
declare -a G_TABLES_LOCAL_MORE=()
declare -a G_TABLES_REMOTE_MORE=()
declare -a G_TABLES_DATA_DIFF=()

# ============================================
# Logging functions
# ============================================
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_conflict() {
    echo -e "$1" >> "$CONFLICT_FILE"
}

# ============================================
# Database connection functions
# ============================================

# Execute local MySQL command
local_mysql() {
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" "$@" 2>/dev/null
}

# Execute remote MySQL command through SSH
remote_mysql_query() {
    local query="$1"
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PreferredAuthentications=password \
        -o PubkeyAuthentication=no \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -o BatchMode=no \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" \
        "mysql -h $REMOTE_DB_HOST -P $REMOTE_DB_PORT -u $REMOTE_DB_USER -p'$REMOTE_DB_PASSWORD' $REMOTE_DB_NAME -N -e \"$query\"" 2>/dev/null
}

# Execute remote MySQL from file
remote_mysql_file() {
    local file="$1"
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PreferredAuthentications=password \
        -o PubkeyAuthentication=no \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" \
        "mysql -h $REMOTE_DB_HOST -P $REMOTE_DB_PORT -u $REMOTE_DB_USER -p'$REMOTE_DB_PASSWORD' $REMOTE_DB_NAME < $file" 2>/dev/null
}

# ============================================
# Schema comparison functions
# ============================================

get_local_tables() {
    local_mysql -N -e "SHOW TABLES;"
}

get_remote_tables() {
    remote_mysql_query "SHOW TABLES;"
}

get_local_table_columns() {
    local table=$1
    local_mysql -N -e "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$LOCAL_DB_NAME' AND TABLE_NAME='$table' ORDER BY ORDINAL_POSITION;"
}

get_remote_table_columns() {
    local table=$1
    remote_mysql_query "SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, EXTRA FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='$REMOTE_DB_NAME' AND TABLE_NAME='$table' ORDER BY ORDINAL_POSITION;"
}

get_local_row_count() {
    local table=$1
    local_mysql -N -e "SELECT COUNT(*) FROM \`$table\`;"
}

get_remote_row_count() {
    local table=$1
    remote_mysql_query "SELECT COUNT(*) FROM \\\`$table\\\`;"
}

get_local_checksum() {
    local table=$1
    local_mysql -N -e "CHECKSUM TABLE \`$table\`;" | awk '{print $2}'
}

get_remote_checksum() {
    local table=$1
    remote_mysql_query "CHECKSUM TABLE \\\`$table\\\`;" | awk '{print $2}'
}

# ============================================
# Foreign key management functions
# ============================================

# Get all foreign key constraints from a database (with DELETE/UPDATE rules)
get_all_foreign_keys() {
    local is_local=$1
    
    # Query joins KEY_COLUMN_USAGE with REFERENTIAL_CONSTRAINTS to get DELETE/UPDATE rules
    local query="SELECT 
        k.CONSTRAINT_NAME, 
        k.TABLE_NAME, 
        k.COLUMN_NAME, 
        k.REFERENCED_TABLE_NAME, 
        k.REFERENCED_COLUMN_NAME,
        COALESCE(r.DELETE_RULE, 'CASCADE'),
        COALESCE(r.UPDATE_RULE, 'CASCADE')
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE k
    LEFT JOIN INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS r
        ON k.CONSTRAINT_NAME = r.CONSTRAINT_NAME 
        AND k.TABLE_SCHEMA = r.CONSTRAINT_SCHEMA
    WHERE k.TABLE_SCHEMA='%s' 
    AND k.REFERENCED_TABLE_NAME IS NOT NULL;"
    
    if [ "$is_local" == "true" ]; then
        local host="$LOCAL_DB_HOST"
        if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
            host="127.0.0.1"
        fi
        mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" \
            -N -e "$(printf "$query" "$LOCAL_DB_NAME")" 2>/dev/null
    else
        remote_mysql_query "$(printf "$query" "$REMOTE_DB_NAME")"
    fi
}

# Drop all foreign key constraints on remote
drop_all_remote_foreign_keys() {
    log "${YELLOW}🔓 Dropping all foreign key constraints on remote...${NC}"
    
    local fk_list=$(get_all_foreign_keys "false")
    local count=0
    
    if [ -z "$fk_list" ]; then
        log "${CYAN}   No foreign keys found${NC}"
        return
    fi
    
    # Save FK definitions for later restoration
    local fk_backup_file="$TEMP_DIR/fk_backup.sql"
    echo "-- Foreign Key Backup" > "$fk_backup_file"
    echo "SET FOREIGN_KEY_CHECKS=0;" >> "$fk_backup_file"
    
    while IFS=$'\t' read -r constraint_name table_name column_name ref_table ref_column; do
        [ -z "$constraint_name" ] && continue
        
        # Save the ADD CONSTRAINT statement for restoration
        echo "ALTER TABLE \`$table_name\` ADD CONSTRAINT \`$constraint_name\` FOREIGN KEY (\`$column_name\`) REFERENCES \`$ref_table\`(\`$ref_column\`) ON DELETE CASCADE ON UPDATE CASCADE;" >> "$fk_backup_file"
        
        # Drop the constraint
        log "${CYAN}   Dropping: $table_name.$constraint_name${NC}"
        remote_mysql_query "ALTER TABLE \\\`$table_name\\\` DROP FOREIGN KEY \\\`$constraint_name\\\`;" 2>/dev/null || true
        count=$((count + 1))
    done <<< "$fk_list"
    
    echo "SET FOREIGN_KEY_CHECKS=1;" >> "$fk_backup_file"
    
    log "${GREEN}✅ Dropped $count foreign key constraint(s)${NC}"
}

# Restore foreign keys from local schema to remote
restore_remote_foreign_keys_from_local() {
    log "${YELLOW}🔐 Restoring foreign key constraints on remote from local schema...${NC}"
    
    local fk_list=$(get_all_foreign_keys "true")
    local count=0
    local errors=0
    
    if [ -z "$fk_list" ]; then
        log "${CYAN}   No foreign keys to restore${NC}"
        return
    fi
    
    while IFS=$'\t' read -r constraint_name table_name column_name ref_table ref_column delete_rule update_rule; do
        [ -z "$constraint_name" ] && continue
        
        # Default rules if not provided
        delete_rule=${delete_rule:-CASCADE}
        update_rule=${update_rule:-CASCADE}
        
        log "${CYAN}   Adding: $table_name.$constraint_name → $ref_table($ref_column) [ON DELETE $delete_rule, ON UPDATE $update_rule]${NC}"
        
        # First try to drop if exists (in case of partial restore)
        remote_mysql_query "ALTER TABLE \\\`$table_name\\\` DROP FOREIGN KEY \\\`$constraint_name\\\`;" 2>/dev/null || true
        
        # Add the constraint with original DELETE/UPDATE rules
        local result
        result=$(remote_mysql_query "ALTER TABLE \\\`$table_name\\\` ADD CONSTRAINT \\\`$constraint_name\\\` FOREIGN KEY (\\\`$column_name\\\`) REFERENCES \\\`$ref_table\\\`(\\\`$ref_column\\\`) ON DELETE $delete_rule ON UPDATE $update_rule;" 2>&1)
        
        if [ $? -eq 0 ]; then
            count=$((count + 1))
        else
            log "${RED}   ❌ Failed to add $constraint_name: $result${NC}"
            errors=$((errors + 1))
        fi
    done <<< "$fk_list"
    
    if [ $errors -eq 0 ]; then
        log "${GREEN}✅ Restored $count foreign key constraint(s)${NC}"
    else
        log "${YELLOW}⚠️  Restored $count FK(s), $errors error(s)${NC}"
    fi
}

# Drop all foreign key constraints on local
drop_all_local_foreign_keys() {
    log "${YELLOW}🔓 Dropping all foreign key constraints on local...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    local fk_list=$(get_all_foreign_keys "true")
    local count=0
    
    if [ -z "$fk_list" ]; then
        log "${CYAN}   No foreign keys found${NC}"
        return
    fi
    
    while IFS=$'\t' read -r constraint_name table_name column_name ref_table ref_column; do
        [ -z "$constraint_name" ] && continue
        
        log "${CYAN}   Dropping: $table_name.$constraint_name${NC}"
        mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" \
            -e "ALTER TABLE \`$table_name\` DROP FOREIGN KEY \`$constraint_name\`;" 2>/dev/null || true
        count=$((count + 1))
    done <<< "$fk_list"
    
    log "${GREEN}✅ Dropped $count foreign key constraint(s)${NC}"
}

# Restore foreign keys from remote schema to local
restore_local_foreign_keys_from_remote() {
    log "${YELLOW}🔐 Restoring foreign key constraints on local from remote schema...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    local fk_list=$(get_all_foreign_keys "false")
    local count=0
    local errors=0
    
    if [ -z "$fk_list" ]; then
        log "${CYAN}   No foreign keys to restore${NC}"
        return
    fi
    
    while IFS=$'\t' read -r constraint_name table_name column_name ref_table ref_column delete_rule update_rule; do
        [ -z "$constraint_name" ] && continue
        
        # Default rules if not provided
        delete_rule=${delete_rule:-CASCADE}
        update_rule=${update_rule:-CASCADE}
        
        log "${CYAN}   Adding: $table_name.$constraint_name → $ref_table($ref_column) [ON DELETE $delete_rule, ON UPDATE $update_rule]${NC}"
        
        # First try to drop if exists
        mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" \
            -e "ALTER TABLE \`$table_name\` DROP FOREIGN KEY \`$constraint_name\`;" 2>/dev/null || true
        
        # Add the constraint with original DELETE/UPDATE rules
        if mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" \
            -e "ALTER TABLE \`$table_name\` ADD CONSTRAINT \`$constraint_name\` FOREIGN KEY (\`$column_name\`) REFERENCES \`$ref_table\`(\`$ref_column\`) ON DELETE $delete_rule ON UPDATE $update_rule;" 2>/dev/null; then
            count=$((count + 1))
        else
            log "${RED}   ❌ Failed to add $constraint_name${NC}"
            errors=$((errors + 1))
        fi
    done <<< "$fk_list"
    
    if [ $errors -eq 0 ]; then
        log "${GREEN}✅ Restored $count foreign key constraint(s)${NC}"
    else
        log "${YELLOW}⚠️  Restored $count FK(s), $errors error(s)${NC}"
    fi
}

# ============================================
# Foreign key dependency functions
# ============================================

# Get foreign key dependencies for a table
get_table_foreign_keys() {
    local table=$1
    local is_local=$2
    
    if [ "$is_local" == "true" ]; then
        local host="$LOCAL_DB_HOST"
        if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
            host="127.0.0.1"
        fi
        mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" \
            -N -e "SELECT REFERENCED_TABLE_NAME 
                   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                   WHERE TABLE_SCHEMA='$LOCAL_DB_NAME' 
                   AND TABLE_NAME='$table' 
                   AND REFERENCED_TABLE_NAME IS NOT NULL;" 2>/dev/null
    else
        remote_mysql_query "SELECT REFERENCED_TABLE_NAME 
                           FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                           WHERE TABLE_SCHEMA='$REMOTE_DB_NAME' 
                           AND TABLE_NAME='$table' 
                           AND REFERENCED_TABLE_NAME IS NOT NULL;"
    fi
}

# Topological sort of tables based on foreign key dependencies
sort_tables_by_dependencies() {
    local -a input_tables=("$@")
    local -a sorted_tables=()
    local -a remaining_tables=("${input_tables[@]}")
    local max_iterations=100
    local iteration=0
    
    # Build dependency map using files instead of associative arrays
    local dep_dir="$TEMP_DIR/dependencies"
    mkdir -p "$dep_dir"
    for table in "${input_tables[@]}"; do
        local deps=$(get_table_foreign_keys "$table" "true")
        echo "$deps" > "$dep_dir/$table.deps"
    done
    
    # Sort tables - add tables with no dependencies first
    while [ ${#remaining_tables[@]} -gt 0 ] && [ $iteration -lt $max_iterations ]; do
        iteration=$((iteration + 1))
        local -a next_remaining=()
        local made_progress=false
        
        for table in "${remaining_tables[@]}"; do
            local can_add=true
            local table_deps=""
            if [ -f "$dep_dir/$table.deps" ]; then
                table_deps=$(cat "$dep_dir/$table.deps")
            fi
            
            # Check if all dependencies are already in sorted list
            if [ -n "$table_deps" ]; then
                while IFS= read -r dep; do
                    [ -z "$dep" ] && continue
                    
                    # Check if dependency is in sorted_tables
                    local dep_found=false
                    for sorted in "${sorted_tables[@]}"; do
                        if [ "$sorted" == "$dep" ]; then
                            dep_found=true
                            break
                        fi
                    done
                    
                    # If dependency not found in sorted list and is in input tables, can't add yet
                    if ! $dep_found; then
                        local dep_in_input=false
                        for input in "${input_tables[@]}"; do
                            if [ "$input" == "$dep" ]; then
                                dep_in_input=true
                                break
                            fi
                        done
                        
                        if $dep_in_input; then
                            can_add=false
                            break
                        fi
                    fi
                done <<< "$table_deps"
            fi
            
            if $can_add; then
                sorted_tables+=("$table")
                made_progress=true
            else
                next_remaining+=("$table")
            fi
        done
        
        remaining_tables=("${next_remaining[@]}")
        
        # If no progress was made, we might have circular dependencies
        # Add remaining tables anyway to avoid infinite loop
        if ! $made_progress && [ ${#remaining_tables[@]} -gt 0 ]; then
            log "${YELLOW}⚠️  Warning: Possible circular dependency detected. Adding remaining tables.${NC}"
            sorted_tables+=("${remaining_tables[@]}")
            break
        fi
    done
    
    # Return sorted tables
    printf "%s\n" "${sorted_tables[@]}"
}

# ============================================
# Sync functions
# ============================================

sync_table_to_remote() {
    local table=$1
    local full_sync=${2:-true}  # If true, delete all rows first (handles deleted rows)
    log "${YELLOW}📤 Syncing table '$table' data to remote...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    # Export local table data with proper options
    local dump_file="$TEMP_DIR/${table}_dump.sql"
    
    # Start with FK check disable and optional DELETE
    echo "SET FOREIGN_KEY_CHECKS=0;" > "$dump_file"
    echo "SET NAMES utf8mb4;" >> "$dump_file"
    
    # For full sync, delete existing data first (handles deleted rows)
    if [ "$full_sync" == "true" ]; then
        echo "DELETE FROM \`$table\`;" >> "$dump_file"
    fi
    
    # Dump with proper options:
    # --single-transaction: Consistent snapshot without locking
    # --quick: Don't buffer entire table in memory
    # --default-character-set: Handle UTF8 properly
    # --hex-blob: Handle binary data properly
    mysqldump -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" \
        --no-create-info \
        --single-transaction \
        --quick \
        --default-character-set=utf8mb4 \
        --hex-blob \
        --skip-triggers \
        "$LOCAL_DB_NAME" "$table" >> "$dump_file" 2>/dev/null
    
    echo "SET FOREIGN_KEY_CHECKS=1;" >> "$dump_file"
    
    # Check if dump has actual INSERT statements
    if ! grep -q "INSERT INTO" "$dump_file" && [ "$full_sync" != "true" ]; then
        log "${YELLOW}   Table '$table' is empty, skipping data sync${NC}"
        return
    fi
    
    # Upload to remote
    sshpass -p "$REMOTE_PASSWORD" scp -P "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        "$dump_file" "$REMOTE_USER@$REMOTE_HOST:/tmp/${table}_dump.sql" 2>/dev/null
    
    # Import to remote
    remote_mysql_file "/tmp/${table}_dump.sql"
    
    # Cleanup remote
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" "rm -f /tmp/${table}_dump.sql" 2>/dev/null
    
    log "${GREEN}✅ Table '$table' data synced to remote${NC}"
}

sync_table_to_local() {
    local table=$1
    local full_sync=${2:-true}  # If true, delete all rows first (handles deleted rows)
    log "${YELLOW}📥 Syncing table '$table' data to local...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    # Export remote table data through SSH with proper options
    local dump_file="$TEMP_DIR/${table}_remote_dump.sql"
    local header_file="$TEMP_DIR/${table}_header.sql"
    
    # Create header with FK check disable and optional DELETE
    echo "SET FOREIGN_KEY_CHECKS=0;" > "$header_file"
    echo "SET NAMES utf8mb4;" >> "$header_file"
    if [ "$full_sync" == "true" ]; then
        echo "DELETE FROM \`$table\`;" >> "$header_file"
    fi
    
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" \
        "mysqldump -h $REMOTE_DB_HOST -P $REMOTE_DB_PORT -u $REMOTE_DB_USER -p'$REMOTE_DB_PASSWORD' \
        --no-create-info \
        --single-transaction \
        --quick \
        --default-character-set=utf8mb4 \
        --hex-blob \
        --skip-triggers \
        $REMOTE_DB_NAME $table" > "$dump_file" 2>/dev/null
    
    # Combine header and dump
    local final_file="$TEMP_DIR/${table}_final.sql"
    cat "$header_file" "$dump_file" > "$final_file"
    echo "SET FOREIGN_KEY_CHECKS=1;" >> "$final_file"
    
    # Import to local
    if [ -s "$dump_file" ] || [ "$full_sync" == "true" ]; then
        mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" < "$final_file" 2>/dev/null
        log "${GREEN}✅ Table '$table' data synced to local${NC}"
    else
        log "${YELLOW}   Table '$table' is empty on remote${NC}"
    fi
}

sync_schema_to_remote() {
    local table=$1
    log "${YELLOW}📤 Syncing table schema '$table' to remote...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    # Export local table schema
    local schema_file="$TEMP_DIR/${table}_schema.sql"
    local error_file="$TEMP_DIR/${table}_schema_error.log"
    
    # Add foreign key check disable at start of file
    echo "SET FOREIGN_KEY_CHECKS=0;" > "$schema_file"
    mysqldump -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" \
        --no-data "$LOCAL_DB_NAME" "$table" >> "$schema_file" 2>/dev/null
    echo "SET FOREIGN_KEY_CHECKS=1;" >> "$schema_file"
    
    # Upload to remote
    sshpass -p "$REMOTE_PASSWORD" scp -P "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        "$schema_file" "$REMOTE_USER@$REMOTE_HOST:/tmp/${table}_schema.sql" 2>/dev/null
    
    # Drop existing table first (with FK checks disabled)
    remote_mysql_query "SET FOREIGN_KEY_CHECKS=0; DROP TABLE IF EXISTS \\\`$table\\\`; SET FOREIGN_KEY_CHECKS=1;"
    
    # Execute the schema file and capture errors
    local remote_result
    remote_result=$(sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o PreferredAuthentications=password \
        -o PubkeyAuthentication=no \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" \
        "mysql -h $REMOTE_DB_HOST -P $REMOTE_DB_PORT -u $REMOTE_DB_USER -p'$REMOTE_DB_PASSWORD' $REMOTE_DB_NAME < /tmp/${table}_schema.sql 2>&1")
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        log "${GREEN}✅ Table schema '$table' synced to remote${NC}"
    else
        log "${RED}❌ Failed to sync schema for '$table' to remote${NC}"
        if [ -n "$remote_result" ]; then
            log "${RED}   Error details:${NC}"
            echo "$remote_result" | while IFS= read -r line; do
                log "${RED}   $line${NC}"
            done
        fi
        
        # Check for foreign key errors
        if echo "$remote_result" | grep -qi "foreign key\|constraint"; then
            log "${YELLOW}   💡 Hint: This table may depend on other tables that need to be synced first${NC}"
            
            # Show what this table depends on
            local deps=$(get_table_foreign_keys "$table" "true")
            if [ -n "$deps" ]; then
                log "${YELLOW}   Dependencies found:${NC}"
                echo "$deps" | while IFS= read -r dep; do
                    [ -n "$dep" ] && log "${YELLOW}      → $dep${NC}"
                done
            fi
        fi
    fi
    
    # Cleanup remote
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" "rm -f /tmp/${table}_schema.sql" 2>/dev/null
}

sync_schema_to_local() {
    local table=$1
    log "${YELLOW}📥 Syncing table schema '$table' to local...${NC}"
    
    local host="$LOCAL_DB_HOST"
    if [[ "$LOCAL_DB_HOST" == "host.docker.internal" ]]; then
        host="127.0.0.1"
    fi
    
    # Export remote table schema through SSH
    local schema_file="$TEMP_DIR/${table}_remote_schema.sql"
    sshpass -p "$REMOTE_PASSWORD" ssh -p "$REMOTE_PORT" \
        -o StrictHostKeyChecking=no \
        -o UserKnownHostsFile=/dev/null \
        -o LogLevel=ERROR \
        -o ServerAliveInterval=60 \
        -n \
        "$REMOTE_USER@$REMOTE_HOST" \
        "mysqldump -h $REMOTE_DB_HOST -P $REMOTE_DB_PORT -u $REMOTE_DB_USER -p'$REMOTE_DB_PASSWORD' \
        --no-data $REMOTE_DB_NAME $table" > "$schema_file" 2>/dev/null
    
    # Drop existing table and recreate locally
    mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" \
        -e "DROP TABLE IF EXISTS \`$table\`;" 2>/dev/null
    mysql -h "$host" -P "$LOCAL_DB_PORT" -u "$LOCAL_DB_USER" -p"$LOCAL_DB_PASSWORD" "$LOCAL_DB_NAME" \
        < "$schema_file" 2>/dev/null
    
    log "${GREEN}✅ Table schema '$table' synced to local${NC}"
}

# ============================================
# Main comparison and sync logic
# ============================================

compare_schemas() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}📊 Step 1: Comparing Table Structures${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    
    # Reset global arrays
    G_TABLES_ONLY_LOCAL=()
    G_TABLES_ONLY_REMOTE=()
    G_TABLES_SCHEMA_DIFF=()
    
    # Get table lists
    log "${CYAN}Fetching local tables...${NC}"
    local local_tables_str=$(get_local_tables)
    local -a local_tables=()
    while IFS= read -r line; do
        [ -n "$line" ] && local_tables+=("$line")
    done <<< "$local_tables_str"
    
    log "${CYAN}Fetching remote tables...${NC}"
    local remote_tables_str=$(get_remote_tables)
    local -a remote_tables=()
    while IFS= read -r line; do
        [ -n "$line" ] && remote_tables+=("$line")
    done <<< "$remote_tables_str"
    
    log "Local tables: ${#local_tables[@]} (${local_tables[*]})"
    log "Remote tables: ${#remote_tables[@]} (${remote_tables[*]})"
    
    # Find tables only in local
    for table in "${local_tables[@]}"; do
        local found=false
        for rtable in "${remote_tables[@]}"; do
            if [ "$table" == "$rtable" ]; then
                found=true
                break
            fi
        done
        if ! $found; then
            G_TABLES_ONLY_LOCAL+=("$table")
        fi
    done
    
    # Find tables only in remote
    for table in "${remote_tables[@]}"; do
        local found=false
        for ltable in "${local_tables[@]}"; do
            if [ "$table" == "$ltable" ]; then
                found=true
                break
            fi
        done
        if ! $found; then
            G_TABLES_ONLY_REMOTE+=("$table")
        fi
    done
    
    # Compare schema of common tables
    for table in "${local_tables[@]}"; do
        local found=false
        for rtable in "${remote_tables[@]}"; do
            if [ "$table" == "$rtable" ]; then
                found=true
                break
            fi
        done
        
        if $found; then
            log "${CYAN}Comparing schema for table: $table${NC}"
            
            local local_cols=$(get_local_table_columns "$table")
            local remote_cols=$(get_remote_table_columns "$table")
            
            echo "$local_cols" > "$LOCAL_SCHEMA_DIR/${table}.cols"
            echo "$remote_cols" > "$REMOTE_SCHEMA_DIR/${table}.cols"
            
            if ! diff -q "$LOCAL_SCHEMA_DIR/${table}.cols" "$REMOTE_SCHEMA_DIR/${table}.cols" > /dev/null 2>&1; then
                G_TABLES_SCHEMA_DIFF+=("$table")
            fi
        fi
    done
    
    # Report findings
    log ""
    if [ ${#G_TABLES_ONLY_LOCAL[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables only in LOCAL:${NC}"
        for table in "${G_TABLES_ONLY_LOCAL[@]}"; do
            log "   - $table"
            log_conflict "TABLE_ONLY_LOCAL: $table"
        done
    fi
    
    if [ ${#G_TABLES_ONLY_REMOTE[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables only in REMOTE:${NC}"
        for table in "${G_TABLES_ONLY_REMOTE[@]}"; do
            log "   - $table"
            log_conflict "TABLE_ONLY_REMOTE: $table"
        done
    fi
    
    if [ ${#G_TABLES_SCHEMA_DIFF[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables with different schema:${NC}"
        for table in "${G_TABLES_SCHEMA_DIFF[@]}"; do
            log "   - $table"
            log_conflict "SCHEMA_MISMATCH: $table"
            log "${CYAN}   Local columns:${NC}"
            while IFS= read -r line; do
                log "      $line"
            done < "$LOCAL_SCHEMA_DIR/${table}.cols"
            log "${CYAN}   Remote columns:${NC}"
            while IFS= read -r line; do
                log "      $line"
            done < "$REMOTE_SCHEMA_DIR/${table}.cols"
        done
    fi
    
    if [ ${#G_TABLES_ONLY_LOCAL[@]} -eq 0 ] && [ ${#G_TABLES_ONLY_REMOTE[@]} -eq 0 ] && [ ${#G_TABLES_SCHEMA_DIFF[@]} -eq 0 ]; then
        log "${GREEN}✅ All table schemas match!${NC}"
    fi
}

compare_data() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}📊 Step 2: Comparing Table Data${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    
    # Reset global arrays
    G_TABLES_LOCAL_MORE=()
    G_TABLES_REMOTE_MORE=()
    G_TABLES_DATA_DIFF=()
    
    # Get common tables (tables that exist in both)
    local local_tables_str=$(get_local_tables)
    local remote_tables_str=$(get_remote_tables)
    
    local -a local_tables=()
    while IFS= read -r line; do
        [ -n "$line" ] && local_tables+=("$line")
    done <<< "$local_tables_str"
    
    local -a remote_tables=()
    while IFS= read -r line; do
        [ -n "$line" ] && remote_tables+=("$line")
    done <<< "$remote_tables_str"
    
    for table in "${local_tables[@]}"; do
        # Check if table exists in remote
        local found=false
        for rtable in "${remote_tables[@]}"; do
            if [ "$table" == "$rtable" ]; then
                found=true
                break
            fi
        done
        
        if $found; then
            log "${CYAN}Comparing data for table: $table${NC}"
            
            local local_count=$(get_local_row_count "$table")
            local remote_count=$(get_remote_row_count "$table")
            
            # Trim whitespace
            local_count=$(echo "$local_count" | tr -d '[:space:]')
            remote_count=$(echo "$remote_count" | tr -d '[:space:]')
            
            log "   Local rows: $local_count, Remote rows: $remote_count"
            
            if [ "$local_count" != "$remote_count" ]; then
                if [ "$local_count" -gt "$remote_count" ] 2>/dev/null; then
                    G_TABLES_LOCAL_MORE+=("$table:$local_count:$remote_count")
                else
                    G_TABLES_REMOTE_MORE+=("$table:$local_count:$remote_count")
                fi
            else
                # Compare checksums if row counts match
                local local_checksum=$(get_local_checksum "$table")
                local remote_checksum=$(get_remote_checksum "$table")
                
                if [ "$local_checksum" != "$remote_checksum" ]; then
                    G_TABLES_DATA_DIFF+=("$table")
                fi
            fi
        fi
    done
    
    # Report findings
    log ""
    if [ ${#G_TABLES_LOCAL_MORE[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables with MORE rows in LOCAL:${NC}"
        for entry in "${G_TABLES_LOCAL_MORE[@]}"; do
            IFS=':' read -r table local_count remote_count <<< "$entry"
            log "   - $table (local: $local_count, remote: $remote_count)"
            log_conflict "DATA_LOCAL_MORE: $table (local: $local_count, remote: $remote_count)"
        done
    fi
    
    if [ ${#G_TABLES_REMOTE_MORE[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables with MORE rows in REMOTE:${NC}"
        for entry in "${G_TABLES_REMOTE_MORE[@]}"; do
            IFS=':' read -r table local_count remote_count <<< "$entry"
            log "   - $table (local: $local_count, remote: $remote_count)"
            log_conflict "DATA_REMOTE_MORE: $table (local: $local_count, remote: $remote_count)"
        done
    fi
    
    if [ ${#G_TABLES_DATA_DIFF[@]} -gt 0 ]; then
        log "${YELLOW}⚠️  Tables with DIFFERENT data (same row count):${NC}"
        for table in "${G_TABLES_DATA_DIFF[@]}"; do
            log "   - $table"
            log_conflict "DATA_MISMATCH: $table"
        done
    fi
    
    if [ ${#G_TABLES_LOCAL_MORE[@]} -eq 0 ] && [ ${#G_TABLES_REMOTE_MORE[@]} -eq 0 ] && [ ${#G_TABLES_DATA_DIFF[@]} -eq 0 ]; then
        log "${GREEN}✅ All table data matches!${NC}"
    fi
}

# ============================================
# Sync menu and actions
# ============================================

show_sync_menu() {
    # Check if there are any differences
    local has_diff=false
    [ ${#G_TABLES_ONLY_LOCAL[@]} -gt 0 ] && has_diff=true
    [ ${#G_TABLES_ONLY_REMOTE[@]} -gt 0 ] && has_diff=true
    [ ${#G_TABLES_SCHEMA_DIFF[@]} -gt 0 ] && has_diff=true
    [ ${#G_TABLES_LOCAL_MORE[@]} -gt 0 ] && has_diff=true
    [ ${#G_TABLES_REMOTE_MORE[@]} -gt 0 ] && has_diff=true
    [ ${#G_TABLES_DATA_DIFF[@]} -gt 0 ] && has_diff=true
    
    if ! $has_diff; then
        log ""
        log "${GREEN}═══════════════════════════════════════════════${NC}"
        log "${GREEN}✅ Databases are fully synchronized!${NC}"
        log "${GREEN}═══════════════════════════════════════════════${NC}"
        return
    fi
    
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}🔄 Sync Options${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}Select sync action:${NC}"
    echo "1) Sync LOCAL → REMOTE (push local changes to server)"
    echo "2) Sync REMOTE → LOCAL (pull server changes to local)"
    echo "3) Interactive sync (choose per table)"
    echo "4) View detailed diff"
    echo "5) Exit without syncing"
    echo ""
    read -p "Enter your choice [1-5]: " SYNC_CHOICE < /dev/tty
    
    case $SYNC_CHOICE in
        1) sync_local_to_remote ;;
        2) sync_remote_to_local ;;
        3) interactive_sync ;;
        4) 
            show_detailed_diff
            show_sync_menu
            ;;
        5) log "${YELLOW}⏭️  Exiting without sync${NC}" ;;
        *) log "${RED}❌ Invalid choice${NC}" ;;
    esac
}

sync_local_to_remote() {
    log ""
    log "${BLUE}📤 Syncing LOCAL → REMOTE...${NC}"
    
    # Step 1: Drop all foreign keys on remote to avoid constraint issues
    drop_all_remote_foreign_keys
    
    # Collect all tables that need schema/data sync
    local -a all_tables_to_sync=()
    
    # Add tables only in local
    for table in "${G_TABLES_ONLY_LOCAL[@]}"; do
        all_tables_to_sync+=("$table")
    done
    
    # Add tables with schema differences
    for table in "${G_TABLES_SCHEMA_DIFF[@]}"; do
        # Check if not already in list
        local found=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                found=true
                break
            fi
        done
        if ! $found; then
            all_tables_to_sync+=("$table")
        fi
    done
    
    # Sync schema changes (no need for dependency order now - FKs are dropped)
    if [ ${#all_tables_to_sync[@]} -gt 0 ]; then
        log "${CYAN}Tables to sync schema:${NC}"
        for table in "${all_tables_to_sync[@]}"; do
            log "   → $table"
        done
        log ""
        
        for table in "${all_tables_to_sync[@]}"; do
            # Check if it's a new table (only in local)
            local is_new=false
            for t in "${G_TABLES_ONLY_LOCAL[@]}"; do
                if [ "$t" == "$table" ]; then
                    is_new=true
                    break
                fi
            done
            
            if $is_new; then
                log "${YELLOW}Creating table '$table' on remote...${NC}"
                sync_schema_to_remote "$table"
                sync_table_to_remote "$table"
            else
                log "${YELLOW}Updating schema for '$table' on remote...${NC}"
                sync_schema_to_remote "$table"
                sync_table_to_remote "$table"
            fi
        done
    fi
    
    # Sync data differences for tables with matching schemas
    for entry in "${G_TABLES_LOCAL_MORE[@]}"; do
        table=$(echo "$entry" | cut -d: -f1)
        # Only sync if not already synced above
        local already_synced=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                already_synced=true
                break
            fi
        done
        if ! $already_synced; then
            sync_table_to_remote "$table"
        fi
    done
    
    for table in "${G_TABLES_DATA_DIFF[@]}"; do
        # Only sync if not already synced above
        local already_synced=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                already_synced=true
                break
            fi
        done
        if ! $already_synced; then
            sync_table_to_remote "$table"
        fi
    done
    
    # Step 2: Restore foreign keys from local schema
    restore_remote_foreign_keys_from_local
    
    log "${GREEN}✅ Sync LOCAL → REMOTE complete!${NC}"
}

sync_remote_to_local() {
    log ""
    log "${BLUE}📥 Syncing REMOTE → LOCAL...${NC}"
    
    # Step 1: Drop all foreign keys on local to avoid constraint issues
    drop_all_local_foreign_keys
    
    # Collect all tables that need schema/data sync
    local -a all_tables_to_sync=()
    
    # Add tables only in remote
    for table in "${G_TABLES_ONLY_REMOTE[@]}"; do
        all_tables_to_sync+=("$table")
    done
    
    # Add tables with schema differences
    for table in "${G_TABLES_SCHEMA_DIFF[@]}"; do
        # Check if not already in list
        local found=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                found=true
                break
            fi
        done
        if ! $found; then
            all_tables_to_sync+=("$table")
        fi
    done
    
    # Sync schema changes (no need for dependency order now - FKs are dropped)
    if [ ${#all_tables_to_sync[@]} -gt 0 ]; then
        log "${CYAN}Tables to sync schema:${NC}"
        for table in "${all_tables_to_sync[@]}"; do
            log "   → $table"
        done
        log ""
        
        for table in "${all_tables_to_sync[@]}"; do
            # Check if it's a new table (only in remote)
            local is_new=false
            for t in "${G_TABLES_ONLY_REMOTE[@]}"; do
                if [ "$t" == "$table" ]; then
                    is_new=true
                    break
                fi
            done
            
            if $is_new; then
                log "${YELLOW}Creating table '$table' locally...${NC}"
                sync_schema_to_local "$table"
                sync_table_to_local "$table"
            else
                log "${YELLOW}Updating schema for '$table' locally...${NC}"
                sync_schema_to_local "$table"
                sync_table_to_local "$table"
            fi
        done
    fi
    
    # Sync data differences for tables with matching schemas
    for entry in "${G_TABLES_REMOTE_MORE[@]}"; do
        table=$(echo "$entry" | cut -d: -f1)
        # Only sync if not already synced above
        local already_synced=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                already_synced=true
                break
            fi
        done
        if ! $already_synced; then
            sync_table_to_local "$table"
        fi
    done
    
    for table in "${G_TABLES_DATA_DIFF[@]}"; do
        # Only sync if not already synced above
        local already_synced=false
        for t in "${all_tables_to_sync[@]}"; do
            if [ "$t" == "$table" ]; then
                already_synced=true
                break
            fi
        done
        if ! $already_synced; then
            sync_table_to_local "$table"
        fi
    done
    
    # Step 2: Restore foreign keys from remote schema
    restore_local_foreign_keys_from_remote
    
    log "${GREEN}✅ Sync REMOTE → LOCAL complete!${NC}"
}

interactive_sync() {
    log ""
    log "${BLUE}🔄 Interactive Sync Mode${NC}"
    
    # Tables only in local
    for table in "${G_TABLES_ONLY_LOCAL[@]}"; do
        echo ""
        echo -e "${YELLOW}Table '$table' exists only in LOCAL${NC}"
        echo "  1) Push to remote"
        echo "  2) Delete from local"
        echo "  3) Skip"
        read -p "  Choice [1-3]: " choice < /dev/tty
        case $choice in
            1)
                sync_schema_to_remote "$table"
                sync_table_to_remote "$table"
                ;;
            2)
                local_mysql -e "DROP TABLE IF EXISTS \`$table\`;"
                log "${GREEN}✅ Table '$table' deleted from local${NC}"
                ;;
        esac
    done
    
    # Tables only in remote
    for table in "${G_TABLES_ONLY_REMOTE[@]}"; do
        echo ""
        echo -e "${YELLOW}Table '$table' exists only in REMOTE${NC}"
        echo "  1) Pull to local"
        echo "  2) Delete from remote"
        echo "  3) Skip"
        read -p "  Choice [1-3]: " choice < /dev/tty
        case $choice in
            1)
                sync_schema_to_local "$table"
                sync_table_to_local "$table"
                ;;
            2)
                remote_mysql_query "DROP TABLE IF EXISTS \\\`$table\\\`;"
                log "${GREEN}✅ Table '$table' deleted from remote${NC}"
                ;;
        esac
    done
    
    # Tables with schema diff
    for table in "${G_TABLES_SCHEMA_DIFF[@]}"; do
        echo ""
        echo -e "${YELLOW}Table '$table' has different schema${NC}"
        echo "  1) Push local schema → remote"
        echo "  2) Pull remote schema → local"
        echo "  3) Skip"
        read -p "  Choice [1-3]: " choice < /dev/tty
        case $choice in
            1)
                sync_schema_to_remote "$table"
                sync_table_to_remote "$table"
                ;;
            2)
                sync_schema_to_local "$table"
                sync_table_to_local "$table"
                ;;
        esac
    done
    
    # Tables with data differences
    declare -A processed_tables
    
    for entry in "${G_TABLES_LOCAL_MORE[@]}" "${G_TABLES_REMOTE_MORE[@]}"; do
        [ -z "$entry" ] && continue
        table=$(echo "$entry" | cut -d: -f1)
        
        # Skip if already processed
        [ "${processed_tables[$table]}" == "1" ] && continue
        processed_tables[$table]=1
        
        local local_count=$(get_local_row_count "$table" | tr -d '[:space:]')
        local remote_count=$(get_remote_row_count "$table" | tr -d '[:space:]')
        
        echo ""
        echo -e "${YELLOW}Table '$table' has different row counts${NC}"
        echo "  Local: $local_count rows, Remote: $remote_count rows"
        echo "  1) Push local → remote"
        echo "  2) Pull remote → local"
        echo "  3) Skip"
        read -p "  Choice [1-3]: " choice < /dev/tty
        case $choice in
            1) sync_table_to_remote "$table" ;;
            2) sync_table_to_local "$table" ;;
        esac
    done
    
    for table in "${G_TABLES_DATA_DIFF[@]}"; do
        [ "${processed_tables[$table]}" == "1" ] && continue
        processed_tables[$table]=1
        
        echo ""
        echo -e "${YELLOW}Table '$table' has different data (same row count)${NC}"
        echo "  1) Push local → remote"
        echo "  2) Pull remote → local"
        echo "  3) Skip"
        read -p "  Choice [1-3]: " choice < /dev/tty
        case $choice in
            1) sync_table_to_remote "$table" ;;
            2) sync_table_to_local "$table" ;;
        esac
    done
    
    log "${GREEN}✅ Interactive sync complete!${NC}"
}

show_detailed_diff() {
    log ""
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    log "${BLUE}📋 Detailed Schema Differences${NC}"
    log "${BLUE}═══════════════════════════════════════════════${NC}"
    
    for table in "${G_TABLES_SCHEMA_DIFF[@]}"; do
        log ""
        log "${YELLOW}Table: $table${NC}"
        log "${CYAN}--- LOCAL ---${NC}"
        while IFS= read -r line; do
            log "  $line"
        done < "$LOCAL_SCHEMA_DIR/${table}.cols"
        log "${CYAN}--- REMOTE ---${NC}"
        while IFS= read -r line; do
            log "  $line"
        done < "$REMOTE_SCHEMA_DIR/${table}.cols"
        log ""
        log "${CYAN}--- DIFF ---${NC}"
        diff "$LOCAL_SCHEMA_DIR/${table}.cols" "$REMOTE_SCHEMA_DIR/${table}.cols" | while IFS= read -r line; do
            log "  $line"
        done || true
    done
}

# ============================================
# Main execution
# ============================================

main() {
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🗄️  WarRoom Database Migration Tool${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    
    log "Started at: $(date)"
    log "Log file: $LOG_FILE"
    log "Conflict file: $CONFLICT_FILE"
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
    
    # Test connections
    echo ""
    echo -e "${CYAN}Testing local database connection...${NC}"
    if ! local_mysql -e "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to local database${NC}"
        echo -e "${YELLOW}   Host: $LOCAL_DB_HOST:$LOCAL_DB_PORT${NC}"
        echo -e "${YELLOW}   User: $LOCAL_DB_USER${NC}"
        echo -e "${YELLOW}   Database: $LOCAL_DB_NAME${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Local database connected${NC}"
    
    echo -e "${CYAN}Testing remote database connection...${NC}"
    if ! remote_mysql_query "SELECT 1;" > /dev/null 2>&1; then
        echo -e "${RED}❌ Cannot connect to remote database${NC}"
        echo -e "${YELLOW}   SSH: $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT${NC}"
        echo -e "${YELLOW}   MySQL: $REMOTE_DB_USER@$REMOTE_DB_HOST:$REMOTE_DB_PORT${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Remote database connected${NC}"
    
    # Compare schemas
    compare_schemas
    
    # Compare data
    compare_data
    
    # Show sync menu
    show_sync_menu
    
    echo ""
    log "Completed at: $(date)"
    log "${BLUE}📁 Log files saved to: $LOG_DIR${NC}"
}

# Run main function
main "$@"

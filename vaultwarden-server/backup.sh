#!/usr/bin/env bash
# ==============================================================================
# Vaultwarden - Minimal Downtime Rclone Backup (Cron-Safe Version)
# ==============================================================================

# Fail completely if any command fails, a variable is unset, or a pipe fails
set -euo pipefail

# ==============================================================================
# CRON ENVIRONMENT FIXES
# ==============================================================================
# 1. Ensure Cron knows where to find binaries (docker, rclone, rsync, tar, etc.)
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# 2. Force Rclone to find your non-root configuration file
export RCLONE_CONFIG="/home/sidhartha426/.config/rclone/rclone.conf"

# ==============================================================================
# CONFIGURATION
# ==============================================================================
USER_NAME="sidhartha426"
DOCKER_DIR="/home/${USER_NAME}/vaultwarden"    # Directory containing docker-compose.yml
VW_DATA_DIR="${DOCKER_DIR}/vw-data"            # Vaultwarden mounted data folder
DB_FILE="${VW_DATA_DIR}/db.sqlite3"


# Staging & Archiving (User-specific to avoid /tmp permission collisions)
STAGE_DIR="/tmp/${USER_NAME}_vw_backup_staging"
ARCHIVE_DIR="/tmp/${USER_NAME}_vw_archives"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="vw_backup_${TIMESTAMP}.tar.gz"
ARCHIVE_PATH="${ARCHIVE_DIR}/${ARCHIVE_NAME}"


# Rclone Settings
RCLONE_REMOTE="gdrive-crypt-swain.nana66"      # The name of your rclone remote
RCLONE_DEST="/backups/vaultwarden"             # The destination path on the remote
RETENTION_DAYS=5                              # How many days to keep old backups


LOG_FILE="${DOCKER_DIR}/vw_backup.log"


# Redirect all output to log file and stdout (Requires bash process substitution)
#exec > >(tee "$LOG_FILE") 2>&1  #disable to prevent race condition

exec > "$LOG_FILE" 2>&1

echo "========================================================"
echo "Backup Started: ${TIMESTAMP}"
echo "========================================================"

# Prepare temporary directories
mkdir -p "${STAGE_DIR}/vw-data"
mkdir -p "$ARCHIVE_DIR"

# 1. Hot Sync (Bulk of the work, zero downtime)
echo "[1/8] Pre-syncing data (Hot)..."
rsync -a --delete "${VW_DATA_DIR}/" "${STAGE_DIR}/vw-data/"

# 2. Stop Container (State tracking applied)
cd "$DOCKER_DIR"
CONTAINERS_WERE_RUNNING=0




# Safely check if any containers in this project are currently running
RUNNING_SERVICES=$(docker compose ps --status running -q || true)

if [ -n "$RUNNING_SERVICES" ]; then
    CONTAINERS_WERE_RUNNING=1
    echo "[2/8] Stopping containers..."
    docker compose stop
else
    echo "[2/8] Containers already stopped. Skipping stop..."
fi






echo "[3/8] Running database integrity check..."
INTEGRITY=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")

# 2. Evaluate the Check
if [ "$INTEGRITY" != "ok" ]; then
    echo "CRITICAL ERROR: Database corruption detected! Aborting backup."
    echo "Details: $INTEGRITY"
    exit 1
fi

echo "[4/8] Integrity check passed (Status: ok). Proceeding with cleanup..."

# 3. Prune the Web Vault Devices
DELETED_COUNT=$(sqlite3 "$DB_FILE" "DELETE FROM devices WHERE atype IN (9, 10, 11, 12, 14, 17); SELECT changes();")

echo "[4/8] Successfully pruned $DELETED_COUNT orphaned Web Vault sessions."






# 3. Cold Sync (Captures the final bits, takes milliseconds)
echo "[5/8] Final sync (Cold)..."
rsync -a --delete "${VW_DATA_DIR}/" "${STAGE_DIR}/vw-data/"





# 4. Resume Operations
if [ "$CONTAINERS_WERE_RUNNING" -eq 1 ]; then
    echo "[6/8] Restarting containers..."
    docker compose start
else
    echo "[6/8] Containers were not running initially. Skipping start..."
fi




# 5. Compress
echo "[7/8] Compressing archive..."
tar -czf "$ARCHIVE_PATH" -C "$STAGE_DIR" .

# 6. Upload & Cleanup
echo "[8/8] Uploading to rclone: ${RCLONE_REMOTE}..."
rclone copy "$ARCHIVE_PATH" "${RCLONE_REMOTE}:${RCLONE_DEST}"



echo "Cleaning up remote backups older than ${RETENTION_DAYS} days..."
rclone delete "${RCLONE_REMOTE}:${RCLONE_DEST}" --min-age ${RETENTION_DAYS}d

echo "Cleaning up local staging and archive files..."
rm -rf "$STAGE_DIR" "$ARCHIVE_DIR"

echo "Backup Successfully Completed: ${TIMESTAMP}"
echo "========================================================"

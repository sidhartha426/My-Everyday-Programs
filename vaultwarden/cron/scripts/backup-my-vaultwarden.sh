#!/usr/bin/env bash
# ==============================================================================
# Vaultwarden - Minimal Downtime Rclone Backup (Cron-Safe Version)
# ==============================================================================

# Fail completely if any command fails, a variable is unset, or a pipe fails
set -euo pipefail

START_TIME=$(date +%s)

# ==============================================================================
# CRON ENVIRONMENT FIXES
# ==============================================================================
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"

# ==============================================================================
# CONFIGURATION
# ==============================================================================
USER_NAME=""
DOCKER_DIR="/home/${USER_NAME}/my-vaultwarden"
VW_DATA_DIR="${DOCKER_DIR}/vaultwarden/data"
DB_FILE="${VW_DATA_DIR}/db.sqlite3"

# Staging & Archiving
STAGE_DIR="/tmp/${USER_NAME}_vw_backup_staging"
ARCHIVE_DIR="/tmp/${USER_NAME}_vw_archives"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ARCHIVE_NAME="my_vaultwarden_backup_${TIMESTAMP}.tar.zst"
ARCHIVE_PATH="${ARCHIVE_DIR}/${ARCHIVE_NAME}"

# Rclone Settings
export RCLONE_CONFIG="/home/${USER_NAME}/my-vaultwarden/rclone/rclone.conf"
RCLONE_REMOTE="my-vaultwarden-rclone-crypt"
RCLONE_DEST="/"
RETENTION_DAYS=5

# Notification Settings (ntfy)
NTFY_URL="" 
NTFY_TOKEN=""     

LOG_DIR="${DOCKER_DIR}/cron/logs"
LOG_FILE="${LOG_DIR}/backup-my-vaultwarden.log"

mkdir -p "$LOG_DIR"
exec > "$LOG_FILE" 2>&1

echo "========================================================"
echo "Backup Started: ${TIMESTAMP}"
echo "========================================================"

mkdir -p "${STAGE_DIR}/my-vaultwarden"
mkdir -p "$ARCHIVE_DIR"

echo "[1/9] Deleting empty attachments file..."
find "${VW_DATA_DIR}/attachments" -mindepth 1 -type d -empty -delete

# Hot Sync
echo "[2/9] Pre-syncing data (Hot)..."
rsync -a --delete --exclude 'cron/logs' "${DOCKER_DIR}/" "${STAGE_DIR}/my-vaultwarden/"

# Stop Container
cd "$DOCKER_DIR"
CONTAINERS_WERE_RUNNING=0
RUNNING_SERVICES=$(docker compose ps --status running -q || true)

if [ -n "$RUNNING_SERVICES" ]; then
    CONTAINERS_WERE_RUNNING=1
    echo "[3/9] Stopping containers..."
    docker compose down
else
    echo "[3/9] Containers already stopped. Skipping stop..."
fi

echo "[4/9] Running database integrity check..."
INTEGRITY=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")

if [ "$INTEGRITY" != "ok" ]; then
    echo "CRITICAL ERROR: Database corruption detected! Aborting backup."
    echo "Details: $INTEGRITY"

    if [ "$CONTAINERS_WERE_RUNNING" -eq 1 ]; then
        docker compose up -d
    fi

    # Failure alert before exit
    curl -fsS \
        -H "Authorization: Bearer ${NTFY_TOKEN}" \
        -H "Title: Vaultwarden Backup FAILED" \
        -H "Priority: urgent" \
        -H "Tags: warning,rotating_light" \
        -d "Database integrity check failed: ${INTEGRITY}. Containers restored." \
        "$NTFY_URL" || true

    exit 1
fi

echo "[5/9] Integrity check passed (Status: ok). Proceeding with cleanup..."

DELETED_COUNT=$(sqlite3 "$DB_FILE" "DELETE FROM devices WHERE atype IN (9, 10, 11, 12, 14, 17); SELECT changes();")
echo "Successfully pruned $DELETED_COUNT orphaned Web Vault sessions."

# Cold Sync
echo "[6/9] Final sync (Cold)..."
rsync -a --delete --exclude 'cron/logs' "${DOCKER_DIR}/" "${STAGE_DIR}/my-vaultwarden/"

# Resume Operations
if [ "$CONTAINERS_WERE_RUNNING" -eq 1 ]; then
    echo "[7/9] Restarting containers..."
    docker compose up -d
else
    echo "[7/9] Containers were not running initially. Skipping start..."
fi

# Compress
echo "[8/9] Compressing archive..."
nice -n 19 ionice -c2 -n7 tar -I 'zstd --single-thread -9' --exclude="./my-vaultwarden/cron/logs" -cf "$ARCHIVE_PATH" -C "$STAGE_DIR" .

# Gather file size before clearing local files
ARCHIVE_SIZE=$(du -h "$ARCHIVE_PATH" | cut -f1)

# Upload & Cleanup
echo "[9/9] Uploading to rclone: ${RCLONE_REMOTE}..."
rclone copy "$ARCHIVE_PATH" "${RCLONE_REMOTE}:${RCLONE_DEST}"

echo "Cleaning up remote backups older than ${RETENTION_DAYS} days..."
rclone delete "${RCLONE_REMOTE}:${RCLONE_DEST}" --min-age "${RETENTION_DAYS}d" --drive-use-trash=false

echo "Cleaning up local staging and archive files..."
rm -rf "$STAGE_DIR" "$ARCHIVE_DIR"

# Execution metadata
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "Backup Successfully Completed: $(date +"%Y-%m-%d %H:%M:%S")"
echo "Duration: ${DURATION}s | Archive Size: ${ARCHIVE_SIZE}"
echo "========================================================"

# Dispatch ntfy success notification
curl -fsS \
    -H "Authorization: Bearer ${NTFY_TOKEN}" \
    -H "Title: my-vaultwarden Backup Successful" \
    -H "Priority: default" \
    -H "Tags: white_check_mark,lock,package" \
    -d "Archive: ${ARCHIVE_NAME} (${ARCHIVE_SIZE}) uploaded to ${RCLONE_REMOTE}. Completed in ${DURATION}s." \
    "$NTFY_URL"

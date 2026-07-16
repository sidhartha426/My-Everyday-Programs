#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# ==========================================
# Hardened Vaultwarden Maintenance Script
# ==========================================

USER_NAME="sidhartha426"
VAULTWARDEN_DIR="/home/${USER_NAME}/vaultwarden"
LOG_FILE="${VAULTWARDEN_DIR}/cron-logs/update-system.log"

export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
export DEBIAN_FRONTEND=noninteractive

# --- Bulletproof Logging ---
exec > "$LOG_FILE" 2>&1

echo "$(date) - Starting weekly maintenance..."

# --- 1. Navigate to directory ---
cd "$VAULTWARDEN_DIR" || { echo "CRITICAL: Directory not found!"; exit 1; }

# --- 2. Capture Initial State (The Precise Way) ---
# Capture EXACTLY which services are running (e.g., "vaultwarden db")
ACTIVE_SERVICES=$(docker compose ps --services --status running)

# --- 3. The Safety Net (Trap) ---
# Trap ONLY on EXIT to avoid double-firing. 
# Bash word splitting allows $ACTIVE_SERVICES to pass multiple service names cleanly.
trap 'echo "$(date) - Script interrupted! Restoring exact state..."; [ -n "$ACTIVE_SERVICES" ] && docker compose up -d $ACTIVE_SERVICES' EXIT

# --- 4. Stop Containers ---
if [ -n "$ACTIVE_SERVICES" ]; then
    # Bash automatically converts the newlines in ACTIVE_SERVICES to spaces
    echo "$(date) - Active services found: $ACTIVE_SERVICES. Bringing them down..."
    docker compose down
else
    echo "$(date) - No active services. Skipping teardown."
fi

# --- 5. System Update ---
echo "$(date) - Updating Debian Trixie..."
sudo apt-get update -yq

sudo apt-get upgrade -yq \
    -o Dpkg::Options::="--force-confdef" \
    -o Dpkg::Options::="--force-confold"

sudo apt-get autoremove -yq
sudo apt-get clean

# --- 6. Clear the Safety Net ---
# Clear the trap BEFORE attempting to restore. 
# If the final startup fails natively, we want it to fail cleanly so we can read the error, 
# rather than having a trap instantly retry it in an infinite loop.
trap - EXIT

# --- 7. Restore Containers ---
# Only bring back the specific services that were running when we started.
if [ -n "$ACTIVE_SERVICES" ]; then
    echo "$(date) - Restoring previously active services..."
    docker compose up -d $ACTIVE_SERVICES
else
    echo "$(date) - Containers were initially offline. Leaving them stopped."
fi

echo "$(date) - Maintenance completed successfully!"

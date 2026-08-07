#!/usr/bin/env bash

# Exit immediately if a command fails
set -e

# 1. Verify Docker daemon is running before proceeding
if ! docker info >/dev/null 2>&1; then
    echo "❌ Error: Docker daemon is not running or you lack permissions (try sudo)."
    exit 1
fi

echo "🔍 Scanning for all Docker Compose projects..."

# 2. Query ALL containers system-wide that belong to a compose project
# By putting {{.Names}} immediately after the project label, `sort` will automatically
# sort alphabetically by Project Name, and then alphabetically by Container Name.
docker ps -a \
    --filter "label=com.docker.compose.project" \
    --format '{{.Label "com.docker.compose.project"}}\t{{.Names}}\t{{.ID}}\t{{.State}}\t{{.Status}}' | 
sort | 
awk -F'\t' '
BEGIN {
    # Define ANSI color codes for a professional look
    RESET="\033[0m"
    BOLD="\033[1m"
    BLUE="\033[34m"
    CYAN="\033[36m"
    GRAY="\033[90m"
    
    last_project = ""
    count = 0
}
{
    project = $1
    name = $2
    id = $3
    state = $4
    status = $5
    
    # 3. Grouping: Print a beautiful header whenever a new Compose project starts
    if (project != last_project) {
        if (count > 0) print "" # Add a blank line between different projects
        printf "\n%s📁 Compose Project: %s%s%s\n", BOLD, BLUE, project, RESET
        printf "%s%s%s\n", GRAY, "──────────────────────────────────────────────────────────────────────────────────────────────", RESET
        last_project = project
    }
    
    # 4. Status parsing: Assign icons based on exact container state
    if (state == "running") {
        icon = "🟢"
    } else if (state == "exited" || state == "dead") {
        icon = "🔴"
    } else if (state == "paused") {
        icon = "⏸️ "
    } else {
        icon = "🟡" # Covers created, restarting, removing
    }
    
    # 5. Safe formatting to prevent alignment breakage
    # %-40.40s guarantees the container name takes exactly 40 chars. 
    # If it is longer, it gracefully truncates instead of breaking the UI.
    printf "🆔 %s%-12s%s │ 📦  %-40.40s │ %s %s%-10.10s%s │ 🕒 %s\n", 
           CYAN, id, RESET, 
           name, 
           icon, BOLD, state, RESET, 
           status
           
    count++
}
END {
    # 6. Summary footer
    if (count == 0) {
        print "\nℹ️  No Docker Compose projects found on this system."
    } else {
        printf "\n%s✅ Total managed containers found: %d%s\n", BOLD, count, RESET
    }
}
'

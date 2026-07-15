#!/usr/bin/env bash

docker compose ps -a --format '{{printf "%-12.12s\t%-35s\t%-15s\t%s" .ID .Image .RunningFor .Status}}' |
awk -F'\t' '{
    icon = ($4 ~ /^Up/) ? "🟢" : "🔴"
    printf "🆔 %-12s │ 📦 %-35s │ 🕒 %-15s │ %s %s\n", $1, $2, $3, icon, $4
}'

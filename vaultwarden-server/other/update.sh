#!/bin/bash

# --- YOUR DETAILS HERE ---
API_KEY=
SECRET_KEY=
DOMAIN="sid426.dev"
SUBDOMAIN="fk-vault" # Just the subdomain, not the full URL
# -------------------------

# 1. Get current public IP of this VM
CURRENT_IP=$(curl -4 -s checkip.amazonaws.com)


JSON_PAYLOAD=$(cat <<EOF
{
  "secretapikey": "${SECRET_KEY}",
  "apikey": "${API_KEY}",
  "content": "${CURRENT_IP}"
}
EOF
)

# 3. Update Porkbun DNS record via API
RESPONSE=$(curl --silent --header "Content-Type: application/json" \
     --request POST \
     --data "$JSON_PAYLOAD" \
     "https://api.porkbun.com/api/json/v3/dns/editByNameType/${DOMAIN}/A/${SUBDOMAIN}")

# 4. Print the raw API result
echo "$RESPONSE"

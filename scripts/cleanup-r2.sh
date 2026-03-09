#!/usr/bin/env bash
# Usage: ./scripts/cleanup-r2.sh
# Checks if ISR cache buckets are empty and deletes them if so.
set -euo pipefail

source "$(dirname "$0")/../.env.local" 2>/dev/null || true

ACCOUNT="${CLOUDFLARE_ACCOUNT_ID}"
TOKEN="${CLOUDFLARE_API_TOKEN}"
BUCKETS=("api-navigator-inc-cache" "api-navigator-inc-cache-preview" "sitejson-assets")

for bucket in "${BUCKETS[@]}"; do
  resp=$(curl -s \
    "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/r2/buckets/${bucket}/objects?limit=1" \
    -H "Authorization: Bearer ${TOKEN}" 2>/dev/null || echo '{"result":[]}')

  count=$(echo "$resp" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('result',[])))" 2>/dev/null || echo "?")

  if [ "$count" = "0" ]; then
    del=$(curl -s -X DELETE \
      "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT}/r2/buckets/${bucket}" \
      -H "Authorization: Bearer ${TOKEN}")
    ok=$(echo "$del" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success'))" 2>/dev/null)
    if [ "$ok" = "True" ]; then
      echo "[deleted] ${bucket}"
    else
      echo "[error]   ${bucket}: $(echo "$del" | python3 -c "import sys,json; print(json.load(sys.stdin).get('errors'))" 2>/dev/null)"
    fi
  else
    echo "[waiting] ${bucket}: ${count}+ objects remain (lifecycle processing)"
  fi
done

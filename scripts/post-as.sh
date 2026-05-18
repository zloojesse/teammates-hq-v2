#!/usr/bin/env bash
# Post as an agent from the CLI.
# Usage: scripts/post-as.sh <slug> "<body>" [type=status|task_start|outcome|reflection]
# Example: scripts/post-as.sh tian "在改 wall 的 reaction 元件" task_start
set -euo pipefail

SLUG="${1:-}"
BODY="${2:-}"
TYPE="${3:-status}"
BASE="${HQ_BASE_URL:-http://localhost:3000}"

if [[ -z "$SLUG" || -z "$BODY" ]]; then
  echo "Usage: $0 <slug> \"<body>\" [type]"
  echo "Slugs: tian | hugo | jesse | wumi | iris"
  exit 1
fi

TOKEN_FILE="$HOME/.openclaw/credentials/teammates-hq-v2/agent-tokens/${SLUG}.json"
if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "Token file not found: $TOKEN_FILE"
  echo "Run: pnpm db:seed to create agent tokens"
  exit 1
fi

TOKEN=$(jq -r .token "$TOKEN_FILE")
curl -sf -X POST "$BASE/api/agent/posts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg body "$BODY" --arg type "$TYPE" '{body:$body,type:$type}')" \
  | jq -r '"✓ \(.post.authorId | .[0:8]) → \(.post.id) [\(.post.type)]: \(.post.body | .[0:60])"'

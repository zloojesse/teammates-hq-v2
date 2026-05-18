#!/usr/bin/env bash
# Update an agent's status from the CLI.
# Usage: scripts/status-as.sh <slug> <state> ["<task>"] ["<detail>"]
# Example: scripts/status-as.sh tian working "整理 v2 docs" "改 README + screenshots"
set -euo pipefail

SLUG="${1:-}"
STATE="${2:-}"
TASK="${3:-}"
DETAIL="${4:-}"
BASE="${HQ_BASE_URL:-http://localhost:3000}"

if [[ -z "$SLUG" || -z "$STATE" ]]; then
  echo "Usage: $0 <slug> <state> [\"<task>\"] [\"<detail>\"]"
  echo "Slugs:  tian | hugo | jesse | wumi | iris"
  echo "States: working | idle | away | blocked | offline"
  exit 1
fi

TOKEN_FILE="$HOME/.openclaw/credentials/teammates-hq-v2/agent-tokens/${SLUG}.json"
TOKEN=$(jq -r .token "$TOKEN_FILE")

BODY=$(jq -nc \
  --arg state  "$STATE" \
  --arg task   "$TASK" \
  --arg detail "$DETAIL" '
  {state: $state}
  + (if $task   == "" then {} else {task: $task} end)
  + (if $detail == "" then {} else {detail: $detail} end)
')

curl -sf -X PATCH "$BASE/api/agent/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "$BODY" \
  | jq -r '"✓ \(.agent.displayName) → state=\(.agent.state) task=\(.agent.task // "(none)")"'

#!/usr/bin/env bash
# qa-start.sh — Start both skillbase core and landing-page dev servers for QA.
#
# Usage: ./scripts/qa-start.sh
#
# What it does:
#   1. Kills processes on ports 4321 (core) and 4322 (landing-page)
#   2. Starts both Astro dev servers in the background
#   3. Waits for both servers to be ready
#   4. Prints log tails to confirm clean startup
#   5. Opens both apps in the default browser

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CORE_DIR="$REPO_ROOT/apps/core"
LANDING_DIR="$REPO_ROOT/apps/landing-page"

CORE_PORT=4321
CORE_URL="http://localhost:$CORE_PORT"
CORE_HEALTH="http://127.0.0.1:$CORE_PORT"
CORE_LOG="$CORE_DIR/dev-server.log"

LANDING_PORT=4322
LANDING_URL="http://localhost:$LANDING_PORT"
LANDING_HEALTH="http://127.0.0.1:$LANDING_PORT"
LANDING_LOG="$LANDING_DIR/dev-server.log"

free_port() {
  local port=$1
  echo "==> Freeing port $port..."
  local pids
  pids="$(lsof -i ":$port" -t 2>/dev/null || true)"
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
    sleep 2
    local pids_after
    pids_after="$(lsof -i ":$port" -t 2>/dev/null || true)"
    if [ -n "$pids_after" ]; then
      echo "ERROR: Could not free port $port. Processes still listening: $pids_after"
      exit 1
    fi
  fi
}

wait_for_server() {
  local url=$1
  local label=$2
  local log_file=$3
  local max_wait=${4:-30}

  echo "==> Waiting for $label to be ready..."
  local elapsed=0
  until curl -sk "$url" -o /dev/null 2>/dev/null; do
    sleep 1
    elapsed=$((elapsed + 1))
    if [ "$elapsed" -ge "$max_wait" ]; then
      echo ""
      echo "ERROR: $label did not respond after ${max_wait}s. Last log lines:"
      tail -20 "$log_file"
      exit 1
    fi
    printf "."
  done
  echo " ready after ${elapsed}s"
}

print_log_summary() {
  local log_file=$1
  local label=$2

  echo ""
  echo "==> $label log output (last 15 lines):"
  echo "------------------------------------------------------------"
  tail -15 "$log_file"
  echo "------------------------------------------------------------"

  echo ""
  echo "==> Checking for startup errors in $label log..."
  if grep -iE "error|fatal|EADDRINUSE|Cannot connect" "$log_file" | grep -v "devtools\|HMR" | head -5; then
    echo "WARNING: Possible errors detected above — review before testing."
  else
    echo "    No errors detected."
  fi
}

free_port "$CORE_PORT"
free_port "$LANDING_PORT"

echo "==> Starting core app (logs → $CORE_LOG)..."
cd "$CORE_DIR"
nohup npx astro dev --host --port "$CORE_PORT" > "$CORE_LOG" 2>&1 &
echo "    core PID: $!"

wait_for_server "$CORE_HEALTH" "core" "$CORE_LOG"

echo "==> Starting landing-page (logs → $LANDING_LOG)..."
cd "$LANDING_DIR"
nohup npx astro dev --host --port "$LANDING_PORT" > "$LANDING_LOG" 2>&1 &
echo "    landing-page PID: $!"

wait_for_server "$LANDING_HEALTH" "landing-page" "$LANDING_LOG"

print_log_summary "$CORE_LOG" "core"
print_log_summary "$LANDING_LOG" "landing-page"

echo ""
echo "==> Opening browsers..."
open "$CORE_URL" 2>/dev/null || xdg-open "$CORE_URL" 2>/dev/null || echo "    Could not auto-open. Navigate to: $CORE_URL"
open "$LANDING_URL" 2>/dev/null || xdg-open "$LANDING_URL" 2>/dev/null || echo "    Could not auto-open. Navigate to: $LANDING_URL"

echo ""
echo "QA environment ready"
echo ""
echo "  core:"
echo "    URL:      $CORE_URL"
echo "    Log file: $CORE_LOG"
echo "    Watch:    tail -f $CORE_LOG"
echo ""
echo "  landing-page:"
echo "    URL:      $LANDING_URL"
echo "    Log file: $LANDING_LOG"
echo "    Watch:    tail -f $LANDING_LOG"
echo ""

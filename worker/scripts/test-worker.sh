#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FIXTURE_DEFAULT="$WORKER_DIR/test/fixtures/comprehensive-test.json"
PORT_DEFAULT=8787
MODE="auto"           # auto | local | remote
URL=""
PORT="$PORT_DEFAULT"
FIXTURE="$FIXTURE_DEFAULT"

usage() {
  cat <<EOF
Cloudflare Worker API test (local + remote)

Usage:
  $(basename "$0") [options]

Options:
  -m, --mode <auto|local|remote>   Test mode (default: auto)
  -u, --url <URL>                   Worker base URL when mode=remote
  -p, --port <port>                 Local port for wrangler dev (default: $PORT_DEFAULT)
  -f, --fixture <file.json>         Timeline JSON (default: $FIXTURE_DEFAULT)
  -h, --help                        Show help

Examples:
  # Local (auto start wrangler dev)
  $(basename "$0") --mode local

  # Remote
  $(basename "$0") --mode remote --url https://your-worker.example.workers.dev

  # Auto (use WORKER_URL if set; otherwise local)
  WORKER_URL=https://your-worker.example.workers.dev $(basename "$0")
EOF
}

log()  { echo -e "\033[0;34m[INFO]\033[0m $*"; }
ok()   { echo -e "\033[0;32m[OK]\033[0m   $*"; }
warn() { echo -e "\033[1;33m[WARN]\033[0m $*"; }
err()  { echo -e "\033[0;31m[ERR]\033[0m  $*"; }

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--mode) MODE="$2"; shift 2;;
    -u|--url) URL="$2"; shift 2;;
    -p|--port) PORT="$2"; shift 2;;
    -f|--fixture) FIXTURE="$2"; shift 2;;
    -h|--help) usage; exit 0;;
    *) err "Unknown arg: $1"; usage; exit 1;;
  esac
done

# Auto mode: prefer WORKER_URL, else local
if [[ "$MODE" == "auto" ]]; then
  if [[ -n "${WORKER_URL:-}" ]]; then
    MODE="remote"
    URL="$WORKER_URL"
  else
    MODE="local"
  fi
fi

if ! command -v curl >/dev/null 2>&1; then err "curl is required"; exit 1; fi
if ! command -v jq >/dev/null 2>&1; then err "jq is required"; exit 1; fi

DEV_PID=""
cleanup() {
  if [[ -n "$DEV_PID" ]]; then
    log "Stopping wrangler dev (pid=$DEV_PID)"
    kill "$DEV_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

if [[ "$MODE" == "local" ]]; then
  # Ensure dependencies installed
  if ! command -v wrangler >/dev/null 2>&1; then
    warn "wrangler not found on PATH; will try npx wrangler"
  fi

  URL="http://127.0.0.1:$PORT"
  log "Starting wrangler dev on $URL"
  # Prefer npx to ensure correct version
  (
    cd "$WORKER_DIR"
    npx --yes wrangler dev --port "$PORT" --local >/dev/null 2>&1 &
    DEV_PID=$!
    echo "$DEV_PID" > "$WORKER_DIR/.wrangler/dev.pid"
  )

  # Wait until /health responds
  ATTEMPTS=60
  until curl -sSf "$URL/health" >/dev/null 2>&1; do
    ((ATTEMPTS--)) || { err "wrangler dev did not become ready"; exit 1; }
    sleep 0.5
  done
  ok "wrangler dev is ready"
elif [[ "$MODE" == "remote" ]]; then
  if [[ -z "$URL" ]]; then err "--url is required for remote mode"; exit 1; fi
  log "Testing remote Worker at $URL"
else
  err "Invalid mode: $MODE"; exit 1
fi

log "GET /health"
curl -sS "$URL/health" | jq -C '.'

log "GET /version"
curl -sS "$URL/version" | jq -C '.'

log "POST /build (fixture: $FIXTURE)"
RESP=$(curl -sS -X POST "$URL/build" -H 'Content-Type: application/json' --data-binary "@${FIXTURE}") || {
  err "Request failed"; exit 1;
}

if echo "$RESP" | jq -e '.error' >/dev/null 2>&1; then
  err "API error:"; echo "$RESP" | jq -C '.'; exit 1
fi

ok "/build success"

# Summarize
echo "$RESP" | jq -C '{
  command_head: (.command | split("\n") | .[0:3]),
  args_count: (.args | length),
  warnings: .warnings
}'

# Write command to file
GEN_DIR="$WORKER_DIR/test/generated"
mkdir -p "$GEN_DIR"
OUTFILE="$GEN_DIR/ffmpeg-$(date +%Y%m%d-%H%M%S).sh"
echo "$RESP" | jq -r '.command' > "$OUTFILE"
chmod +x "$OUTFILE"
ok "Command saved: $OUTFILE"

echo
ok "Done"


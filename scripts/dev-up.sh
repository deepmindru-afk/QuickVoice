#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$ROOT/.env.dev" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env.dev"
  set +a
fi

SERVER_PORT="${SERVER_PORT:-5000}"
CONSOLE_PORT="${CONSOLE_PORT:-3000}"
WEB_PORT="${WEB_PORT:-3001}"
AI_API_ENABLED="${AI_API_ENABLED:-true}"
AI_API_PORT="${AI_API_PORT:-5555}"
AI_WORKER_ENABLED="${AI_WORKER_ENABLED:-false}"

pids=()

cleanup() {
  if [ "${#pids[@]}" -gt 0 ]; then
    printf '\nStopping QuickVoice dev processes...\n'
    kill "${pids[@]}" >/dev/null 2>&1 || true
    wait "${pids[@]}" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

start_service() {
  local name="$1"
  local dir="$2"
  shift 2

  printf 'starting %-12s %s\n' "$name" "$*"
  (
    cd "$ROOT/$dir"
    exec "$@"
  ) &
  pids+=("$!")
}

start_service "server" "apps/server" env DOTENV_CONFIG_PATH=.env.dev PORT="$SERVER_PORT" pnpm dev
start_service "console" "apps/console" pnpm dev --port "$CONSOLE_PORT"
start_service "web" "apps/web" pnpm dev --port "$WEB_PORT"

if [ "$AI_API_ENABLED" = "true" ]; then
  printf 'starting %-12s %s\n' "ai-api" "python main.py api"
  (
    cd "$ROOT/apps/ai"
    set -a
    # shellcheck disable=SC1091
    . .env.dev
    set +a
    export AI_API_PORT="$AI_API_PORT"
    exec .venv/bin/python main.py api
  ) &
  pids+=("$!")
fi

if [ "$AI_WORKER_ENABLED" = "true" ]; then
  printf 'starting %-12s %s\n' "ai-worker" "python main.py dev"
  (
    cd "$ROOT/apps/ai"
    set -a
    # shellcheck disable=SC1091
    . .env.dev
    set +a
    exec .venv/bin/python main.py dev
  ) &
  pids+=("$!")
fi

cat <<EOF

QuickVoice dev is starting:
  console  http://localhost:${CONSOLE_PORT}
  web      http://localhost:${WEB_PORT}
  api      http://localhost:${SERVER_PORT}/api/v1/health
  docs     http://localhost:${SERVER_PORT}/api/v1/docs
  ai-api   http://localhost:${AI_API_PORT}/health

Press Ctrl-C to stop all processes.
EOF

set +e
wait -n "${pids[@]}"
status=$?
set -e

exit "$status"

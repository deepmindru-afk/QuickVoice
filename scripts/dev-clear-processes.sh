#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

matches_pattern() {
  local comm="$1"
  local cmd="$2"

  case "$comm:$cmd" in
    node:*/pnpm\ dev* | \
    node:*/pnpm\ run\ dev* | \
    node:*/node_modules/.bin/next\ dev* | \
    node:*/node_modules/.bin/tsx\ watch\ src/index.ts* | \
    sh:sh\ -c\ next\ dev* | \
    sh:sh\ -c\ tsx\ watch\ src/index.ts* | \
    python*:*main.py\ api* | \
    python*:*main.py\ dev*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

pids=()

while read -r pid comm cmd; do
  if [ -z "$pid" ] || [ "$pid" = "$$" ]; then
    continue
  fi

  if ! matches_pattern "$comm" "$cmd"; then
    continue
  fi

  cwd=""
  if [ -e "/proc/$pid/cwd" ]; then
    cwd="$(readlink "/proc/$pid/cwd" 2>/dev/null || true)"
  fi

  if [[ "$cmd" == *"$ROOT"* || "$cwd" == "$ROOT"* ]]; then
    pids+=("$pid")
  fi
done < <(ps -eo pid=,comm=,args=)

if [ "${#pids[@]}" -eq 0 ]; then
  printf '[ok] no QuickVoice dev processes found\n'
  exit 0
fi

printf 'stopping QuickVoice dev processes: %s\n' "${pids[*]}"
kill "${pids[@]}" >/dev/null 2>&1 || true

sleep 1

survivors=()
for pid in "${pids[@]}"; do
  if kill -0 "$pid" >/dev/null 2>&1; then
    survivors+=("$pid")
  fi
done

if [ "${#survivors[@]}" -gt 0 ]; then
  printf 'force stopping QuickVoice dev processes: %s\n' "${survivors[*]}"
  kill -KILL "${survivors[@]}" >/dev/null 2>&1 || true
fi

printf '[ok] QuickVoice dev processes cleared\n'

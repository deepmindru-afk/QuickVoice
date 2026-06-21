#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required_sources=(
  "$ROOT/.env.dev.example"
  "$ROOT/apps/server/.env.dev.example"
  "$ROOT/apps/ai/.env.dev.example"
  "$ROOT/apps/console/.env.dev.example"
  "$ROOT/apps/web/.env.dev.example"
)

copy_if_missing() {
  local src="$1"
  local dest="$2"

  if [ -f "$dest" ]; then
    printf 'kept    %s\n' "${dest#$ROOT/}"
    return
  fi

  cp "$src" "$dest"
  printf 'created %s\n' "${dest#$ROOT/}"
}

missing=0
for src in "${required_sources[@]}"; do
  if [ ! -f "$src" ]; then
    printf 'missing %s\n' "${src#$ROOT/}" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  printf 'env bootstrap aborted; create the missing template files first.\n' >&2
  exit 1
fi

copy_if_missing "$ROOT/.env.dev.example" "$ROOT/.env.dev"
copy_if_missing "$ROOT/apps/server/.env.dev.example" "$ROOT/apps/server/.env.dev"
copy_if_missing "$ROOT/apps/ai/.env.dev.example" "$ROOT/apps/ai/.env.dev"
copy_if_missing "$ROOT/apps/console/.env.dev.example" "$ROOT/apps/console/.env.local"
copy_if_missing "$ROOT/apps/web/.env.dev.example" "$ROOT/apps/web/.env.local"

cat <<'EOF'

Env bootstrap checklist:
  Generated files: root .env.dev, server .env.dev, AI .env.dev, console .env.local, and web .env.local are created when missing and kept when present.
  Local-only defaults: Postgres and Redis use dev credentials and localhost-bound ports from .env.dev.
  External features blocked until configured: real calls, billing, OAuth, email delivery, storage, and production deploys still need provider credentials.

Next commands:
  task doctor
  task up:dev
EOF

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if command -v pnpm >/dev/null 2>&1; then
  echo "Installing dependencies with pnpm..."
  pnpm install

  echo "Starting backend and desktop apps with pnpm..."
  pnpm --filter @aoe4/backend dev &
  BACKEND_PID=$!
  pnpm --filter @aoe4/desktop dev &
  DESKTOP_PID=$!
else
  echo "pnpm not found. Falling back to npm..."
  npm install
  npm install --prefix apps/backend
  npm install --prefix apps/desktop

  echo "Starting backend and desktop apps with npm..."
  npm run dev --prefix apps/backend &
  BACKEND_PID=$!
  npm run dev --prefix apps/desktop &
  DESKTOP_PID=$!
fi

cleanup() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$DESKTOP_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait "$BACKEND_PID" "$DESKTOP_PID"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it via corepack (corepack enable) or npm i -g pnpm."
  exit 1
fi

echo "Installing dependencies..."
pnpm install

echo "Starting backend and desktop apps..."
pnpm --filter @aoe4/backend dev &
BACKEND_PID=$!
pnpm --filter @aoe4/desktop dev &
DESKTOP_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$BACKEND_PID" "$DESKTOP_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait "$BACKEND_PID" "$DESKTOP_PID"

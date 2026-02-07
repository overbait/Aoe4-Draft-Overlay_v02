#!/usr/bin/env sh
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$ROOT_DIR/desktop-app"

cd "$APP_DIR"

if [ ! -d "node_modules" ]; then
  npm install
fi

npm run start

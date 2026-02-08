@echo off
setlocal
cd /d %~dp0\..

where pnpm >nul 2>nul
if %errorlevel%==0 (
  echo Installing dependencies with pnpm...
  pnpm install
  echo Starting backend and desktop with pnpm...
  start "backend" pnpm --filter @aoe4/backend dev
  start "desktop" pnpm --filter @aoe4/desktop dev
) else (
  echo pnpm not found. Falling back to npm...
  npm install
  echo Starting backend and desktop with npm...
  start "backend" npm run dev --prefix apps/backend
  start "desktop" npm run dev --prefix apps/desktop
)
endlocal

@echo off
setlocal
pushd "%~dp0.."
set "ROOT=%CD%"

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
  npm install --prefix "%ROOT%\\apps\\backend"
  npm install --prefix "%ROOT%\\apps\\desktop"
  echo Starting backend and desktop with npm...
  start "backend" npm run dev --prefix "%ROOT%\\apps\\backend"
  start "desktop" npm run dev --prefix "%ROOT%\\apps\\desktop"
)
popd
endlocal

@echo off
setlocal

set ROOT_DIR=%~dp0
set APP_DIR=%ROOT_DIR%desktop-app

cd /d "%APP_DIR%"

if not exist "node_modules" (
  npm install
)

npm run start

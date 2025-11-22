@echo off
REM ConnectHub Production Server Starter for Windows

setlocal enabledelayedexpansion
set NODE_ENV=production

echo Starting ConnectHub Production Server...
echo NODE_ENV is set to: %NODE_ENV%
echo.

call npx cross-env NODE_ENV=production node dist/index.js

pause

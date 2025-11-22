@echo off
REM ConnectHub Development Server Starter for Windows
REM This script starts the development server with proper environment variables

setlocal enabledelayedexpansion
set NODE_ENV=development

echo Starting ConnectHub Development Server...
echo NODE_ENV is set to: %NODE_ENV%
echo.

call npx cross-env NODE_ENV=development tsx server/index-dev.ts

pause

# ConnectHub Development Server Starter for Windows PowerShell
# This script starts the development server with proper environment variables

Write-Host "Starting ConnectHub Development Server..." -ForegroundColor Green
Write-Host "NODE_ENV is set to: development" -ForegroundColor Cyan
Write-Host ""

$env:NODE_ENV = "development"
& npx cross-env NODE_ENV=development tsx server/index-dev.ts

Read-Host "Press Enter to exit"

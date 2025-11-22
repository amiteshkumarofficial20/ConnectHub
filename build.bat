@echo off
REM ConnectHub Build Script for Windows

setlocal enabledelayedexpansion

echo Building ConnectHub for production...
echo.

call npm run build

if %errorlevel% equ 0 (
    echo.
    echo Build completed successfully!
    echo To start the server, run: npm start
) else (
    echo.
    echo Build failed! Check the errors above.
)

pause

@echo off
echo Starting Vercel build optimization...

echo Cleaning build directory...
if exist .next (
    echo Removing .next directory...
    rd /s /q .next 2>nul
    timeout /t 2 /nobreak >nul
)

echo Installing dependencies...
call npm install --legacy-peer-deps

echo Setting environment variables...
set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1

echo Building application...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo Build completed successfully!
) else (
    echo Build failed with error code %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo Done!
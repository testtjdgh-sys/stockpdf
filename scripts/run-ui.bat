@echo off
setlocal enabledelayedexpansion

if "%PORT%"=="" set PORT=3000

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
  set PID=%%a
  echo Stopping process on port %PORT%: !PID!
  taskkill /F /PID !PID! >nul 2>&1
)

echo Starting UI on http://localhost:%PORT%
npm run ui

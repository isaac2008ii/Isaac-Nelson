@echo off
REM Double-click launcher for Windows.
REM Starts the Bloom server and opens the dashboard in your browser.
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js isn't installed. Download the LTS version from https://nodejs.org
  echo then double-click this file again.
  pause
  exit /b 1
)

if not exist .env (
  echo No .env file found. Copy .env.example to .env and paste your Klaviyo key first.
  echo Running in DEMO mode for now.
  echo.
)

start "" http://localhost:8000
node server.js

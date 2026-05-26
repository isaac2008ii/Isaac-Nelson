#!/usr/bin/env bash
# Double-click launcher for macOS / Linux.
# Starts the Bloom server and opens the dashboard in your browser.
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js isn't installed. Download the LTS version from https://nodejs.org"
  echo "then double-click this file again."
  read -r -p "Press Enter to close..."
  exit 1
fi

if [ ! -f .env ]; then
  echo "No .env file found. Copy .env.example to .env and paste your Klaviyo key first."
  echo "(Running in DEMO mode for now.)"
  echo
fi

PORT="${PORT:-8000}"
# open the browser shortly after the server starts
( sleep 1.5
  if command -v open >/dev/null 2>&1; then open "http://localhost:$PORT"
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "http://localhost:$PORT"
  fi
) &

node server.js

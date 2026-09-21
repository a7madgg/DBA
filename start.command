#!/bin/bash
# Double-click on macOS to start the DBA website locally at http://localhost:8080
cd "$(dirname "$0")"
PORT=8080
if command -v python3 >/dev/null 2>&1; then
  (sleep 1 && open "http://localhost:$PORT") &
  echo "Serving the DBA website at http://localhost:$PORT   (press Ctrl+C to stop)"
  python3 -m http.server $PORT
elif command -v npx >/dev/null 2>&1; then
  (sleep 2 && open "http://localhost:$PORT") &
  npx --yes serve -l $PORT .
else
  echo "Python 3 or Node.js is required. Install Python from https://www.python.org/downloads/ and try again."
  read -n 1 -s -r -p "Press any key to close"
fi

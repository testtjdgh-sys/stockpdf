#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-3000}"

if command -v lsof >/dev/null 2>&1; then
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [ -n "$PIDS" ]; then
    echo "Stopping process on port $PORT: $PIDS"
    kill $PIDS || true
    sleep 1
  fi
fi

exec npx tsx watch src/ui/run-ui.ts

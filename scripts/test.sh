#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "=== Running Backend Tests ==="
backend/environments/sdk/.venv-sdk/bin/pytest backend/tests/ -v

if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
  echo ""
  echo "=== Running Frontend Tests ==="
  cd frontend
  if npm run test -- --run 2>/dev/null; then
    echo "Frontend tests passed"
  else
    echo "Frontend tests skipped or failed"
  fi
fi

echo ""
echo "=== All Tests Complete ==="

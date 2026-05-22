#!/usr/bin/env bash
set -euo pipefail

# Unified startup script for GLM-OCR Web Interface
# Launches mlx-vlm server and FastAPI backend via honcho

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

# Check if honcho is available in SDK venv
HONCHO="backend/environments/sdk/.venv-sdk/bin/honcho"

if [[ ! -x "$HONCHO" ]]; then
    echo "[ERROR] honcho not found at $HONCHO"
    echo "Run: backend/environments/sdk/.venv-sdk/bin/pip install honcho"
    exit 1
fi

# Trap SIGINT and SIGTERM for clean shutdown
cleanup() {
    echo ""
    echo "[INFO] Shutting down processes..."
    exit 0
}
trap cleanup INT TERM

echo "[INFO] Starting GLM-OCR stack..."
echo "[INFO] Root: $ROOT_DIR"

exec "$HONCHO" start "$@"

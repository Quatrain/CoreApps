#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Resolve the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
IMAGE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Ensure data and storage directories exist
mkdir -p "$IMAGE_DIR/data" "$IMAGE_DIR/storage"

# Configure environment variables
export STUDIO_DATA_DIR="$IMAGE_DIR/data"
export STUDIO_STORAGE_DIR="$IMAGE_DIR/storage"
export PORT=4000

echo "🚀 Starting Studio Development Environment..."
echo "📂 SQLite Database Directory: $STUDIO_DATA_DIR"
echo "📂 Local Storage Directory: $STUDIO_STORAGE_DIR"

# Free port 4000 if it's in use
if lsof -i :$PORT -t >/dev/null ; then
  PID=$(lsof -i :$PORT -t)
  echo "⚠️  Port $PORT is already in use by PID $PID. Terminating process..."
  kill -9 $PID || true
fi

# Run the workspaces dev servers in parallel with interlaced logs
yarn workspaces foreach -A --include '@quatrain/studio-*' -ivp -j unlimited run dev

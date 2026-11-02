#!/usr/bin/env bash
# Script to run both backend and frontend concurrently
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
cd "$DIR"

echo "=========================================="
echo " Starting Full-Stack Todo Application"
echo " Backend:  http://localhost:5001"
echo " Frontend: http://localhost:3000"
echo "=========================================="

npm run dev

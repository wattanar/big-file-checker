#!/bin/bash
# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Default to current directory if no argument is provided
TARGET_DIR="${1:-$PWD}"
# Convert to absolute path
ABS_TARGET_DIR="$(cd "$TARGET_DIR" && pwd)"

cd "$SCRIPT_DIR/src" || exit
bun run index.ts "$ABS_TARGET_DIR"

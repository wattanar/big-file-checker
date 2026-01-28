#!/bin/bash
# Script to compile the Big File Checker into standalone binaries for multiple platforms

PROJECT_DIR="$(cd "$(dirname "$0")/src" && pwd)"
cd "$PROJECT_DIR" || exit

echo "🔨 Starting Multi-Platform Compilation..."

# Function to compile for a specific target
compile_for() {
    local target=$1
    local outfile=$2
    echo "📦 Compiling for $target..."
    # Attempting to bundle everything
    bun build ./index.ts --compile --target="$target" --outfile="../$outfile"
    if [ $? -eq 0 ]; then
        echo "✅ Created $outfile"
    else
        echo "❌ Failed to create $outfile"
    fi
}

# Current OS
compile_for "bun" "big-file-checker-app"

# Windows x64
compile_for "bun-windows-x64" "big-file-checker-win.exe"

# Linux x64
compile_for "bun-linux-x64" "big-file-checker-linux"

# macOS x64 and arm64
compile_for "bun-darwin-x64" "big-file-checker-macos-x64"
compile_for "bun-darwin-arm64" "big-file-checker-macos-arm64"

echo ""
echo "✨ Compilation finished! Binaries are available in the root directory."

# Big File Checker

A high-performance Terminal User Interface (TUI) tool built with [Bun](https://bun.sh) and [OpenTUI](https://github.com/anomalyco/opentui) to find, visualize, and manage large files on your disk.

## Features

- **High-Performance Scanning**: Quickly finds files larger than a specified size (default >10MB).
- **Interactive TUI**: Beautiful console interface for navigating your filesystem.
- **Smart Sorting**: Automatically sorts files by size in descending order (largest first).
- **Path Switching**: Change the scan directory on the fly without restarting the tool.
- **Safe Deletion**: Built-in confirmation mechanism (double-press Enter) to prevent accidental data loss.
- **Standalone Binary**: Can be compiled into a single executable for portability.

## Prerequisites

- [Bun](https://bun.sh) (v1.0.0 or higher)

## Getting Started

### Installation

1. Clone or download this repository.
2. Install dependencies:
   ```bash
   cd src
   bun install
   ```

### Usage

#### Using the Shell Script
Run the helper script from the root directory:
```bash
./check-big-files.sh [optional_path]
```

#### Using the Compiled Binary
If you have already compiled the app:
```bash
./big-file-checker-app [optional_path]
```

## TUI Controls

| Key | Action |
|-----|--------|
| `↑/↓` or `j/k` | Navigate the list of files |
| `Enter` (1st) | Highlight file and ask for deletion confirmation |
| `Enter` (2nd) | Confirm and delete the selected file |
| `p` | Change the scan directory path |
| `r` | Refresh the current directory scan |
| `Ctrl+C` | Quit the application |

## Building for Production

To create standalone executable binaries for multiple platforms (Windows, Linux, macOS):

1. Run the compilation script:
   ```bash
   ./compile-to-binary.sh
   ```
2. The following binaries will be created in the root directory:
   - `big-file-checker-app`: Binary for your current OS.
   - `big-file-checker-win.exe`: Standalone binary for Windows (x64).
   - `big-file-checker-linux`: Standalone binary for Linux (x64).
   - `big-file-checker-macos-x64`: Standalone binary for Intel-based Macs.
   - `big-file-checker-macos-arm64`: Standalone binary for Apple Silicon Macs.

## Technical Details

- **Backend**: Native Node.js `fs` module (Cross-platform scanning).
- **UI Framework**: `@opentui/core` (Imperative TUI API).
- **Runtime**: [Bun](https://bun.sh) for fast execution and native TypeScript support.

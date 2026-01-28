#!/usr/bin/env bun
import {
  createCliRenderer,
  BoxRenderable,
  TextRenderable,
  SelectRenderable,
  SelectRenderableEvents,
  TextareaRenderable,
  type SelectOption,
  type KeyEvent,
} from "@opentui/core";
import { spawn } from "node:child_process";
import { unlinkSync, existsSync, lstatSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Help the bundler resolve platform-specific packages
if (import.meta.main && false) {
  // @ts-ignore
  await import("@opentui/core-darwin-arm64/index.ts");
  // @ts-ignore
  await import("@opentui/core-darwin-x64/index.ts");
  // @ts-ignore
  await import("@opentui/core-linux-x64/index.ts");
  // @ts-ignore
  await import("@opentui/core-win32-x64/index.ts");
}

async function findLargeFiles(directory: string, minSizeMB: number = 10): Promise<SelectOption[]> {
  if (!existsSync(directory) || !lstatSync(directory).isDirectory()) {
    return [];
  }

  const results: { path: string; sizeKb: number; sizeStr: string }[] = [];
  const minSizeKb = minSizeMB * 1024;

  function scanDir(dir: string) {
    try {
      const files = readdirSync(dir);
      for (const file of files) {
        const fullPath = join(dir, file);
        try {
          const stats = lstatSync(fullPath);
          if (stats.isDirectory()) {
            scanDir(fullPath);
          } else if (stats.isFile()) {
            const sizeKb = stats.size / 1024;
            if (sizeKb >= minSizeKb) {
              let sizeStr = "";
              if (sizeKb > 1024 * 1024) sizeStr = (sizeKb / (1024 * 1024)).toFixed(2) + "G";
              else if (sizeKb > 1024) sizeStr = (sizeKb / 1024).toFixed(2) + "M";
              else sizeStr = Math.round(sizeKb) + "K";
              
              results.push({ path: fullPath, sizeKb, sizeStr });
            }
          }
        } catch (e) {
          // Skip files that can't be accessed
        }
      }
    } catch (e) {
      // Skip directories that can't be accessed
    }
  }

  scanDir(directory);
  
  // Sort DESC by sizeKb
  results.sort((a, b) => b.sizeKb - a.sizeKb);
  
  return results.map(r => ({
    name: r.path,
    description: `Size: ${r.sizeStr}`,
    value: r.path,
  }));
}

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
  targetFps: 60,
});

const root = new BoxRenderable(renderer, {
  id: "root",
  width: "100%",
  height: "100%",
  flexDirection: "column",
  padding: 1,
});
renderer.root.add(root);

const header = new TextRenderable(renderer, {
  id: "header",
  content: "Big File Checker (Select to Delete)",
  fg: "#38BDF8",
  marginBottom: 0,
});
root.add(header);

let currentScanPath = process.argv[2] || process.cwd();
let isEditingPath = false;

const pathContainer = new BoxRenderable(renderer, {
  id: "path-container",
  flexDirection: "row",
  height: 1,
  marginBottom: 1,
});
root.add(pathContainer);

const pathLabel = new TextRenderable(renderer, {
  id: "path-label",
  content: `Scanning: `,
  fg: "#64748B",
});
pathContainer.add(pathLabel);

const pathValue = new TextRenderable(renderer, {
  id: "path-value",
  content: currentScanPath,
  fg: "#E2E8F0",
});
pathContainer.add(pathValue);

const pathInput = new TextareaRenderable(renderer, {
  id: "path-input",
  width: "100%",
  height: 1,
  backgroundColor: "#1E293B",
  textColor: "#F8FAFC",
  showCursor: true,
  visible: false,
});
pathContainer.add(pathInput);

const status = new TextRenderable(renderer, {
  id: "status",
  content: "Scanning for files > 10MB...",
  fg: "#94A3B8",
  marginBottom: 1,
});
root.add(status);

const selectBox = new BoxRenderable(renderer, {
  id: "select-box",
  flexGrow: 1,
  border: true,
  borderStyle: "single",
  borderColor: "#475569",
  focusedBorderColor: "#60A5FA",
  padding: 1,
});
root.add(selectBox);

let selectElement: SelectRenderable | null = null;
let pendingDeletePath: string | null = null;

async function refreshFiles() {
  status.content = "Scanning...";
  status.fg = "#94A3B8";
  pendingDeletePath = null;
  renderer.requestRender();
  
  const files = await findLargeFiles(currentScanPath, 10);
  
  if (selectElement) {
    selectBox.remove(selectElement.id);
    selectElement = null;
  }

  if (files.length === 0) {
    status.content = "No files found > 10MB or invalid path.";
    status.fg = "#F87171";
  } else {
    status.content = `Found ${files.length} files. Press Enter to select for deletion.`;
    status.fg = "#34D399";

    selectElement = new SelectRenderable(renderer, {
      id: "file-selector",
      width: "100%",
      height: "100%",
      options: files,
      selectedBackgroundColor: "#1E3A5F",
      selectedTextColor: "#38BDF8",
      showDescription: true,
    });
    selectBox.add(selectElement);
    if (!isEditingPath) {
      selectElement.focus();
    }

    selectElement.on(SelectRenderableEvents.ITEM_SELECTED, (index, option) => {
      const filePath = option.value as string;
      if (pendingDeletePath === filePath) {
        try {
          unlinkSync(filePath);
          status.content = `Deleted: ${filePath}`;
          status.fg = "#34D399";
          pendingDeletePath = null;
          // Refresh after a short delay
          setTimeout(() => refreshFiles(), 1000);
        } catch (e) {
          status.content = `Error deleting: ${filePath}`;
          status.fg = "#F87171";
          pendingDeletePath = null;
        }
      } else {
        pendingDeletePath = filePath;
        status.content = `CONFIRM DELETE: ${filePath} (Press Enter again)`;
        status.fg = "#FBBF24";
        renderer.requestRender();
      }
    });
  }
  renderer.requestRender();
}

function startEditingPath() {
  isEditingPath = true;
  pathValue.visible = false;
  pathInput.visible = true;
  pathInput.editBuffer.setText(currentScanPath);
  pathInput.focus();
  renderer.requestRender();
}

function stopEditingPath(save: boolean) {
  isEditingPath = false;
  if (save) {
    currentScanPath = pathInput.editBuffer.getText().trim();
    pathValue.content = currentScanPath;
    refreshFiles();
  }
  pathInput.visible = false;
  pathValue.visible = true;
  if (selectElement) {
    selectElement.focus();
  }
  renderer.requestRender();
}

renderer.keyInput.on("keypress", (key: KeyEvent) => {
  if (isEditingPath) {
    if (key.name === "return" || key.name === "linefeed") {
      key.preventDefault();
      stopEditingPath(true);
    } else if (key.name === "escape") {
      key.preventDefault();
      stopEditingPath(false);
    }
    return;
  }

  if (key.name === "r") {
    refreshFiles();
  } else if (key.name === "p") {
    startEditingPath();
  } else if (["up", "down", "j", "k"].includes(key.name || "")) {
    if (pendingDeletePath) {
      pendingDeletePath = null;
      status.content = `Found items. Press Enter to select for deletion.`;
      status.fg = "#34D399";
      renderer.requestRender();
    }
  }
});

const instructions = new TextRenderable(renderer, {
  id: "instructions",
  content: "↑/↓: Navigate | Enter: Delete (x2) | p: Change Path | r: Refresh | ctrl+c: Quit",
  fg: "#64748B",
  marginTop: 1,
});
root.add(instructions);

await refreshFiles();

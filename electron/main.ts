import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import {
  initializeDatabase,
  closeDatabase,
  getAllProjects,
  getProjectByPath,
  getAllSessions,
  getSessionsByProject,
  getSessionsByDateRange,
  getSessionCount,
  getProjectCount,
  setProjectHidden,
  setProjectGroup,
  setDefaultProject,
  getDefaultProject,
  getAllProjectGroups,
  createProjectGroup,
  updateProjectGroup,
  deleteProjectGroup,
  getMonthlySummary,
  mergeProjects,
  unmergeProject,
  getMergedProjects,
  getSetting,
  setSetting,
  getAllSettings,
} from "./services/database.js";
const execAsync = promisify(exec);
import {
  syncSessionsToDatabase,
  claudeProjectsExist,
  getClaudeProjectsPath,
} from "./services/session-parser.js";
import { encodeProjectPath } from "./services/path-decoder.js";
import { parseJsonlMessages } from "./services/parsers/jsonl-parser.js";
import {
  calculateTimeSplit,
  aggregateTimeSplits,
  type TimeSplit,
} from "./services/calculators/time-calculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Suppress security warnings in development (unsafe-eval is required for Next.js HMR)
if (process.env.NODE_ENV === "development") {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  const isMac = process.platform === "darwin";

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show until ready to prevent rendering issues
    title: "Clocked",
    // Use frame:false + setWindowButtonVisibility for better traffic light behavior
    frame: false,
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // On macOS, show the native traffic lights with frame:false
  if (isMac) {
    mainWindow.setWindowButtonVisibility(true);
  }

  // Show window when ready to ensure proper rendering of traffic lights
  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  // Set Content Security Policy
  const isDev = process.env.NODE_ENV === "development";

  // Define CSP based on environment
  // Development: Allow localhost, HMR websockets, and unsafe-eval for Next.js
  // Production: Strict CSP for packaged app
  const csp = isDev
    ? [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' ws://localhost:* http://localhost:*",
        "worker-src 'self' blob:",
      ].join("; ")
    : [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "font-src 'self'",
        "connect-src 'self'",
      ].join("; ");

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        "Content-Security-Policy": [csp],
      },
    });
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// Initialize database and sync sessions on app start
async function initializeData(): Promise<void> {
  try {
    // Initialize the SQLite database
    initializeDatabase();

    // Sync sessions from Claude Code's data
    const result = await syncSessionsToDatabase();

    console.log(
      `[Clocked] Initialized: ${result.projects.length} projects, ${result.sessions.length} sessions`
    );

    if (result.errors.length > 0) {
      console.warn(`[Clocked] Encountered ${result.errors.length} parsing errors`);
    }
  } catch (error) {
    console.error("[Clocked] Failed to initialize data:", error);
  }
}

// IPC Handlers - App
ipcMain.handle("app:version", () => app.getVersion());
ipcMain.handle("app:health", () => ({
  status: "ok",
  timestamp: new Date().toISOString(),
}));
ipcMain.handle("app:platform", () => process.platform);

// IPC Handlers - Window Controls
ipcMain.handle("window:minimize", () => {
  mainWindow?.minimize();
});
ipcMain.handle("window:maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle("window:close", () => {
  mainWindow?.close();
});
ipcMain.handle("window:isMaximized", () => {
  return mainWindow?.isMaximized() ?? false;
});

// IPC Handlers - Projects
ipcMain.handle("projects:getAll", (_event, { includeHidden } = {}) => {
  try {
    const projects = getAllProjects({ includeHidden });
    return { projects };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get projects",
    };
  }
});

ipcMain.handle("projects:getByPath", (_event, { path: projectPath }) => {
  try {
    const project = getProjectByPath(projectPath);
    return { project };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get project",
    };
  }
});

ipcMain.handle("projects:getCount", () => {
  try {
    const count = getProjectCount();
    return { count };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get project count",
    };
  }
});

ipcMain.handle("projects:setHidden", (_event, { path, hidden }) => {
  try {
    setProjectHidden(path, hidden);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to set project hidden status",
    };
  }
});

ipcMain.handle("projects:setGroup", (_event, { path, groupId }) => {
  try {
    setProjectGroup(path, groupId);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to set project group",
    };
  }
});

ipcMain.handle("projects:setDefault", (_event, { path }) => {
  try {
    setDefaultProject(path);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to set default project",
    };
  }
});

ipcMain.handle("projects:getDefault", () => {
  try {
    const project = getDefaultProject();
    return { project };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get default project",
    };
  }
});

ipcMain.handle("projects:merge", (_event, { sourcePaths, targetPath }) => {
  try {
    mergeProjects(sourcePaths, targetPath);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to merge projects",
    };
  }
});

ipcMain.handle("projects:unmerge", (_event, { path }) => {
  try {
    unmergeProject(path);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to unmerge project",
    };
  }
});

ipcMain.handle("projects:getMergedProjects", (_event, { primaryPath }) => {
  try {
    const projects = getMergedProjects(primaryPath);
    return { projects };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get merged projects",
    };
  }
});

// IPC Handlers - Project Groups
ipcMain.handle("groups:getAll", () => {
  try {
    const groups = getAllProjectGroups();
    return { groups };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get project groups",
    };
  }
});

ipcMain.handle("groups:create", (_event, { name, color }) => {
  try {
    const group = createProjectGroup({ name, color });
    return { group };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to create project group",
    };
  }
});

ipcMain.handle("groups:update", (_event, { id, updates }) => {
  try {
    const group = updateProjectGroup(id, updates);
    return { group };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to update project group",
    };
  }
});

ipcMain.handle("groups:delete", (_event, { id }) => {
  try {
    deleteProjectGroup(id);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to delete project group",
    };
  }
});

// IPC Handlers - Sessions
ipcMain.handle("sessions:getAll", () => {
  try {
    const sessions = getAllSessions();
    return { sessions };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get sessions",
    };
  }
});

ipcMain.handle("sessions:getByProject", (_event, { projectPath, limit, offset }) => {
  try {
    const result = getSessionsByProject(projectPath, limit, offset);
    return { sessions: result.sessions, total: result.total };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get sessions",
    };
  }
});

ipcMain.handle("sessions:getByDateRange", (_event, { startDate, endDate }) => {
  try {
    const sessions = getSessionsByDateRange(startDate, endDate);
    return { sessions };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get sessions",
    };
  }
});

ipcMain.handle("sessions:getCount", () => {
  try {
    const count = getSessionCount();
    return { count };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get session count",
    };
  }
});

/**
 * Get JSONL file path for a session
 */
function getSessionJsonlPath(projectPath: string, sessionId: string): string {
  const claudeProjectsPath = getClaudeProjectsPath();
  const encodedPath = encodeProjectPath(projectPath);
  return path.join(claudeProjectsPath, encodedPath, `${sessionId}.jsonl`);
}

// IPC Handler - Get time split for a project (aggregated across all sessions)
ipcMain.handle("sessions:getTimeSplit", async (_event, { projectPath }) => {
  try {
    // Get all sessions for this project
    const { sessions } = getSessionsByProject(projectPath);

    if (sessions.length === 0) {
      return {
        timeSplit: {
          activeTime: 0,
          humanTime: 0,
          claudeTime: 0,
          idleTime: 0,
          humanPercentage: 0,
          claudePercentage: 0,
          messagePairCount: 0,
          gapCount: 0,
        },
      };
    }

    // Calculate time split for each session
    const sessionTimeSplits: TimeSplit[] = [];

    for (const session of sessions) {
      const jsonlPath = getSessionJsonlPath(projectPath, session.id);

      // Skip if JSONL file doesn't exist
      if (!existsSync(jsonlPath)) {
        continue;
      }

      const parseResult = await parseJsonlMessages(jsonlPath, session.id);

      if (parseResult.messages.length >= 2) {
        const timeSplit = calculateTimeSplit(parseResult.messages);
        sessionTimeSplits.push(timeSplit);
      }
    }

    // Aggregate all session time splits
    const aggregatedTimeSplit = aggregateTimeSplits(sessionTimeSplits);

    return { timeSplit: aggregatedTimeSplit };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get time split",
    };
  }
});

// IPC Handlers - Data Management
ipcMain.handle("data:sync", async () => {
  try {
    const result = await syncSessionsToDatabase();
    return {
      success: true,
      projectCount: result.projects.length,
      sessionCount: result.sessions.length,
      errorCount: result.errors.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to sync data",
    };
  }
});

ipcMain.handle("data:status", () => {
  try {
    const hasClaudeProjects = claudeProjectsExist();
    const claudeProjectsPath = getClaudeProjectsPath();
    const projectCount = hasClaudeProjects ? getProjectCount() : 0;
    const sessionCount = hasClaudeProjects ? getSessionCount() : 0;

    return {
      hasClaudeProjects,
      claudeProjectsPath,
      projectCount,
      sessionCount,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get data status",
    };
  }
});

// IPC Handlers - Analytics
ipcMain.handle("analytics:getMonthlySummary", (_event, { month }) => {
  try {
    const summary = getMonthlySummary(month);
    return { summary };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get monthly summary",
    };
  }
});

// IDE definitions with detection logic
interface IdeInfo {
  id: string;
  name: string;
  available: boolean;
}

const IDE_DEFINITIONS = [
  { id: "terminal", name: "Terminal", appPath: "/System/Applications/Utilities/Terminal.app" },
  { id: "iterm2", name: "iTerm2", appPath: "/Applications/iTerm.app" },
  { id: "vscode", name: "VS Code", appPath: "/Applications/Visual Studio Code.app" },
  { id: "cursor", name: "Cursor", appPath: "/Applications/Cursor.app" },
  { id: "warp", name: "Warp", appPath: "/Applications/Warp.app" },
  { id: "windsurf", name: "Windsurf", appPath: "/Applications/Windsurf.app" },
  { id: "vscodium", name: "VSCodium", appPath: "/Applications/VSCodium.app" },
  { id: "zed", name: "Zed", appPath: "/Applications/Zed.app" },
  { id: "void", name: "Void", appPath: "/Applications/Void.app" },
  { id: "positron", name: "Positron", appPath: "/Applications/Positron.app" },
  { id: "antigravity", name: "Antigravity", appPath: "/Applications/Antigravity.app" },
];

/**
 * Detect which IDEs are available on the system
 */
function detectAvailableIdes(): IdeInfo[] {
  return IDE_DEFINITIONS.map((ide) => ({
    id: ide.id,
    name: ide.name,
    available: existsSync(ide.appPath),
  }));
}

/**
 * Generate AppleScript for VS Code-like editors (VS Code, Cursor, Windsurf, etc.)
 * These editors use Ctrl+` to toggle the integrated terminal
 */
function generateVSCodeLikeScript(appName: string, sessionId: string): string {
  const escapedSessionId = sessionId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `
    delay 2
    tell application "${appName}" to activate
    delay 0.5
    tell application "System Events"
      key code 50 using control down
      delay 1
      key code 50 using control down
      delay 0.5
      keystroke "claude --resume ${escapedSessionId}"
      delay 0.2
      keystroke return
    end tell
  `;
}

/**
 * Generate AppleScript for Terminal.app
 */
function generateTerminalScript(projectPath: string, sessionId: string): string {
  const escapePath = (str: string) => str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const command = `cd \\"${escapePath(projectPath)}\\" && claude --resume \\"${escapePath(sessionId)}\\"`;
  return `
    tell application "Terminal"
      do script "${command}"
      activate
    end tell
  `;
}

/**
 * Generate AppleScript for iTerm2
 */
function generateITerm2Script(projectPath: string, sessionId: string): string {
  const escapePath = (str: string) => str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const command = `cd \\"${escapePath(projectPath)}\\" && claude --resume \\"${escapePath(sessionId)}\\"`;
  return `
    tell application "iTerm"
      create window with default profile
      tell current session of current window
        write text "${command}"
      end tell
      activate
    end tell
  `;
}

/**
 * Generate AppleScript for Warp terminal
 */
function generateWarpScript(projectPath: string, sessionId: string): string {
  const escapePath = (str: string) => str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const command = `cd \\"${escapePath(projectPath)}\\" && claude --resume \\"${escapePath(sessionId)}\\"`;
  return `
    tell application "Warp"
      activate
    end tell
    delay 0.5
    tell application "System Events"
      keystroke "t" using command down
      delay 0.3
      keystroke "${command}"
      keystroke return
    end tell
  `;
}

// IPC Handlers - Settings
ipcMain.handle("settings:getAvailableIdes", () => {
  try {
    const ides = detectAvailableIdes();
    return { ides };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to detect IDEs",
    };
  }
});

ipcMain.handle("settings:get", (_event, { key }) => {
  try {
    if (key) {
      const value = getSetting(key);
      return { value };
    }
    const settings = getAllSettings();
    return { settings };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to get settings",
    };
  }
});

ipcMain.handle("settings:set", (_event, { key, value }) => {
  try {
    console.log("[Clocked] Setting value:", key, "=", value);
    setSetting(key, value);
    // Verify it was saved
    const saved = getSetting(key);
    console.log("[Clocked] Verified saved value:", key, "=", saved);
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to save setting",
    };
  }
});

// VS Code-like IDEs that use Ctrl+` for terminal
const VSCODE_LIKE_IDES: Record<string, string> = {
  vscode: "Visual Studio Code",
  cursor: "Cursor",
  windsurf: "Windsurf",
  vscodium: "VSCodium",
  zed: "Zed",
  void: "Void",
  positron: "Positron",
  antigravity: "Antigravity",
};

// IPC Handlers - Session Resume
ipcMain.handle("sessions:resume", async (_event, { sessionId, projectPath }) => {
  try {
    if (!existsSync(projectPath)) {
      return { success: false, error: `Project directory not found: ${projectPath}` };
    }

    const settings = getAllSettings();
    const ide = settings.defaultIde;
    console.log("[Clocked] Resume session - IDE:", ide);

    const shellEscapedPath = projectPath.replace(/"/g, '\\"');
    let script: string;

    // Handle VS Code-like IDEs
    if (ide in VSCODE_LIKE_IDES) {
      const appName = VSCODE_LIKE_IDES[ide];
      await execAsync(`open -a "${appName}" "${shellEscapedPath}"`);
      script = generateVSCodeLikeScript(appName, sessionId);
    } else if (ide === "iterm2") {
      script = generateITerm2Script(projectPath, sessionId);
    } else if (ide === "warp") {
      script = generateWarpScript(projectPath, sessionId);
    } else {
      // Default to Terminal.app
      script = generateTerminalScript(projectPath, sessionId);
    }

    await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to resume session",
    };
  }
});

app.whenReady().then(async () => {
  await initializeData();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("will-quit", () => {
  // Close the database when the app is quitting
  closeDatabase();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

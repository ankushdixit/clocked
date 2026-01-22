import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import { fileURLToPath } from "url";
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
} from "./services/database.js";
import {
  syncSessionsToDatabase,
  claudeProjectsExist,
  getClaudeProjectsPath,
} from "./services/session-parser.js";

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

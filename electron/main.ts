import { app, BrowserWindow, ipcMain } from "electron";
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
} from "./services/database";
import {
  syncSessionsToDatabase,
  claudeProjectsExist,
  getClaudeProjectsPath,
} from "./services/session-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Clocked",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.js"),
    },
  });

  if (process.env.NODE_ENV === "development") {
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
    const result = syncSessionsToDatabase();

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

// IPC Handlers - Projects
ipcMain.handle("projects:getAll", () => {
  try {
    const projects = getAllProjects();
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
ipcMain.handle("data:sync", () => {
  try {
    const result = syncSessionsToDatabase();
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

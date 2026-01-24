import { contextBridge, ipcRenderer } from "electron";

// Define allowed channels for security
const ALLOWED_CHANNELS = [
  // App channels
  "app:version",
  "app:health",
  "app:platform",
  // Window control channels
  "window:minimize",
  "window:maximize",
  "window:close",
  "window:isMaximized",
  // Project channels
  "projects:getAll",
  "projects:getByPath",
  "projects:getCount",
  "projects:setHidden",
  "projects:setGroup",
  "projects:setDefault",
  "projects:getDefault",
  "projects:merge",
  "projects:unmerge",
  "projects:getMergedProjects",
  // Project group channels
  "groups:getAll",
  "groups:create",
  "groups:update",
  "groups:delete",
  // Session channels
  "sessions:getAll",
  "sessions:getByProject",
  "sessions:getByDateRange",
  "sessions:getCount",
  "sessions:resume",
  // Data management channels
  "data:sync",
  "data:status",
  // Analytics channels
  "analytics:getMonthlySummary",
  // Settings channels
  "settings:get",
  "settings:set",
  "settings:getAvailableIdes",
];

contextBridge.exposeInMainWorld("electron", {
  // Platform detection (synchronous - available immediately)
  platform: process.platform,

  // Legacy convenience methods
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),
  getHealth: (): Promise<{ status: string; timestamp: string }> => ipcRenderer.invoke("app:health"),

  // Window control methods
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke("window:minimize"),
    maximize: (): Promise<void> => ipcRenderer.invoke("window:maximize"),
    close: (): Promise<void> => ipcRenderer.invoke("window:close"),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke("window:isMaximized"),
  },

  // Projects API
  projects: {
    getAll: (options?: { includeHidden?: boolean }): Promise<unknown> =>
      ipcRenderer.invoke("projects:getAll", { includeHidden: options?.includeHidden }),
    getByPath: (path: string): Promise<unknown> =>
      ipcRenderer.invoke("projects:getByPath", { path }),
    getCount: (): Promise<unknown> => ipcRenderer.invoke("projects:getCount"),
    setHidden: (path: string, hidden: boolean): Promise<unknown> =>
      ipcRenderer.invoke("projects:setHidden", { path, hidden }),
    setGroup: (path: string, groupId: string | null): Promise<unknown> =>
      ipcRenderer.invoke("projects:setGroup", { path, groupId }),
    setDefault: (path: string): Promise<unknown> =>
      ipcRenderer.invoke("projects:setDefault", { path }),
    getDefault: (): Promise<unknown> => ipcRenderer.invoke("projects:getDefault"),
    merge: (sourcePaths: string[], targetPath: string): Promise<unknown> =>
      ipcRenderer.invoke("projects:merge", { sourcePaths, targetPath }),
    unmerge: (path: string): Promise<unknown> => ipcRenderer.invoke("projects:unmerge", { path }),
    getMergedProjects: (primaryPath: string): Promise<unknown> =>
      ipcRenderer.invoke("projects:getMergedProjects", { primaryPath }),
  },

  // Project Groups API
  groups: {
    getAll: (): Promise<unknown> => ipcRenderer.invoke("groups:getAll"),
    create: (name: string, color?: string | null): Promise<unknown> =>
      ipcRenderer.invoke("groups:create", { name, color }),
    update: (
      id: string,
      updates: { name?: string; color?: string | null; sortOrder?: number }
    ): Promise<unknown> => ipcRenderer.invoke("groups:update", { id, updates }),
    delete: (id: string): Promise<unknown> => ipcRenderer.invoke("groups:delete", { id }),
  },

  // Sessions API
  sessions: {
    getAll: (): Promise<unknown> => ipcRenderer.invoke("sessions:getAll"),
    getByProject: (projectPath: string, limit?: number, offset?: number): Promise<unknown> =>
      ipcRenderer.invoke("sessions:getByProject", {
        projectPath,
        limit,
        offset,
      }),
    getByDateRange: (startDate: string, endDate: string): Promise<unknown> =>
      ipcRenderer.invoke("sessions:getByDateRange", { startDate, endDate }),
    getCount: (): Promise<unknown> => ipcRenderer.invoke("sessions:getCount"),
    resume: (sessionId: string, projectPath: string): Promise<unknown> =>
      ipcRenderer.invoke("sessions:resume", { sessionId, projectPath }),
  },

  // Data management API
  data: {
    sync: (): Promise<unknown> => ipcRenderer.invoke("data:sync"),
    status: (): Promise<unknown> => ipcRenderer.invoke("data:status"),
  },

  // Analytics API
  analytics: {
    getMonthlySummary: (month: string): Promise<unknown> =>
      ipcRenderer.invoke("analytics:getMonthlySummary", { month }),
  },

  // Settings API
  settings: {
    get: (key?: string): Promise<unknown> => ipcRenderer.invoke("settings:get", { key }),
    set: (key: string, value: unknown): Promise<unknown> =>
      ipcRenderer.invoke("settings:set", { key, value }),
    getAvailableIdes: (): Promise<unknown> => ipcRenderer.invoke("settings:getAvailableIdes"),
  },

  // Generic invoke for custom channels (with validation)
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!ALLOWED_CHANNELS.includes(channel)) {
      return Promise.reject(new Error(`Channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  // Event listener for main process events
  on: (channel: string, callback: (...callbackArgs: unknown[]) => void): void => {
    ipcRenderer.on(channel, (_event, ...eventArgs) => callback(...eventArgs));
  },
});

import { contextBridge, ipcRenderer } from "electron";

// Define allowed channels for security
const ALLOWED_CHANNELS = [
  // App channels
  "app:version",
  "app:health",
  // Project channels
  "projects:getAll",
  "projects:getByPath",
  "projects:getCount",
  "projects:setHidden",
  "projects:setGroup",
  "projects:setDefault",
  "projects:getDefault",
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
  // Data management channels
  "data:sync",
  "data:status",
];

contextBridge.exposeInMainWorld("electron", {
  // Legacy convenience methods
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),
  getHealth: (): Promise<{ status: string; timestamp: string }> => ipcRenderer.invoke("app:health"),

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
  },

  // Data management API
  data: {
    sync: (): Promise<unknown> => ipcRenderer.invoke("data:sync"),
    status: (): Promise<unknown> => ipcRenderer.invoke("data:status"),
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

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("app:version"),
  getHealth: (): Promise<{ status: string; timestamp: string }> => ipcRenderer.invoke("app:health"),
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> =>
    ipcRenderer.invoke(channel, ...args),
  on: (channel: string, callback: (...callbackArgs: unknown[]) => void): void => {
    ipcRenderer.on(channel, (_event, ...eventArgs) => callback(...eventArgs));
  },
});

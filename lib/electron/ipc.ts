/**
 * Type-safe IPC client for communicating with Electron main process
 *
 * This module provides typed wrappers around the window.electron API
 * exposed by the preload script. It handles the case where the app
 * is running in a browser (not Electron) gracefully.
 */

/**
 * Check if the app is running in Electron
 */
export function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electron;
}

/**
 * Get the app version from Electron
 * @returns Promise resolving to version string, or null if not in Electron
 */
export async function getAppVersion(): Promise<string | null> {
  if (!isElectron()) {
    return null;
  }
  return window.electron.getAppVersion();
}

/**
 * Health check response type
 */
export interface HealthCheckResponse {
  status: string;
  timestamp: string;
}

/**
 * Get health status from Electron main process
 * @returns Promise resolving to health check response, or null if not in Electron
 */
export async function getHealth(): Promise<HealthCheckResponse | null> {
  if (!isElectron()) {
    return null;
  }
  return window.electron.getHealth();
}

/**
 * Generic IPC invoke wrapper for custom channels
 * @param channel - The IPC channel name
 * @param args - Arguments to pass to the handler
 * @returns Promise resolving to the handler response
 * @throws Error if not running in Electron
 */
export async function invoke<T = unknown>(channel: string, ...args: unknown[]): Promise<T> {
  if (!isElectron()) {
    throw new Error("Cannot invoke IPC: not running in Electron");
  }
  return window.electron.invoke(channel, ...args) as Promise<T>;
}

/**
 * Subscribe to IPC events from main process
 * @param channel - The IPC channel name
 * @param callback - Callback function to handle messages
 * @returns Unsubscribe function, or null if not in Electron
 */
export function on(
  channel: string,
  callback: (...callbackArgs: unknown[]) => void
): (() => void) | null {
  if (!isElectron()) {
    return null;
  }
  window.electron.on(channel, callback);
  // Note: Current implementation doesn't support removal
  // This could be enhanced in the future
  return () => {
    // No-op for now
  };
}

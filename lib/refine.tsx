import routerProvider from "@refinedev/nextjs-router";
import { ipcDataProvider } from "@/src/lib/data-provider/ipc-data-provider";

/**
 * Refine configuration
 * This file centralizes all Refine-related configuration
 */

/**
 * Data Provider Configuration
 *
 * This app uses a custom IPC data provider that communicates with the Electron
 * main process to fetch session and project data from the SQLite database.
 *
 * Supported resources:
 * - "projects": List and retrieve project data
 * - "sessions": List and retrieve session data with filtering
 *
 * Documentation: https://refine.dev/docs/data/data-provider/
 */
export const refineDataProvider = ipcDataProvider;

/**
 * Router provider configuration
 * Integrates Refine with Next.js App Router
 */
export const refineRouterProvider = routerProvider;

/**
 * Resource definitions
 *
 * Define your resources here. Each resource maps to a backend endpoint.
 */
export const refineResources: {
  name: string;
  list?: string;
  create?: string;
  edit?: string;
  show?: string;
  meta?: Record<string, unknown>;
}[] = [
  {
    name: "projects",
    list: "/projects",
    show: "/projects/:id",
  },
  {
    name: "sessions",
    list: "/sessions",
    show: "/sessions/:id",
  },
];

/**
 * Refine options
 * Global configuration for Refine behavior
 */
export const refineOptions = {
  syncWithLocation: true,
  warnWhenUnsavedChanges: true,
  useNewQueryKeys: true,
  projectId: "clocked",
  disableTelemetry: true,
};

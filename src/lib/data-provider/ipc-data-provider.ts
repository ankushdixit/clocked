/**
 * Refine data provider using Electron IPC
 *
 * This data provider enables Refine to fetch data from the Electron main process
 * via IPC. It supports projects and sessions resources with filtering, pagination,
 * and sorting capabilities.
 */

import type {
  DataProvider,
  BaseRecord,
  GetListParams,
  GetOneParams,
  GetManyParams,
  LogicalFilter,
} from "@refinedev/core";
import type {
  Project,
  Session,
  ProjectsResponse,
  ProjectResponse,
  SessionsResponse,
} from "../../../types/electron";

/**
 * Type guard to check if a filter is a LogicalFilter with field property
 */
function isLogicalFilter(filter: unknown): filter is LogicalFilter {
  return typeof filter === "object" && filter !== null && "field" in filter;
}

/**
 * Check if running in Electron environment
 */
function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electron;
}

/**
 * Get projects from IPC
 */
async function getProjects(): Promise<Project[]> {
  if (!isElectron()) {
    return [];
  }
  const response = (await window.electron.projects.getAll()) as ProjectsResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.projects || [];
}

/**
 * Get project by path from IPC
 */
async function getProjectByPath(path: string): Promise<Project | null> {
  if (!isElectron()) {
    return null;
  }
  const response = (await window.electron.projects.getByPath(path)) as ProjectResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.project || null;
}

/**
 * Get sessions from IPC
 */
async function getSessions(): Promise<Session[]> {
  if (!isElectron()) {
    return [];
  }
  const response = (await window.electron.sessions.getAll()) as SessionsResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.sessions || [];
}

/**
 * Get sessions by project from IPC
 */
async function getSessionsByProject(
  projectPath: string,
  limit?: number,
  offset?: number
): Promise<{ sessions: Session[]; total: number }> {
  if (!isElectron()) {
    return { sessions: [], total: 0 };
  }
  const response = (await window.electron.sessions.getByProject(
    projectPath,
    limit,
    offset
  )) as SessionsResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return {
    sessions: response.sessions || [],
    total: response.total || 0,
  };
}

/**
 * Get sessions by date range from IPC
 */
async function getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
  if (!isElectron()) {
    return [];
  }
  const response = (await window.electron.sessions.getByDateRange(
    startDate,
    endDate
  )) as SessionsResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.sessions || [];
}

/**
 * Apply pagination to an array
 */
function paginate<T>(items: T[], currentPage: number, pageSize: number): T[] {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

/**
 * Get list of projects with pagination
 */
async function getProjectList<TData>(
  currentPage: number,
  pageSize: number
): Promise<{ data: TData[]; total: number }> {
  const projects = await getProjects();
  return {
    data: paginate(projects, currentPage, pageSize) as unknown as TData[],
    total: projects.length,
  };
}

/**
 * Get list of sessions with pagination and filtering
 */
async function getSessionList<TData>(
  currentPage: number,
  pageSize: number,
  filters?: unknown[]
): Promise<{ data: TData[]; total: number }> {
  const projectFilter = filters?.find((f) => isLogicalFilter(f) && f.field === "projectPath");
  const dateStartFilter = filters?.find((f) => isLogicalFilter(f) && f.field === "startDate");
  const dateEndFilter = filters?.find((f) => isLogicalFilter(f) && f.field === "endDate");

  // Filter by project
  if (isLogicalFilter(projectFilter) && typeof projectFilter.value === "string") {
    const offset = (currentPage - 1) * pageSize;
    const result = await getSessionsByProject(projectFilter.value, pageSize, offset);
    return {
      data: result.sessions as unknown as TData[],
      total: result.total,
    };
  }

  // Filter by date range
  if (
    isLogicalFilter(dateStartFilter) &&
    isLogicalFilter(dateEndFilter) &&
    typeof dateStartFilter.value === "string" &&
    typeof dateEndFilter.value === "string"
  ) {
    const sessions = await getSessionsByDateRange(dateStartFilter.value, dateEndFilter.value);
    return {
      data: paginate(sessions, currentPage, pageSize) as unknown as TData[],
      total: sessions.length,
    };
  }

  // Get all sessions
  const sessions = await getSessions();
  return {
    data: paginate(sessions, currentPage, pageSize) as unknown as TData[],
    total: sessions.length,
  };
}

/**
 * Create the IPC data provider for Refine
 *
 * Supports two resources:
 * - "projects": List and retrieve project data
 * - "sessions": List and retrieve session data with filtering
 */
export function createIpcDataProvider(): DataProvider {
  return {
    getList: async <TData extends BaseRecord = BaseRecord>({
      resource,
      pagination,
      filters,
    }: GetListParams) => {
      const currentPage = pagination?.currentPage ?? 1;
      const pageSize = pagination?.pageSize ?? 10;

      if (resource === "projects") {
        return getProjectList<TData>(currentPage, pageSize);
      }

      if (resource === "sessions") {
        return getSessionList<TData>(currentPage, pageSize, filters);
      }

      throw new Error(`Resource "${resource}" not supported`);
    },

    getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams) => {
      if (resource === "projects") {
        const project = await getProjectByPath(id as string);
        if (!project) {
          throw new Error(`Project with path "${id}" not found`);
        }
        return {
          data: project as unknown as TData,
        };
      }

      if (resource === "sessions") {
        // For sessions, we need to get all sessions and find by ID
        // This is not ideal for performance, but works for now
        const sessions = await getSessions();
        const session = sessions.find((s) => s.id === id);
        if (!session) {
          throw new Error(`Session with id "${id}" not found`);
        }
        return {
          data: session as unknown as TData,
        };
      }

      throw new Error(`Resource "${resource}" not supported`);
    },

    getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams) => {
      if (resource === "projects") {
        const projects = await getProjects();
        const filteredProjects = projects.filter((p) => ids.includes(p.path));
        return {
          data: filteredProjects as unknown as TData[],
        };
      }

      if (resource === "sessions") {
        const sessions = await getSessions();
        const filteredSessions = sessions.filter((s) => ids.includes(s.id));
        return {
          data: filteredSessions as unknown as TData[],
        };
      }

      throw new Error(`Resource "${resource}" not supported`);
    },

    // Not implemented - read-only data provider
    create: async () => {
      throw new Error("Create operation not supported - this is a read-only data provider");
    },

    update: async () => {
      throw new Error("Update operation not supported - this is a read-only data provider");
    },

    deleteOne: async () => {
      throw new Error("Delete operation not supported - this is a read-only data provider");
    },

    getApiUrl: () => "ipc://electron",
  };
}

/**
 * Default IPC data provider instance
 */
export const ipcDataProvider = createIpcDataProvider();

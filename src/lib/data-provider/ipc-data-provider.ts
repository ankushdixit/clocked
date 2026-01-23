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
  UpdateParams,
  LogicalFilter,
} from "@refinedev/core";
import type {
  Project,
  ProjectGroup,
  Session,
  ProjectsResponse,
  ProjectResponse,
  SessionsResponse,
  ProjectGroupsResponse,
  ProjectGroupResponse,
  SuccessResponse,
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
 * Get all project groups from IPC
 */
async function getProjectGroups(): Promise<ProjectGroup[]> {
  if (!isElectron()) {
    return [];
  }
  const response = (await window.electron.groups.getAll()) as ProjectGroupsResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.groups || [];
}

/**
 * Helper to handle IPC response errors
 */
function handleIpcResponse(response: SuccessResponse): void {
  if (response.error) {
    throw new Error(response.error);
  }
}

/**
 * Update a project via IPC
 */

async function updateProject(
  path: string,
  data: {
    isHidden?: boolean;
    groupId?: string | null;
    mergedInto?: string | null;
    mergeSources?: string[];
  }
): Promise<Project | null> {
  if (!isElectron()) {
    return null;
  }

  // Handle each field update
  if (data.isHidden !== undefined) {
    const response = (await window.electron.projects.setHidden(
      path,
      data.isHidden
    )) as SuccessResponse;
    handleIpcResponse(response);
  }

  if (data.groupId !== undefined) {
    const response = (await window.electron.projects.setGroup(
      path,
      data.groupId
    )) as SuccessResponse;
    handleIpcResponse(response);
  }

  // Handle merge operation (merge sources into this project as primary)
  if (data.mergeSources && data.mergeSources.length > 0) {
    const response = (await window.electron.projects.merge(
      data.mergeSources,
      path
    )) as SuccessResponse;
    handleIpcResponse(response);
  }

  // Handle unmerge operation (set mergedInto to null)
  if (data.mergedInto === null) {
    const response = (await window.electron.projects.unmerge(path)) as SuccessResponse;
    handleIpcResponse(response);
  }

  // Return the updated project
  return getProjectByPath(path);
}

/**
 * Create a project group via IPC
 */
async function createGroup(name: string, color?: string | null): Promise<ProjectGroup> {
  if (!isElectron()) {
    throw new Error("Not running in Electron environment");
  }
  const response = (await window.electron.groups.create(name, color)) as ProjectGroupResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  if (!response.group) {
    throw new Error("Failed to create group");
  }
  return response.group;
}

/**
 * Update a project group via IPC
 */
async function updateGroup(
  id: string,
  updates: { name?: string; color?: string | null; sortOrder?: number }
): Promise<ProjectGroup | null> {
  if (!isElectron()) {
    return null;
  }
  const response = (await window.electron.groups.update(id, updates)) as ProjectGroupResponse;
  if (response.error) {
    throw new Error(response.error);
  }
  return response.group || null;
}

/**
 * Delete a project group via IPC
 */
async function deleteGroup(id: string): Promise<void> {
  if (!isElectron()) {
    return;
  }
  const response = (await window.electron.groups.delete(id)) as SuccessResponse;
  if (response.error) {
    throw new Error(response.error);
  }
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
 * Get list of project groups
 */
async function getGroupList<TData>(): Promise<{ data: TData[]; total: number }> {
  const groups = await getProjectGroups();
  return {
    data: groups as unknown as TData[],
    total: groups.length,
  };
}

/**
 * Handle getOne for projects resource
 */
async function getOneProject<TData>(id: string | number): Promise<{ data: TData }> {
  const project = await getProjectByPath(id as string);
  if (!project) {
    throw new Error(`Project with path "${id}" not found`);
  }
  return { data: project as unknown as TData };
}

/**
 * Handle getOne for sessions resource
 */
async function getOneSession<TData>(id: string | number): Promise<{ data: TData }> {
  // For sessions, we need to get all sessions and find by ID
  // This is not ideal for performance, but works for now
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === id);
  if (!session) {
    throw new Error(`Session with id "${id}" not found`);
  }
  return { data: session as unknown as TData };
}

/**
 * Handle getOne for groups resource
 */
async function getOneGroup<TData>(id: string | number): Promise<{ data: TData }> {
  const groups = await getProjectGroups();
  const group = groups.find((g) => g.id === id);
  if (!group) {
    throw new Error(`Group with id "${id}" not found`);
  }
  return { data: group as unknown as TData };
}

/**
 * Handle getMany for projects resource
 */
async function getManyProjects<TData>(ids: (string | number)[]): Promise<{ data: TData[] }> {
  const projects = await getProjects();
  const filteredProjects = projects.filter((p) => ids.includes(p.path));
  return { data: filteredProjects as unknown as TData[] };
}

/**
 * Handle getMany for sessions resource
 */
async function getManySessions<TData>(ids: (string | number)[]): Promise<{ data: TData[] }> {
  const sessions = await getSessions();
  const filteredSessions = sessions.filter((s) => ids.includes(s.id));
  return { data: filteredSessions as unknown as TData[] };
}

/**
 * Handle getMany for groups resource
 */
async function getManyGroups<TData>(ids: (string | number)[]): Promise<{ data: TData[] }> {
  const groups = await getProjectGroups();
  const filteredGroups = groups.filter((g) => ids.includes(g.id));
  return { data: filteredGroups as unknown as TData[] };
}

/**
 * Handle update for projects resource
 */
async function updateProjectResource<TData>(
  id: string | number,
  variables: unknown
): Promise<{ data: TData }> {
  const data = variables as {
    isHidden?: boolean;
    groupId?: string | null;
    mergedInto?: string | null;
    mergeSources?: string[];
  };
  const project = await updateProject(id as string, data);
  if (!project) {
    throw new Error(`Project with path "${id}" not found`);
  }
  return { data: project as unknown as TData };
}

/**
 * Handle update for groups resource
 */
async function updateGroupResource<TData>(
  id: string | number,
  variables: unknown
): Promise<{ data: TData }> {
  const data = variables as { name?: string; color?: string | null; sortOrder?: number };
  const group = await updateGroup(id as string, data);
  if (!group) {
    throw new Error(`Group with id "${id}" not found`);
  }
  return { data: group as unknown as TData };
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

      if (resource === "projects") return getProjectList<TData>(currentPage, pageSize);
      if (resource === "sessions") return getSessionList<TData>(currentPage, pageSize, filters);
      if (resource === "groups") return getGroupList<TData>();
      throw new Error(`Resource "${resource}" not supported`);
    },

    getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id }: GetOneParams) => {
      if (resource === "projects") return getOneProject<TData>(id);
      if (resource === "sessions") return getOneSession<TData>(id);
      if (resource === "groups") return getOneGroup<TData>(id);
      throw new Error(`Resource "${resource}" not supported`);
    },

    getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams) => {
      if (resource === "projects") return getManyProjects<TData>(ids);
      if (resource === "sessions") return getManySessions<TData>(ids);
      if (resource === "groups") return getManyGroups<TData>(ids);
      throw new Error(`Resource "${resource}" not supported`);
    },

    create: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      variables,
    }: {
      resource: string;
      variables: TVariables;
    }) => {
      if (resource === "groups") {
        const { name, color } = variables as { name: string; color?: string | null };
        const group = await createGroup(name, color);
        return { data: group as unknown as TData };
      }
      throw new Error(`Create operation not supported for resource "${resource}"`);
    },

    update: async <TData extends BaseRecord = BaseRecord, TVariables = object>({
      resource,
      id,
      variables,
    }: UpdateParams<TVariables>) => {
      if (resource === "projects") return updateProjectResource<TData>(id, variables);
      if (resource === "groups") return updateGroupResource<TData>(id, variables);
      throw new Error(`Update operation not supported for resource "${resource}"`);
    },

    deleteOne: async <TData extends BaseRecord = BaseRecord>({
      resource,
      id,
    }: {
      resource: string;
      id: string | number;
    }) => {
      if (resource === "groups") {
        await deleteGroup(id as string);
        return { data: { id } as unknown as TData };
      }
      throw new Error(`Delete operation not supported for resource "${resource}"`);
    },

    getApiUrl: () => "ipc://electron",
  };
}

/**
 * Default IPC data provider instance
 */
export const ipcDataProvider = createIpcDataProvider();

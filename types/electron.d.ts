/**
 * Project data model
 */
export interface Project {
  path: string;
  name: string;
  firstActivity: string;
  lastActivity: string;
  sessionCount: number;
  messageCount: number;
}

/**
 * Session data model
 */
export interface Session {
  id: string;
  projectPath: string;
  created: string;
  modified: string;
  duration: number;
  messageCount: number;
  summary: string | null;
  firstPrompt: string | null;
  gitBranch: string | null;
}

/**
 * Response types for IPC calls
 */
export interface ProjectsResponse {
  projects?: Project[];
  error?: string;
}

export interface ProjectResponse {
  project?: Project | null;
  error?: string;
}

export interface SessionsResponse {
  sessions?: Session[];
  total?: number;
  error?: string;
}

export interface CountResponse {
  count?: number;
  error?: string;
}

export interface SyncResponse {
  success?: boolean;
  projectCount?: number;
  sessionCount?: number;
  errorCount?: number;
  error?: string;
}

export interface DataStatusResponse {
  hasClaudeProjects?: boolean;
  claudeProjectsPath?: string;
  projectCount?: number;
  sessionCount?: number;
  error?: string;
}

declare global {
  interface Window {
    electron: {
      // Legacy convenience methods
      getAppVersion: () => Promise<string>;
      getHealth: () => Promise<{ status: string; timestamp: string }>;

      // Projects API
      projects: {
        getAll: () => Promise<ProjectsResponse>;
        getByPath: (_path: string) => Promise<ProjectResponse>;
        getCount: () => Promise<CountResponse>;
      };

      // Sessions API
      sessions: {
        getAll: () => Promise<SessionsResponse>;
        getByProject: (
          _projectPath: string,
          _limit?: number,
          _offset?: number
        ) => Promise<SessionsResponse>;
        getByDateRange: (_startDate: string, _endDate: string) => Promise<SessionsResponse>;
        getCount: () => Promise<CountResponse>;
      };

      // Data management API
      data: {
        sync: () => Promise<SyncResponse>;
        status: () => Promise<DataStatusResponse>;
      };

      // Generic invoke for custom channels
      invoke: (_channel: string, ..._args: unknown[]) => Promise<unknown>;
      on: (_channel: string, _callback: (..._args: unknown[]) => void) => void;
    };
  }
}

export {};

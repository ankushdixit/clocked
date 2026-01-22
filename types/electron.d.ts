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
  totalTime: number; // Total session duration in milliseconds
  isHidden: boolean;
  groupId: string | null;
  isDefault: boolean;
}

/**
 * Project group data model
 */
export interface ProjectGroup {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  sortOrder: number;
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

export interface ProjectGroupsResponse {
  groups?: ProjectGroup[];
  error?: string;
}

export interface ProjectGroupResponse {
  group?: ProjectGroup | null;
  error?: string;
}

export interface SuccessResponse {
  success?: boolean;
  error?: string;
}

/**
 * Daily activity data for heatmap
 */
export interface DailyActivity {
  date: string; // "2026-01-15"
  sessionCount: number;
  totalTime: number; // ms
}

/**
 * Project summary for top projects list
 */
export interface ProjectSummary {
  path: string;
  name: string;
  sessionCount: number;
  totalTime: number; // ms
  estimatedCost: number; // dollars
}

/**
 * Monthly summary data for dashboard
 */
export interface MonthlySummary {
  month: string; // "2026-01"
  totalSessions: number;
  totalActiveTime: number; // ms
  estimatedApiCost: number; // dollars
  humanTime: number; // ms (placeholder until Story 2.1)
  claudeTime: number; // ms (placeholder until Story 2.1)
  dailyActivity: DailyActivity[];
  topProjects: ProjectSummary[];
}

export interface MonthlySummaryResponse {
  summary?: MonthlySummary;
  error?: string;
}

declare global {
  interface Window {
    electron: {
      // Platform detection (synchronous)
      // eslint-disable-next-line no-undef
      platform: NodeJS.Platform;

      // Legacy convenience methods
      getAppVersion: () => Promise<string>;
      getHealth: () => Promise<{ status: string; timestamp: string }>;

      // Window control methods
      window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
        isMaximized: () => Promise<boolean>;
      };

      // Projects API
      projects: {
        getAll: (_options?: { includeHidden?: boolean }) => Promise<ProjectsResponse>;
        getByPath: (_path: string) => Promise<ProjectResponse>;
        getCount: () => Promise<CountResponse>;
        setHidden: (_path: string, _hidden: boolean) => Promise<SuccessResponse>;
        setGroup: (_path: string, _groupId: string | null) => Promise<SuccessResponse>;
        setDefault: (_path: string) => Promise<SuccessResponse>;
        getDefault: () => Promise<ProjectResponse>;
      };

      // Project Groups API
      groups: {
        getAll: () => Promise<ProjectGroupsResponse>;
        create: (_name: string, _color?: string | null) => Promise<ProjectGroupResponse>;
        update: (
          _id: string,
          _updates: { name?: string; color?: string | null; sortOrder?: number }
        ) => Promise<ProjectGroupResponse>;
        delete: (_id: string) => Promise<SuccessResponse>;
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

      // Analytics API
      analytics: {
        getMonthlySummary: (_month: string) => Promise<MonthlySummaryResponse>;
      };

      // Generic invoke for custom channels
      invoke: (_channel: string, ..._args: unknown[]) => Promise<unknown>;
      on: (_channel: string, _callback: (..._args: unknown[]) => void) => void;
    };
  }
}

export {};

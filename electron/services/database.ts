/**
 * SQLite database initialization and queries for Clocked
 *
 * This module manages the SQLite database that caches session and project data.
 * The database is stored at `~/.clocked/cache.db`
 */

import Database from "better-sqlite3";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

/**
 * Project data model
 */
export interface Project {
  path: string; // Primary key, URL-decoded project path
  name: string; // Derived from last segment of path
  firstActivity: string; // ISO datetime, earliest session created
  lastActivity: string; // ISO datetime, latest session modified
  sessionCount: number; // Count of sessions
  messageCount: number; // Sum of messages across sessions
  totalTime: number; // Total session duration in milliseconds
  isHidden: boolean; // Whether the project is hidden from the main list
  groupId: string | null; // Foreign key to project_groups
  isDefault: boolean; // Whether this is the default project shown on dashboard
}

/**
 * Project group data model
 */
export interface ProjectGroup {
  id: string; // Primary key, UUID
  name: string; // Display name
  color: string | null; // Optional color for visual distinction
  createdAt: string; // ISO datetime
  sortOrder: number; // For ordering groups
}

/**
 * Session data model
 */
export interface Session {
  id: string; // Primary key, session UUID
  projectPath: string; // Foreign key to Project
  created: string; // ISO datetime, session start
  modified: string; // ISO datetime, session end
  duration: number; // ms, modified - created
  messageCount: number; // From sessions-index.json
  summary: string | null; // Optional, auto-generated
  firstPrompt: string | null; // Optional, first user message
  gitBranch: string | null; // Optional, git branch name
}

/**
 * Session data for insertion (without computed fields)
 */
export interface SessionInput {
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
 * Project data for insertion
 */
export interface ProjectInput {
  path: string;
  name: string;
  firstActivity: string;
  lastActivity: string;
  sessionCount: number;
  messageCount: number;
  totalTime: number;
}

// Database singleton
let db: Database.Database | null = null;

/**
 * Run database migrations for existing databases
 * This adds new columns that may not exist in older database versions
 */
function runMigrations(database: Database.Database): void {
  // Check if is_hidden column exists on projects table
  const projectColumns = database.prepare("PRAGMA table_info(projects)").all() as {
    name: string;
  }[];
  const hasIsHidden = projectColumns.some((col) => col.name === "is_hidden");

  if (!hasIsHidden) {
    // Add new columns to projects table
    database.exec(`
      ALTER TABLE projects ADD COLUMN is_hidden INTEGER DEFAULT 0;
      ALTER TABLE projects ADD COLUMN group_id TEXT DEFAULT NULL;
      ALTER TABLE projects ADD COLUMN is_default INTEGER DEFAULT 0;
    `);

    // Create index for group_id
    database.exec("CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_id);");
  }
}

/**
 * Get the database file path
 * @returns Path to ~/.clocked/cache.db
 */
export function getDatabasePath(): string {
  return join(homedir(), ".clocked", "cache.db");
}

/**
 * Get the database directory path
 * @returns Path to ~/.clocked/
 */
export function getDatabaseDir(): string {
  return join(homedir(), ".clocked");
}

/**
 * Initialize the database and create tables if they don't exist
 * @returns The database instance
 */
export function initializeDatabase(): Database.Database {
  // Return existing connection but still run migrations
  // (migrations are idempotent so safe to run multiple times)
  if (db) {
    runMigrations(db);
    return db;
  }

  const dbDir = getDatabaseDir();
  const dbPath = getDatabasePath();

  // Ensure the directory exists
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  // Open or create the database
  db = new Database(dbPath);

  // Enable WAL mode for better performance
  db.pragma("journal_mode = WAL");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS project_groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT NULL,
      created_at TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS projects (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      first_activity TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      session_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0,
      total_time INTEGER DEFAULT 0,
      is_hidden INTEGER DEFAULT 0,
      group_id TEXT DEFAULT NULL REFERENCES project_groups(id) ON DELETE SET NULL,
      is_default INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL REFERENCES projects(path),
      created TEXT NOT NULL,
      modified TEXT NOT NULL,
      duration INTEGER NOT NULL,
      message_count INTEGER DEFAULT 0,
      summary TEXT,
      first_prompt TEXT,
      git_branch TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
    CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created);
    CREATE INDEX IF NOT EXISTS idx_sessions_modified ON sessions(modified);
    CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_id);
  `);

  // Run migrations for existing databases
  runMigrations(db);

  return db;
}

/**
 * Get the database instance, initializing if needed
 * @returns The database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    return initializeDatabase();
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// ============================================================================
// Project Queries
// ============================================================================

/**
 * Insert or update a project
 * @param project - Project data to upsert
 */
export function upsertProject(project: ProjectInput): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO projects (path, name, first_activity, last_activity, session_count, message_count, total_time)
    VALUES (@path, @name, @firstActivity, @lastActivity, @sessionCount, @messageCount, @totalTime)
    ON CONFLICT(path) DO UPDATE SET
      name = @name,
      first_activity = MIN(first_activity, @firstActivity),
      last_activity = MAX(last_activity, @lastActivity),
      session_count = @sessionCount,
      message_count = @messageCount,
      total_time = @totalTime
  `);
  stmt.run({
    path: project.path,
    name: project.name,
    firstActivity: project.firstActivity,
    lastActivity: project.lastActivity,
    sessionCount: project.sessionCount,
    messageCount: project.messageCount,
    totalTime: project.totalTime,
  });
}

/**
 * Options for getAllProjects
 */
export interface GetProjectsOptions {
  includeHidden?: boolean;
}

/**
 * Get all projects
 * @param options - Options for filtering
 * @returns Array of all projects
 */
export function getAllProjects(options: GetProjectsOptions = {}): Project[] {
  const db = getDatabase();
  const { includeHidden = false } = options;

  const whereClause = includeHidden ? "" : "WHERE is_hidden = 0";

  const stmt = db.prepare(`
    SELECT
      path,
      name,
      first_activity as firstActivity,
      last_activity as lastActivity,
      session_count as sessionCount,
      message_count as messageCount,
      total_time as totalTime,
      is_hidden as isHidden,
      group_id as groupId,
      is_default as isDefault
    FROM projects
    ${whereClause}
    ORDER BY last_activity DESC
  `);

  // Convert SQLite integers to booleans
  const projects = stmt.all() as Array<
    Omit<Project, "isHidden" | "isDefault"> & { isHidden: number; isDefault: number }
  >;
  return projects.map((p) => ({
    ...p,
    isHidden: p.isHidden === 1,
    isDefault: p.isDefault === 1,
  }));
}

/**
 * Get a project by path
 * @param path - The project path
 * @returns The project or null if not found
 */
export function getProjectByPath(path: string): Project | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      path,
      name,
      first_activity as firstActivity,
      last_activity as lastActivity,
      session_count as sessionCount,
      message_count as messageCount,
      total_time as totalTime,
      is_hidden as isHidden,
      group_id as groupId,
      is_default as isDefault
    FROM projects
    WHERE path = ?
  `);
  const row = stmt.get(path) as
    | (Omit<Project, "isHidden" | "isDefault"> & { isHidden: number; isDefault: number })
    | undefined;
  if (!row) return null;
  return {
    ...row,
    isHidden: row.isHidden === 1,
    isDefault: row.isDefault === 1,
  };
}

/**
 * Delete all projects
 */
export function deleteAllProjects(): void {
  const db = getDatabase();
  db.exec("DELETE FROM projects");
}

/**
 * Delete a project by path
 * @param path - Project path to delete
 */
export function deleteProject(path: string): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM projects WHERE path = ?");
  stmt.run(path);
}

/**
 * Delete projects whose paths are not in the provided set
 * This is used to clean up orphaned project entries during sync
 * @param validPaths - Set of project paths that should be kept
 * @returns Number of projects deleted
 */
export function deleteOrphanedProjects(validPaths: Set<string>): number {
  const allProjects = getAllProjects({ includeHidden: true });
  let deletedCount = 0;

  for (const project of allProjects) {
    if (!validPaths.has(project.path)) {
      deleteProject(project.path);
      deletedCount++;
    }
  }

  return deletedCount;
}

// ============================================================================
// Session Queries
// ============================================================================

/**
 * Insert or update a session
 * @param session - Session data to upsert
 */
export function upsertSession(session: SessionInput): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO sessions (id, project_path, created, modified, duration, message_count, summary, first_prompt, git_branch)
    VALUES (@id, @projectPath, @created, @modified, @duration, @messageCount, @summary, @firstPrompt, @gitBranch)
    ON CONFLICT(id) DO UPDATE SET
      project_path = @projectPath,
      created = @created,
      modified = @modified,
      duration = @duration,
      message_count = @messageCount,
      summary = @summary,
      first_prompt = @firstPrompt,
      git_branch = @gitBranch
  `);
  stmt.run({
    id: session.id,
    projectPath: session.projectPath,
    created: session.created,
    modified: session.modified,
    duration: session.duration,
    messageCount: session.messageCount,
    summary: session.summary,
    firstPrompt: session.firstPrompt,
    gitBranch: session.gitBranch,
  });
}

/**
 * Insert multiple sessions in a transaction
 * @param sessions - Array of sessions to insert
 */
export function upsertSessions(sessions: SessionInput[]): void {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO sessions (id, project_path, created, modified, duration, message_count, summary, first_prompt, git_branch)
    VALUES (@id, @projectPath, @created, @modified, @duration, @messageCount, @summary, @firstPrompt, @gitBranch)
    ON CONFLICT(id) DO UPDATE SET
      project_path = @projectPath,
      created = @created,
      modified = @modified,
      duration = @duration,
      message_count = @messageCount,
      summary = @summary,
      first_prompt = @firstPrompt,
      git_branch = @gitBranch
  `);

  const transaction = db.transaction((sessions: SessionInput[]) => {
    for (const session of sessions) {
      stmt.run({
        id: session.id,
        projectPath: session.projectPath,
        created: session.created,
        modified: session.modified,
        duration: session.duration,
        messageCount: session.messageCount,
        summary: session.summary,
        firstPrompt: session.firstPrompt,
        gitBranch: session.gitBranch,
      });
    }
  });

  transaction(sessions);
}

/**
 * Get all sessions
 * @returns Array of all sessions
 */
export function getAllSessions(): Session[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      id,
      project_path as projectPath,
      created,
      modified,
      duration,
      message_count as messageCount,
      summary,
      first_prompt as firstPrompt,
      git_branch as gitBranch
    FROM sessions
    ORDER BY modified DESC
  `);
  return stmt.all() as Session[];
}

/**
 * Get sessions by project path with pagination
 * @param projectPath - The project path to filter by
 * @param limit - Maximum number of sessions to return (default: no limit)
 * @param offset - Number of sessions to skip (default: 0)
 * @returns Object with sessions array and total count
 */
export function getSessionsByProject(
  projectPath: string,
  limit?: number,
  offset: number = 0
): { sessions: Session[]; total: number } {
  const db = getDatabase();

  // Get total count
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM sessions WHERE project_path = ?");
  const { count: total } = countStmt.get(projectPath) as { count: number };

  // Get paginated sessions
  let query = `
    SELECT
      id,
      project_path as projectPath,
      created,
      modified,
      duration,
      message_count as messageCount,
      summary,
      first_prompt as firstPrompt,
      git_branch as gitBranch
    FROM sessions
    WHERE project_path = ?
    ORDER BY modified DESC
  `;

  if (limit !== undefined) {
    query += ` LIMIT ? OFFSET ?`;
    const stmt = db.prepare(query);
    return {
      sessions: stmt.all(projectPath, limit, offset) as Session[],
      total,
    };
  }

  const stmt = db.prepare(query);
  return {
    sessions: stmt.all(projectPath) as Session[],
    total,
  };
}

/**
 * Get sessions within a date range
 * @param startDate - ISO datetime string for range start (inclusive)
 * @param endDate - ISO datetime string for range end (inclusive)
 * @returns Array of sessions within the date range
 */
export function getSessionsByDateRange(startDate: string, endDate: string): Session[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      id,
      project_path as projectPath,
      created,
      modified,
      duration,
      message_count as messageCount,
      summary,
      first_prompt as firstPrompt,
      git_branch as gitBranch
    FROM sessions
    WHERE created >= ? AND created <= ?
    ORDER BY created DESC
  `);
  return stmt.all(startDate, endDate) as Session[];
}

/**
 * Get a session by ID
 * @param id - The session ID
 * @returns The session or null if not found
 */
export function getSessionById(id: string): Session | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      id,
      project_path as projectPath,
      created,
      modified,
      duration,
      message_count as messageCount,
      summary,
      first_prompt as firstPrompt,
      git_branch as gitBranch
    FROM sessions
    WHERE id = ?
  `);
  return (stmt.get(id) as Session) || null;
}

/**
 * Delete all sessions
 */
export function deleteAllSessions(): void {
  const db = getDatabase();
  db.exec("DELETE FROM sessions");
}

/**
 * Delete sessions for a specific project
 * @param projectPath - The project path
 */
export function deleteSessionsByProject(projectPath: string): void {
  const db = getDatabase();
  const stmt = db.prepare("DELETE FROM sessions WHERE project_path = ?");
  stmt.run(projectPath);
}

/**
 * Get session count
 * @returns Total number of sessions
 */
export function getSessionCount(): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM sessions");
  const result = stmt.get() as { count: number };
  return result.count;
}

/**
 * Get project count
 * @returns Total number of projects
 */
export function getProjectCount(): number {
  const db = getDatabase();
  const stmt = db.prepare("SELECT COUNT(*) as count FROM projects");
  const result = stmt.get() as { count: number };
  return result.count;
}

// ============================================================================
// Project Management Queries
// ============================================================================

/**
 * Set the hidden status of a project
 * @param path - The project path
 * @param hidden - Whether the project should be hidden
 */
export function setProjectHidden(path: string, hidden: boolean): void {
  const db = getDatabase();
  const stmt = db.prepare("UPDATE projects SET is_hidden = ? WHERE path = ?");
  stmt.run(hidden ? 1 : 0, path);
}

/**
 * Set the group of a project
 * @param path - The project path
 * @param groupId - The group ID or null to unassign
 */
export function setProjectGroup(path: string, groupId: string | null): void {
  const db = getDatabase();
  const stmt = db.prepare("UPDATE projects SET group_id = ? WHERE path = ?");
  stmt.run(groupId, path);
}

/**
 * Set a project as the default project
 * Clears the previous default project first
 * @param path - The project path to set as default
 */
export function setDefaultProject(path: string): void {
  const db = getDatabase();
  const transaction = db.transaction(() => {
    // Clear previous default
    db.prepare("UPDATE projects SET is_default = 0 WHERE is_default = 1").run();
    // Set new default
    db.prepare("UPDATE projects SET is_default = 1 WHERE path = ?").run(path);
  });
  transaction();
}

/**
 * Clear the default project (no project is default)
 */
export function clearDefaultProject(): void {
  const db = getDatabase();
  db.prepare("UPDATE projects SET is_default = 0 WHERE is_default = 1").run();
}

/**
 * Get the default project
 * @returns The default project or null if none set
 */
export function getDefaultProject(): Project | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      path,
      name,
      first_activity as firstActivity,
      last_activity as lastActivity,
      session_count as sessionCount,
      message_count as messageCount,
      total_time as totalTime,
      is_hidden as isHidden,
      group_id as groupId,
      is_default as isDefault
    FROM projects
    WHERE is_default = 1
  `);
  const row = stmt.get() as
    | (Omit<Project, "isHidden" | "isDefault"> & { isHidden: number; isDefault: number })
    | undefined;
  if (!row) return null;
  return {
    ...row,
    isHidden: row.isHidden === 1,
    isDefault: row.isDefault === 1,
  };
}

/**
 * Get all hidden projects
 * @returns Array of hidden projects
 */
export function getHiddenProjects(): Project[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      path,
      name,
      first_activity as firstActivity,
      last_activity as lastActivity,
      session_count as sessionCount,
      message_count as messageCount,
      total_time as totalTime,
      is_hidden as isHidden,
      group_id as groupId,
      is_default as isDefault
    FROM projects
    WHERE is_hidden = 1
    ORDER BY last_activity DESC
  `);
  const projects = stmt.all() as Array<
    Omit<Project, "isHidden" | "isDefault"> & { isHidden: number; isDefault: number }
  >;
  return projects.map((p) => ({
    ...p,
    isHidden: p.isHidden === 1,
    isDefault: p.isDefault === 1,
  }));
}

// ============================================================================
// Project Group Queries
// ============================================================================

/**
 * Input for creating a project group
 */
export interface ProjectGroupInput {
  name: string;
  color?: string | null;
}

/**
 * Get all project groups
 * @returns Array of all project groups
 */
export function getAllProjectGroups(): ProjectGroup[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      color,
      created_at as createdAt,
      sort_order as sortOrder
    FROM project_groups
    ORDER BY sort_order ASC, name ASC
  `);
  return stmt.all() as ProjectGroup[];
}

/**
 * Get a project group by ID
 * @param id - The group ID
 * @returns The project group or null if not found
 */
export function getProjectGroupById(id: string): ProjectGroup | null {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      id,
      name,
      color,
      created_at as createdAt,
      sort_order as sortOrder
    FROM project_groups
    WHERE id = ?
  `);
  return (stmt.get(id) as ProjectGroup) || null;
}

/**
 * Create a new project group
 * @param input - The group data
 * @returns The created project group
 */
export function createProjectGroup(input: ProjectGroupInput): ProjectGroup {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  // Get max sort order
  const maxOrderResult = db
    .prepare("SELECT MAX(sort_order) as maxOrder FROM project_groups")
    .get() as {
    maxOrder: number | null;
  };
  const sortOrder = (maxOrderResult.maxOrder ?? -1) + 1;

  const stmt = db.prepare(`
    INSERT INTO project_groups (id, name, color, created_at, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, input.name, input.color ?? null, createdAt, sortOrder);

  return {
    id,
    name: input.name,
    color: input.color ?? null,
    createdAt,
    sortOrder,
  };
}

/**
 * Update a project group
 * @param id - The group ID
 * @param updates - The fields to update
 * @returns The updated project group or null if not found
 */
export function updateProjectGroup(
  id: string,
  updates: { name?: string; color?: string | null; sortOrder?: number }
): ProjectGroup | null {
  const db = getDatabase();
  const existing = getProjectGroupById(id);
  if (!existing) return null;

  const setClauses: string[] = [];
  const values: unknown[] = [];

  if (updates.name !== undefined) {
    setClauses.push("name = ?");
    values.push(updates.name);
  }
  if (updates.color !== undefined) {
    setClauses.push("color = ?");
    values.push(updates.color);
  }
  if (updates.sortOrder !== undefined) {
    setClauses.push("sort_order = ?");
    values.push(updates.sortOrder);
  }

  if (setClauses.length === 0) {
    return existing;
  }

  values.push(id);
  const stmt = db.prepare(`UPDATE project_groups SET ${setClauses.join(", ")} WHERE id = ?`);
  stmt.run(...values);

  return getProjectGroupById(id);
}

/**
 * Delete a project group
 * Projects in this group will have their group_id set to null
 * @param id - The group ID
 */
export function deleteProjectGroup(id: string): void {
  const db = getDatabase();
  const transaction = db.transaction(() => {
    // Unassign all projects from this group (handled by ON DELETE SET NULL in FK)
    // but we do it explicitly for safety
    db.prepare("UPDATE projects SET group_id = NULL WHERE group_id = ?").run(id);
    // Delete the group
    db.prepare("DELETE FROM project_groups WHERE id = ?").run(id);
  });
  transaction();
}

/**
 * Clear all data from the database (for testing/reset)
 */
export function clearDatabase(): void {
  const db = getDatabase();
  db.exec("DELETE FROM sessions");
  db.exec("DELETE FROM projects");
  db.exec("DELETE FROM project_groups");
}

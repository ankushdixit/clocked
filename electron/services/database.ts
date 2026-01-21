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
}

// Database singleton
let db: Database.Database | null = null;

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
  if (db) {
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
    CREATE TABLE IF NOT EXISTS projects (
      path TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      first_activity TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      session_count INTEGER DEFAULT 0,
      message_count INTEGER DEFAULT 0
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
  `);

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
    INSERT INTO projects (path, name, first_activity, last_activity, session_count, message_count)
    VALUES (@path, @name, @firstActivity, @lastActivity, @sessionCount, @messageCount)
    ON CONFLICT(path) DO UPDATE SET
      name = @name,
      first_activity = MIN(first_activity, @firstActivity),
      last_activity = MAX(last_activity, @lastActivity),
      session_count = @sessionCount,
      message_count = @messageCount
  `);
  stmt.run({
    path: project.path,
    name: project.name,
    firstActivity: project.firstActivity,
    lastActivity: project.lastActivity,
    sessionCount: project.sessionCount,
    messageCount: project.messageCount,
  });
}

/**
 * Get all projects
 * @returns Array of all projects
 */
export function getAllProjects(): Project[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT
      path,
      name,
      first_activity as firstActivity,
      last_activity as lastActivity,
      session_count as sessionCount,
      message_count as messageCount
    FROM projects
    ORDER BY last_activity DESC
  `);
  return stmt.all() as Project[];
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
      message_count as messageCount
    FROM projects
    WHERE path = ?
  `);
  return (stmt.get(path) as Project) || null;
}

/**
 * Delete all projects
 */
export function deleteAllProjects(): void {
  const db = getDatabase();
  db.exec("DELETE FROM projects");
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

/**
 * Clear all data from the database (for testing/reset)
 */
export function clearDatabase(): void {
  const db = getDatabase();
  db.exec("DELETE FROM sessions");
  db.exec("DELETE FROM projects");
}

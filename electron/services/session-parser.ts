/**
 * Session index parser for Claude Code sessions
 *
 * This module parses sessions-index.json files from Claude Code project directories
 * and populates the SQLite cache with session data.
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { decodeProjectPath, getProjectName } from "./path-decoder";
import { upsertProject, upsertSessions, SessionInput, ProjectInput } from "./database";

/**
 * Raw session entry from sessions-index.json
 */
interface SessionIndexEntry {
  session_id?: string;
  sessionId?: string;
  project_path?: string;
  projectPath?: string;
  created?: string;
  modified?: string;
  message_count?: number;
  messageCount?: number;
  summary?: string;
  first_prompt?: string;
  firstPrompt?: string;
  git_branch?: string;
  gitBranch?: string;
}

/**
 * Result of parsing sessions for a project
 */
interface ParseResult {
  projectPath: string;
  projectName: string;
  sessions: SessionInput[];
  errors: string[];
}

/**
 * Result of discovering and parsing all projects
 */
export interface DiscoveryResult {
  projects: ProjectInput[];
  sessions: SessionInput[];
  errors: string[];
  claudeProjectsPath: string | null;
}

/**
 * Get the path to Claude Code's projects directory
 * @returns Path to ~/.claude/projects/
 */
export function getClaudeProjectsPath(): string {
  return join(homedir(), ".claude", "projects");
}

/**
 * Check if Claude Code projects directory exists
 * @returns true if the directory exists
 */
export function claudeProjectsExist(): boolean {
  return existsSync(getClaudeProjectsPath());
}

/**
 * Validation result for a session entry
 */
interface ValidationResult {
  isValid: boolean;
  error?: string;
  sessionId?: string;
  created?: string;
  modified?: string;
}

/**
 * Validate a session entry and extract required fields
 */
function validateSessionEntry(
  entry: SessionIndexEntry,
  index: number,
  indexPath: string
): ValidationResult {
  const sessionId = entry.session_id || entry.sessionId;
  const created = entry.created;
  const modified = entry.modified;

  if (!sessionId) {
    return {
      isValid: false,
      error: `Entry ${index} in ${indexPath} missing session_id/sessionId, skipping`,
    };
  }
  if (!created) {
    return {
      isValid: false,
      error: `Session ${sessionId} missing created timestamp, skipping`,
    };
  }
  if (!modified) {
    return {
      isValid: false,
      error: `Session ${sessionId} missing modified timestamp, skipping`,
    };
  }

  const createdDate = new Date(created);
  const modifiedDate = new Date(modified);

  if (isNaN(createdDate.getTime())) {
    return {
      isValid: false,
      error: `Session ${sessionId} has invalid created date: ${created}, skipping`,
    };
  }
  if (isNaN(modifiedDate.getTime())) {
    return {
      isValid: false,
      error: `Session ${sessionId} has invalid modified date: ${modified}, skipping`,
    };
  }

  return { isValid: true, sessionId, created, modified };
}

/**
 * Convert a validated session entry to SessionInput
 */
function entryToSessionInput(
  entry: SessionIndexEntry,
  sessionId: string,
  created: string,
  modified: string,
  decodedPath: string
): SessionInput {
  const createdDate = new Date(created);
  const modifiedDate = new Date(modified);
  const duration = modifiedDate.getTime() - createdDate.getTime();

  return {
    id: sessionId,
    projectPath: decodedPath,
    created,
    modified,
    duration,
    messageCount: entry.message_count || entry.messageCount || 0,
    summary: entry.summary || null,
    firstPrompt: entry.first_prompt || entry.firstPrompt || null,
    gitBranch: entry.git_branch || entry.gitBranch || null,
  };
}

/**
 * Parse a sessions-index.json file for a project
 *
 * @param projectDir - The project directory path (encoded, e.g., `-Users-name-project`)
 * @param claudeProjectsPath - The base path to Claude's projects directory
 * @returns Parsed sessions and any errors encountered
 */
export function parseSessionIndex(projectDir: string, claudeProjectsPath: string): ParseResult {
  const fullPath = join(claudeProjectsPath, projectDir);
  const indexPath = join(fullPath, "sessions-index.json");
  const decodedPath = decodeProjectPath(projectDir);
  const projectName = getProjectName(decodedPath);
  const errors: string[] = [];
  const sessions: SessionInput[] = [];

  // Check if index file exists
  if (!existsSync(indexPath)) {
    return {
      projectPath: decodedPath,
      projectName,
      sessions: [],
      errors: [],
    };
  }

  try {
    const content = readFileSync(indexPath, "utf-8");
    let entries: SessionIndexEntry[];

    try {
      entries = JSON.parse(content);
    } catch (parseError) {
      errors.push(
        `Failed to parse JSON in ${indexPath}: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      );
      return {
        projectPath: decodedPath,
        projectName,
        sessions: [],
        errors,
      };
    }

    // Handle case where entries is not an array
    if (!Array.isArray(entries)) {
      errors.push(`${indexPath} does not contain an array`);
      return {
        projectPath: decodedPath,
        projectName,
        sessions: [],
        errors,
      };
    }

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const validation = validateSessionEntry(entry, i, indexPath);

      if (!validation.isValid) {
        errors.push(validation.error!);
        continue;
      }

      sessions.push(
        entryToSessionInput(
          entry,
          validation.sessionId!,
          validation.created!,
          validation.modified!,
          decodedPath
        )
      );
    }
  } catch (error) {
    errors.push(
      `Failed to read ${indexPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    projectPath: decodedPath,
    projectName,
    sessions,
    errors,
  };
}

/**
 * Discover all project directories under Claude's projects path
 *
 * @param claudeProjectsPath - The base path to Claude's projects directory
 * @returns Array of project directory names (encoded)
 */
export function discoverProjectDirectories(claudeProjectsPath: string): string[] {
  if (!existsSync(claudeProjectsPath)) {
    return [];
  }

  try {
    const entries = readdirSync(claudeProjectsPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .filter((name) => name.startsWith("-")); // Filter to only URL-encoded paths
  } catch (error) {
    console.warn(
      `Failed to read ${claudeProjectsPath}: ${error instanceof Error ? error.message : String(error)}`
    );
    return [];
  }
}

/**
 * Discover and parse all Claude Code projects and sessions
 *
 * This is the main entry point for populating the cache.
 *
 * @returns Discovery result with all projects, sessions, and errors
 */
export function discoverAndParseAll(): DiscoveryResult {
  const claudeProjectsPath = getClaudeProjectsPath();
  const allErrors: string[] = [];
  const projects: ProjectInput[] = [];
  const sessions: SessionInput[] = [];

  // Check if Claude projects directory exists
  if (!existsSync(claudeProjectsPath)) {
    return {
      projects: [],
      sessions: [],
      errors: [],
      claudeProjectsPath: null,
    };
  }

  // Discover all project directories
  const projectDirs = discoverProjectDirectories(claudeProjectsPath);

  for (const projectDir of projectDirs) {
    const result = parseSessionIndex(projectDir, claudeProjectsPath);
    allErrors.push(...result.errors);

    if (result.sessions.length > 0) {
      // Calculate project aggregate data
      const firstActivity = result.sessions.reduce(
        (min, s) => (s.created < min ? s.created : min),
        result.sessions[0].created
      );
      const lastActivity = result.sessions.reduce(
        (max, s) => (s.modified > max ? s.modified : max),
        result.sessions[0].modified
      );
      const totalMessages = result.sessions.reduce((sum, s) => sum + s.messageCount, 0);

      projects.push({
        path: result.projectPath,
        name: result.projectName,
        firstActivity,
        lastActivity,
        sessionCount: result.sessions.length,
        messageCount: totalMessages,
      });

      sessions.push(...result.sessions);
    }
  }

  return {
    projects,
    sessions,
    errors: allErrors,
    claudeProjectsPath,
  };
}

/**
 * Discover, parse, and cache all Claude Code sessions
 *
 * This function discovers all projects, parses their sessions,
 * and saves them to the SQLite database.
 *
 * @returns Discovery result
 */
export function syncSessionsToDatabase(): DiscoveryResult {
  const result = discoverAndParseAll();

  // Save projects to database
  for (const project of result.projects) {
    upsertProject(project);
  }

  // Save sessions to database (in batches for efficiency)
  if (result.sessions.length > 0) {
    upsertSessions(result.sessions);
  }

  // Log any errors
  for (const error of result.errors) {
    console.warn(`[Session Parser] ${error}`);
  }

  return result;
}

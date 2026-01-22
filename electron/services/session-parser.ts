/**
 * Session index parser for Claude Code sessions
 *
 * This module parses sessions-index.json files from Claude Code project directories
 * and populates the SQLite cache with session data.
 *
 * For projects without sessions-index.json, it also parses individual .jsonl
 * session files to discover session data.
 */

import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { createReadStream } from "fs";
import { createInterface } from "readline";
import { decodeProjectPath, getProjectName } from "./path-decoder.js";
import {
  upsertProject,
  upsertSessions,
  deleteOrphanedProjects,
  SessionInput,
  ProjectInput,
} from "./database.js";

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
 * Result of parsing session index JSON content
 */
interface ParseJsonResult {
  entries: SessionIndexEntry[] | null;
  error: string | null;
}

/**
 * Parse session index JSON content and extract entries array
 * Handles both old format (direct array) and new format ({ version, entries })
 */
function parseSessionIndexJson(content: string, indexPath: string): ParseJsonResult {
  try {
    const parsed = JSON.parse(content);
    // Handle new format: { version: number, entries: [...] }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.entries)) {
      return { entries: parsed.entries, error: null };
    }
    // Handle old format: direct array
    if (Array.isArray(parsed)) {
      return { entries: parsed, error: null };
    }
    return { entries: null, error: `${indexPath} has unsupported format` };
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : String(parseError);
    return { entries: null, error: `Failed to parse JSON in ${indexPath}: ${message}` };
  }
}

/**
 * Data extracted from a jsonl session file
 */
interface JsonlSessionData {
  sessionId: string;
  created: string | null;
  modified: string | null;
  messageCount: number;
  summary: string | null;
  firstPrompt: string | null;
  gitBranch: string | null;
}

/**
 * Parse a single line from a jsonl file
 */
function parseJsonlLine(line: string): Record<string, unknown> | null {
  try {
    return JSON.parse(line);
  } catch {
    return null;
  }
}

/**
 * Check if an item is a valid text content object
 */
function isTextContentItem(item: unknown): item is { type: string; text: string } {
  if (!item || typeof item !== "object") return false;
  if (!("type" in item) || !("text" in item)) return false;
  const contentItem = item as { type: unknown; text: unknown };
  return contentItem.type === "text" && typeof contentItem.text === "string";
}

/**
 * Extract text content from a user message
 */
function extractMessageText(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;
  if (!msg.content || !Array.isArray(msg.content)) return null;

  for (const item of msg.content) {
    if (isTextContentItem(item)) {
      return item.text.slice(0, 500); // Limit to 500 chars
    }
  }
  return null;
}

/**
 * Parse a .jsonl session file to extract session metadata
 * Uses streaming to handle large files efficiently
 */
export async function parseJsonlFile(filePath: string): Promise<JsonlSessionData | null> {
  const sessionId = basename(filePath, ".jsonl");

  // Use file stats for fallback timestamps
  let fileStat;
  try {
    fileStat = statSync(filePath);
  } catch {
    return null;
  }

  const data: JsonlSessionData = {
    sessionId,
    created: null,
    modified: null,
    messageCount: 0,
    summary: null,
    firstPrompt: null,
    gitBranch: null,
  };

  return new Promise((resolve) => {
    const stream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = createInterface({ input: stream, crlfDelay: Infinity });

    let lastTimestamp: string | null = null;
    let lastSummary: string | null = null;

    const handleTimestamp = (timestamp: string | undefined): void => {
      if (!timestamp) return;
      if (!data.created) data.created = timestamp;
      lastTimestamp = timestamp;
    };

    const handleUserMessage = (parsed: Record<string, unknown>): void => {
      if (!data.firstPrompt) {
        data.firstPrompt = extractMessageText(parsed.message);
      }
      if (!data.gitBranch && parsed.gitBranch) {
        data.gitBranch = parsed.gitBranch as string;
      }
    };

    const handleLine = (parsed: Record<string, unknown>): void => {
      const type = parsed.type as string | undefined;
      const timestamp = parsed.timestamp as string | undefined;

      handleTimestamp(timestamp);

      if (type === "user" || type === "assistant") {
        data.messageCount++;
        if (type === "user") handleUserMessage(parsed);
      }

      if (type === "summary" && parsed.summary) {
        lastSummary = parsed.summary as string;
      }
    };

    rl.on("line", (line) => {
      const parsed = parseJsonlLine(line);
      if (parsed) handleLine(parsed);
    });

    rl.on("close", () => {
      data.modified = lastTimestamp;
      data.summary = lastSummary;

      // Use file timestamps as fallback
      if (!data.created) {
        data.created = fileStat.birthtime.toISOString();
      }
      if (!data.modified) {
        data.modified = fileStat.mtime.toISOString();
      }

      resolve(data);
    });

    rl.on("error", () => {
      resolve(null);
    });

    stream.on("error", () => {
      rl.close();
      resolve(null);
    });
  });
}

/**
 * Discover .jsonl session files in a project directory
 */
export function discoverJsonlFiles(projectPath: string): string[] {
  try {
    const entries = readdirSync(projectPath, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".jsonl"))
      .map((entry) => join(projectPath, entry.name));
  } catch {
    return [];
  }
}

/**
 * Parse sessions from .jsonl files for a project without sessions-index.json
 */
export async function parseSessionsFromJsonl(
  projectDir: string,
  claudeProjectsPath: string
): Promise<ParseResult> {
  const fullPath = join(claudeProjectsPath, projectDir);
  const decodedPath = decodeProjectPath(projectDir);
  const projectName = getProjectName(decodedPath);
  const errors: string[] = [];
  const sessions: SessionInput[] = [];

  const jsonlFiles = discoverJsonlFiles(fullPath);

  for (const filePath of jsonlFiles) {
    try {
      const data = await parseJsonlFile(filePath);
      if (!data || !data.created || !data.modified) {
        continue;
      }

      const createdDate = new Date(data.created);
      const modifiedDate = new Date(data.modified);

      if (isNaN(createdDate.getTime()) || isNaN(modifiedDate.getTime())) {
        errors.push(`Invalid timestamps in ${filePath}`);
        continue;
      }

      const duration = modifiedDate.getTime() - createdDate.getTime();

      sessions.push({
        id: data.sessionId,
        projectPath: decodedPath,
        created: data.created,
        modified: data.modified,
        duration,
        messageCount: data.messageCount,
        summary: data.summary,
        firstPrompt: data.firstPrompt,
        gitBranch: data.gitBranch,
      });
    } catch (error) {
      errors.push(
        `Failed to parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return {
    projectPath: decodedPath,
    projectName,
    sessions,
    errors,
  };
}

/**
 * Parse a sessions-index.json file for a project (sync version)
 * Returns sessions from index file only, does not fall back to jsonl
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
    return { projectPath: decodedPath, projectName, sessions: [], errors: [] };
  }

  try {
    const content = readFileSync(indexPath, "utf-8");
    const parseResult = parseSessionIndexJson(content, indexPath);

    if (parseResult.error || !parseResult.entries) {
      if (parseResult.error) errors.push(parseResult.error);
      return { projectPath: decodedPath, projectName, sessions: [], errors };
    }

    for (let i = 0; i < parseResult.entries.length; i++) {
      const entry = parseResult.entries[i];
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
 * Check if a project has a sessions-index.json file
 */
export function hasSessionIndex(projectDir: string, claudeProjectsPath: string): boolean {
  const indexPath = join(claudeProjectsPath, projectDir, "sessions-index.json");
  return existsSync(indexPath);
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
 * Calculate aggregate project data from sessions
 */
function calculateProjectAggregates(
  sessions: SessionInput[],
  projectPath: string,
  projectName: string
): ProjectInput {
  const firstActivity = sessions.reduce(
    (min, s) => (s.created < min ? s.created : min),
    sessions[0].created
  );
  const lastActivity = sessions.reduce(
    (max, s) => (s.modified > max ? s.modified : max),
    sessions[0].modified
  );
  const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    path: projectPath,
    name: projectName,
    firstActivity,
    lastActivity,
    sessionCount: sessions.length,
    messageCount: totalMessages,
    totalTime,
  };
}

/**
 * Discover and parse all Claude Code projects and sessions
 *
 * This is the main entry point for populating the cache.
 * It first tries sessions-index.json, then falls back to parsing .jsonl files.
 *
 * @returns Discovery result with all projects, sessions, and errors
 */
export async function discoverAndParseAll(): Promise<DiscoveryResult> {
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
    let result: ParseResult;

    // Try sessions-index.json first
    if (hasSessionIndex(projectDir, claudeProjectsPath)) {
      result = parseSessionIndex(projectDir, claudeProjectsPath);
    } else {
      // Fall back to parsing .jsonl files
      result = await parseSessionsFromJsonl(projectDir, claudeProjectsPath);
    }

    allErrors.push(...result.errors);

    // Skip projects whose decoded path no longer exists on the filesystem
    // This handles cases where the original project directory was deleted/moved
    if (!existsSync(result.projectPath)) {
      continue;
    }

    if (result.sessions.length > 0) {
      projects.push(
        calculateProjectAggregates(result.sessions, result.projectPath, result.projectName)
      );
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
 * and saves them to the SQLite database. It also cleans up
 * orphaned project entries that no longer correspond to any
 * Claude project directory.
 *
 * @returns Discovery result
 */
export async function syncSessionsToDatabase(): Promise<DiscoveryResult> {
  const result = await discoverAndParseAll();

  // Save projects to database
  for (const project of result.projects) {
    upsertProject(project);
  }

  // Save sessions to database (in batches for efficiency)
  if (result.sessions.length > 0) {
    upsertSessions(result.sessions);
  }

  // Clean up orphaned projects (ones that no longer exist in Claude's directory)
  const validPaths = new Set(result.projects.map((p) => p.path));
  const deletedCount = deleteOrphanedProjects(validPaths);
  if (deletedCount > 0) {
    console.log(`[Session Parser] Cleaned up ${deletedCount} orphaned project(s)`);
  }

  // Log any errors
  for (const error of result.errors) {
    console.warn(`[Session Parser] ${error}`);
  }

  return result;
}

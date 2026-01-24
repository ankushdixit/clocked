/**
 * JSONL Parser for Claude Code conversation files
 *
 * Parses .jsonl conversation files to extract messages with timestamps
 * for time split calculations (human vs Claude time).
 *
 * Based on patterns from ccusage but focused on time tracking rather than tokens.
 */

import { createReadStream } from "fs";
import { createInterface } from "readline";
import { existsSync } from "fs";

/**
 * Parsed message from JSONL file
 */
export interface ParsedMessage {
  uuid: string;
  sessionId: string;
  timestamp: Date;
  type: "user" | "assistant";
}

/**
 * Result of parsing a JSONL file
 */
export interface ParseResult {
  messages: ParsedMessage[];
  errors: string[];
  skippedLines: number;
}

/**
 * Raw entry structure from JSONL file
 * Only includes fields we care about for parsing
 */
interface RawJsonlEntry {
  type?: string;
  uuid?: string;
  sessionId?: string;
  timestamp?: string;
  isMeta?: boolean;
  isApiErrorMessage?: boolean;
}

/**
 * Validate that a timestamp string is valid ISO 8601 format
 */
function isValidTimestamp(timestamp: string): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
}

/**
 * Validate and extract relevant fields from a raw JSONL entry
 * Returns null if the entry should be skipped
 */
function validateEntry(entry: RawJsonlEntry, sessionId: string): ParsedMessage | null {
  // Only process user and assistant messages
  if (entry.type !== "user" && entry.type !== "assistant") {
    return null;
  }

  // Skip meta messages (local command caveats, etc.)
  if (entry.isMeta === true) {
    return null;
  }

  // Skip API error messages
  if (entry.isApiErrorMessage === true) {
    return null;
  }

  // Must have a valid timestamp
  if (!entry.timestamp || !isValidTimestamp(entry.timestamp)) {
    return null;
  }

  // Must have a UUID
  if (!entry.uuid) {
    return null;
  }

  return {
    uuid: entry.uuid,
    sessionId: entry.sessionId || sessionId,
    timestamp: new Date(entry.timestamp),
    type: entry.type as "user" | "assistant",
  };
}

/**
 * Parse a single JSONL line
 * Returns null if the line is invalid or should be skipped
 */
function parseLine(line: string): RawJsonlEntry | null {
  if (!line || line.trim().length === 0) {
    return null;
  }

  try {
    return JSON.parse(line) as RawJsonlEntry;
  } catch {
    return null;
  }
}

/**
 * Parse a JSONL file and extract messages for time calculations
 *
 * Uses streaming to handle large files without loading into memory.
 * Gracefully skips malformed lines without crashing.
 *
 * @param filePath - Path to the .jsonl file
 * @param sessionId - Session ID (usually derived from filename)
 * @returns Promise resolving to ParseResult with messages and any errors
 */
export async function parseJsonlMessages(
  filePath: string,
  sessionId: string
): Promise<ParseResult> {
  const messages: ParsedMessage[] = [];
  const errors: string[] = [];
  let skippedLines = 0;

  // Check if file exists
  if (!existsSync(filePath)) {
    return {
      messages: [],
      errors: [`File not found: ${filePath}`],
      skippedLines: 0,
    };
  }

  return new Promise((resolve) => {
    const fileStream = createReadStream(filePath, { encoding: "utf-8" });
    const rl = createInterface({
      input: fileStream,
      crlfDelay: Number.POSITIVE_INFINITY, // Handle Windows line endings
    });

    // Track seen UUIDs for deduplication
    const seenUuids = new Set<string>();

    rl.on("line", (line) => {
      const entry = parseLine(line);
      if (!entry) {
        skippedLines++;
        return;
      }

      const message = validateEntry(entry, sessionId);
      if (!message) {
        // Not an error, just not a message we care about
        return;
      }

      // Deduplicate by UUID
      if (seenUuids.has(message.uuid)) {
        return;
      }
      seenUuids.add(message.uuid);

      messages.push(message);
    });

    rl.on("close", () => {
      // Sort messages chronologically
      messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      resolve({
        messages,
        errors,
        skippedLines,
      });
    });

    rl.on("error", (err) => {
      errors.push(`Error reading file: ${err.message}`);
      resolve({
        messages,
        errors,
        skippedLines,
      });
    });

    fileStream.on("error", (err) => {
      errors.push(`Stream error: ${err.message}`);
      rl.close();
    });
  });
}

/**
 * Parse multiple JSONL files and combine results
 *
 * @param filePaths - Array of file paths to parse
 * @param sessionIds - Array of session IDs corresponding to each file
 * @returns Promise resolving to combined ParseResult
 */
export async function parseMultipleJsonlFiles(
  filePaths: string[],
  sessionIds: string[]
): Promise<ParseResult> {
  const allMessages: ParsedMessage[] = [];
  const allErrors: string[] = [];
  let totalSkippedLines = 0;

  const results = await Promise.all(
    filePaths.map((filePath, index) => parseJsonlMessages(filePath, sessionIds[index]))
  );

  for (const result of results) {
    allMessages.push(...result.messages);
    allErrors.push(...result.errors);
    totalSkippedLines += result.skippedLines;
  }

  // Sort all messages chronologically
  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    messages: allMessages,
    errors: allErrors,
    skippedLines: totalSkippedLines,
  };
}

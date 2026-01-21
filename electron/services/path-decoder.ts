/**
 * URL path decoding utilities for Claude Code project directories
 *
 * Claude Code stores project data in directories with URL-encoded paths.
 * For example: `-Users-name-project` represents `/Users/name/project`
 *
 * This module provides utilities to decode these paths and extract project names.
 */

/**
 * Decode a URL-encoded directory name to a filesystem path
 *
 * Claude Code encodes paths by replacing `/` with `-`
 * The leading `-` represents the root `/`
 *
 * @param encodedDir - The encoded directory name (e.g., `-Users-name-project`)
 * @returns The decoded filesystem path (e.g., `/Users/name/project`)
 *
 * @example
 * decodeProjectPath('-Users-name-project') // '/Users/name/project'
 * decodeProjectPath('-home-user-code') // '/home/user/code'
 */
export function decodeProjectPath(encodedDir: string): string {
  // Directory name format: -Users-name-project
  // Decode to: /Users/name/project
  // The first `-` becomes `/`, all subsequent `-` also become `/`
  return encodedDir.replace(/^-/, "/").replace(/-/g, "/");
}

/**
 * Extract the project name from a decoded path
 *
 * The project name is the last segment of the path
 *
 * @param decodedPath - The decoded filesystem path (e.g., `/Users/name/project`)
 * @returns The project name (e.g., `project`)
 *
 * @example
 * getProjectName('/Users/name/my-project') // 'my-project'
 * getProjectName('/home/user/code') // 'code'
 * getProjectName('/') // 'Unknown'
 */
export function getProjectName(decodedPath: string): string {
  const segments = decodedPath.split("/").filter(Boolean);
  return segments.pop() || "Unknown";
}

/**
 * Encode a filesystem path to the directory name format used by Claude Code
 *
 * This is the inverse of decodeProjectPath
 *
 * @param path - The filesystem path (e.g., `/Users/name/project`)
 * @returns The encoded directory name (e.g., `-Users-name-project`)
 *
 * @example
 * encodeProjectPath('/Users/name/project') // '-Users-name-project'
 */
export function encodeProjectPath(path: string): string {
  // Replace all `/` with `-`
  return path.replace(/\//g, "-");
}

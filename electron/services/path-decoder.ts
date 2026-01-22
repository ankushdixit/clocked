/**
 * URL path decoding utilities for Claude Code project directories
 *
 * Claude Code stores project data in directories with URL-encoded paths.
 * For example: `-Users-name-project` represents `/Users/name/project`
 *
 * Claude encodes multiple characters as `-`:
 * - `/` (directory separator) becomes `-`
 * - `.` (dot) becomes `-`
 * - `-` (literal hyphen) stays as `-`
 *
 * This module provides utilities to decode these paths and extract project names.
 */

import { existsSync } from "fs";

/**
 * Characters that Claude encodes as `-` in path names
 * When decoding, we try each of these as potential original characters
 */
const ENCODED_CHARS = ["-", "."] as const;

/**
 * Decode a URL-encoded directory name to a filesystem path
 *
 * Claude Code encodes paths by replacing `/` and `.` with `-`
 * The leading `-` represents the root `/`
 *
 * This function tries to resolve ambiguity (hyphens that were slashes vs
 * hyphens that were part of folder names or dots) by checking if paths exist on disk.
 *
 * @param encodedDir - The encoded directory name (e.g., `-Users-name-project`)
 * @returns The decoded filesystem path (e.g., `/Users/name/project`)
 *
 * @example
 * decodeProjectPath('-Users-name-project') // '/Users/name/project'
 * decodeProjectPath('-home-user-code') // '/home/user/code'
 * decodeProjectPath('-Users-name-my-project') // '/Users/name/my-project' (if exists)
 * decodeProjectPath('-Users-name-comet-space') // '/Users/name/comet.space' (if exists)
 */
export function decodeProjectPath(encodedDir: string): string {
  // Remove leading hyphen and split by remaining hyphens
  const withoutLeading = encodedDir.replace(/^-/, "");
  const segments = withoutLeading.split("-");

  // Try to find the actual path by checking filesystem
  const resolvedPath = resolvePathFromSegments(segments);
  if (resolvedPath) {
    return resolvedPath;
  }

  // Fallback: simple decode (all hyphens become slashes)
  return "/" + segments.join("/");
}

/**
 * Try to resolve the actual filesystem path from encoded segments
 *
 * This walks through possible path combinations and checks if they exist.
 * For example, for segments ["Users", "name", "my", "project"], it will try:
 * - /Users/name/my/project
 * - /Users/name/my-project
 * - /Users/name/my.project
 * - /Users/name-my/project
 * - etc.
 *
 * @param segments - Array of path segments
 * @returns The resolved path if found, null otherwise
 */
function resolvePathFromSegments(segments: string[]): string | null {
  if (segments.length === 0) return "/";

  // Use recursive approach to find valid path
  return findValidPath("/", segments, 0);
}

/**
 * Generate all possible segment name combinations using different separators
 * For segments ["a", "b", "c"], returns all combinations:
 * ["a-b-c", "a-b.c", "a.b-c", "a.b.c"]
 */
function generateSegmentVariants(segments: string[]): string[] {
  if (segments.length === 1) {
    return [segments[0]];
  }

  // Generate all combinations of separators between segments
  // For n segments, we need n-1 separators, giving us 2^(n-1) combinations
  const numSeparators = segments.length - 1;
  const numCombinations = Math.pow(ENCODED_CHARS.length, numSeparators);
  const variants: string[] = [];

  for (let i = 0; i < numCombinations; i++) {
    let result = segments[0];
    let combo = i;

    for (let j = 0; j < numSeparators; j++) {
      const sepIndex = combo % ENCODED_CHARS.length;
      combo = Math.floor(combo / ENCODED_CHARS.length);
      result += ENCODED_CHARS[sepIndex] + segments[j + 1];
    }

    variants.push(result);
  }

  return variants;
}

/**
 * Try a segment name at the current path position
 * @returns The resolved full path if found, null otherwise
 */
function trySegmentAtPath(
  currentPath: string,
  segmentName: string,
  segments: string[],
  endIndex: number
): string | null {
  const testPath = currentPath === "/" ? "/" + segmentName : currentPath + "/" + segmentName;

  if (endIndex === segments.length) {
    // This is the last segment, check if the full path exists
    return existsSync(testPath) ? testPath : null;
  }

  // This is an intermediate segment, check if it's a valid directory
  if (existsSync(testPath)) {
    return findValidPath(testPath, segments, endIndex);
  }

  return null;
}

/**
 * Recursively find a valid filesystem path
 */
function findValidPath(currentPath: string, segments: string[], startIndex: number): string | null {
  if (startIndex >= segments.length) {
    return existsSync(currentPath) ? currentPath : null;
  }

  // Try combining consecutive segments (greedy - try longer names first)
  for (let endIndex = segments.length; endIndex > startIndex; endIndex--) {
    const segmentParts = segments.slice(startIndex, endIndex);
    const segmentVariants = generateSegmentVariants(segmentParts);

    for (const segmentName of segmentVariants) {
      const result = trySegmentAtPath(currentPath, segmentName, segments, endIndex);
      if (result) return result;
    }
  }

  return null;
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
 * Note: Claude encodes both `/` and `.` as `-`
 *
 * @param path - The filesystem path (e.g., `/Users/name/project`)
 * @returns The encoded directory name (e.g., `-Users-name-project`)
 *
 * @example
 * encodeProjectPath('/Users/name/project') // '-Users-name-project'
 * encodeProjectPath('/Users/name/comet.space') // '-Users-name-comet-space'
 */
export function encodeProjectPath(path: string): string {
  // Replace all `/` and `.` with `-`
  return path.replace(/[/.]/g, "-");
}

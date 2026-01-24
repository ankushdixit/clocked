/**
 * Time Calculator for Claude Code sessions
 *
 * Calculates human vs Claude time split from parsed messages.
 *
 * Time Classification:
 * - Human time: Time between assistant response → next user message
 *   (user was thinking, typing, or reviewing code)
 * - Claude time: Time between user message → assistant response
 *   (Claude was processing the request)
 *
 * Known Limitation:
 * JSONL timestamps record when a response FINISHES, not when it starts.
 * This means streaming time is compressed. The ~64:36 human:Claude ratio
 * is still directionally accurate but not precise.
 */

import type { ParsedMessage } from "../parsers/jsonl-parser.js";

/**
 * Default idle threshold in milliseconds (30 minutes)
 * Gaps larger than this are considered idle time and excluded from active time
 */
export const DEFAULT_IDLE_THRESHOLD_MS = 30 * 60 * 1000;

/**
 * Time split calculation result
 */
export interface TimeSplit {
  /** Total active time in milliseconds (humanTime + claudeTime) */
  activeTime: number;
  /** Human thinking/typing time in milliseconds */
  humanTime: number;
  /** Claude processing time in milliseconds */
  claudeTime: number;
  /** Total idle time in milliseconds (gaps > threshold) */
  idleTime: number;
  /** Human time as percentage of active time */
  humanPercentage: number;
  /** Claude time as percentage of active time */
  claudePercentage: number;
  /** Number of message pairs analyzed */
  messagePairCount: number;
  /** Number of gaps detected (excluded from active time) */
  gapCount: number;
}

/**
 * Empty time split for sessions with no calculable data
 */
export const EMPTY_TIME_SPLIT: TimeSplit = {
  activeTime: 0,
  humanTime: 0,
  claudeTime: 0,
  idleTime: 0,
  humanPercentage: 0,
  claudePercentage: 0,
  messagePairCount: 0,
  gapCount: 0,
};

/**
 * Classify the time between two consecutive messages
 *
 * @param prevType - Type of the previous message
 * @param currType - Type of the current message
 * @returns "human" | "claude" | "unknown"
 */
function classifyTimeDelta(
  prevType: "user" | "assistant",
  currType: "user" | "assistant"
): "human" | "claude" | "unknown" {
  // Assistant → User = Human was thinking/typing after Claude responded
  if (prevType === "assistant" && currType === "user") {
    return "human";
  }

  // User → Assistant = Claude was processing after human sent message
  if (prevType === "user" && currType === "assistant") {
    return "claude";
  }

  // User → User = Likely user sent multiple messages (count as human)
  if (prevType === "user" && currType === "user") {
    return "human";
  }

  // Assistant → Assistant = Continuation/streaming (count as claude)
  if (prevType === "assistant" && currType === "assistant") {
    return "claude";
  }

  return "unknown";
}

/**
 * Calculate time split from parsed messages
 *
 * @param messages - Array of parsed messages, should be sorted chronologically
 * @param idleThresholdMs - Threshold for idle time detection (default: 30 minutes)
 * @returns TimeSplit with all calculated values
 */
export function calculateTimeSplit(
  messages: ParsedMessage[],
  idleThresholdMs: number = DEFAULT_IDLE_THRESHOLD_MS
): TimeSplit {
  // Need at least 2 messages to calculate time deltas
  if (messages.length < 2) {
    return { ...EMPTY_TIME_SPLIT };
  }

  let humanTime = 0;
  let claudeTime = 0;
  let idleTime = 0;
  let messagePairCount = 0;
  let gapCount = 0;

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const curr = messages[i];

    const delta = curr.timestamp.getTime() - prev.timestamp.getTime();

    // Skip negative deltas (shouldn't happen with sorted data, but defensive)
    if (delta < 0) {
      continue;
    }

    // Check if this is an idle gap
    if (delta > idleThresholdMs) {
      idleTime += delta;
      gapCount++;
      continue;
    }

    // Classify and accumulate the time
    const classification = classifyTimeDelta(prev.type, curr.type);
    messagePairCount++;

    if (classification === "human") {
      humanTime += delta;
    } else if (classification === "claude") {
      claudeTime += delta;
    } else {
      // Unknown classification - split evenly as fallback
      humanTime += delta / 2;
      claudeTime += delta / 2;
    }
  }

  // Calculate totals and percentages
  const activeTime = humanTime + claudeTime;
  const total = humanTime + claudeTime;

  const humanPercentage = total > 0 ? Math.round((humanTime / total) * 100) : 0;
  const claudePercentage = total > 0 ? Math.round((claudeTime / total) * 100) : 0;

  return {
    activeTime,
    humanTime,
    claudeTime,
    idleTime,
    humanPercentage,
    claudePercentage,
    messagePairCount,
    gapCount,
  };
}

/**
 * Calculate aggregate time split from multiple sessions
 *
 * @param sessionTimeSplits - Array of TimeSplit results from individual sessions
 * @returns Aggregated TimeSplit
 */
export function aggregateTimeSplits(sessionTimeSplits: TimeSplit[]): TimeSplit {
  if (sessionTimeSplits.length === 0) {
    return { ...EMPTY_TIME_SPLIT };
  }

  let totalHumanTime = 0;
  let totalClaudeTime = 0;
  let totalIdleTime = 0;
  let totalMessagePairCount = 0;
  let totalGapCount = 0;

  for (const split of sessionTimeSplits) {
    totalHumanTime += split.humanTime;
    totalClaudeTime += split.claudeTime;
    totalIdleTime += split.idleTime;
    totalMessagePairCount += split.messagePairCount;
    totalGapCount += split.gapCount;
  }

  const activeTime = totalHumanTime + totalClaudeTime;
  const total = totalHumanTime + totalClaudeTime;

  return {
    activeTime,
    humanTime: totalHumanTime,
    claudeTime: totalClaudeTime,
    idleTime: totalIdleTime,
    humanPercentage: total > 0 ? Math.round((totalHumanTime / total) * 100) : 0,
    claudePercentage: total > 0 ? Math.round((totalClaudeTime / total) * 100) : 0,
    messagePairCount: totalMessagePairCount,
    gapCount: totalGapCount,
  };
}

/**
 * Format time split as human-readable string (for debugging/logging)
 */
export function formatTimeSplit(split: TimeSplit): string {
  const formatMs = (ms: number): string => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return [
    `Active: ${formatMs(split.activeTime)}`,
    `Human: ${formatMs(split.humanTime)} (${split.humanPercentage}%)`,
    `Claude: ${formatMs(split.claudeTime)} (${split.claudePercentage}%)`,
    `Idle: ${formatMs(split.idleTime)}`,
    `Pairs: ${split.messagePairCount}, Gaps: ${split.gapCount}`,
  ].join(" | ");
}

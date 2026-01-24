import {
  calculateTimeSplit,
  aggregateTimeSplits,
  formatTimeSplit,
  DEFAULT_IDLE_THRESHOLD_MS,
  EMPTY_TIME_SPLIT,
  type TimeSplit,
} from "../time-calculator";
import type { ParsedMessage } from "../../parsers/jsonl-parser";

/**
 * Helper to create a ParsedMessage for testing
 */
function createMessage(
  type: "user" | "assistant",
  timestamp: string,
  uuid?: string
): ParsedMessage {
  return {
    uuid: uuid || `${type}-${timestamp}`,
    sessionId: "test-session",
    timestamp: new Date(timestamp),
    type,
  };
}

describe("time-calculator", () => {
  describe("calculateTimeSplit", () => {
    it("returns empty time split for empty messages array", () => {
      const result = calculateTimeSplit([]);

      expect(result).toEqual(EMPTY_TIME_SPLIT);
    });

    it("returns empty time split for single message", () => {
      const messages = [createMessage("user", "2026-01-15T10:00:00.000Z")];

      const result = calculateTimeSplit(messages);

      expect(result).toEqual(EMPTY_TIME_SPLIT);
    });

    it("calculates Claude time for user → assistant transition", () => {
      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"), // 5 seconds later
      ];

      const result = calculateTimeSplit(messages);

      expect(result.claudeTime).toBe(5000); // 5 seconds
      expect(result.humanTime).toBe(0);
      expect(result.activeTime).toBe(5000);
      expect(result.claudePercentage).toBe(100);
      expect(result.humanPercentage).toBe(0);
    });

    it("calculates human time for assistant → user transition", () => {
      const messages = [
        createMessage("assistant", "2026-01-15T10:00:00.000Z"),
        createMessage("user", "2026-01-15T10:00:30.000Z"), // 30 seconds later
      ];

      const result = calculateTimeSplit(messages);

      expect(result.humanTime).toBe(30000); // 30 seconds
      expect(result.claudeTime).toBe(0);
      expect(result.activeTime).toBe(30000);
      expect(result.humanPercentage).toBe(100);
      expect(result.claudePercentage).toBe(0);
    });

    it("correctly splits time for a typical conversation", () => {
      const messages = [
        // User sends message
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        // Claude responds 3 seconds later (claude time)
        createMessage("assistant", "2026-01-15T10:00:03.000Z"),
        // User thinks for 10 seconds and sends next message (human time)
        createMessage("user", "2026-01-15T10:00:13.000Z"),
        // Claude responds 2 seconds later (claude time)
        createMessage("assistant", "2026-01-15T10:00:15.000Z"),
      ];

      const result = calculateTimeSplit(messages);

      // Claude time: 3s (user→assistant) + 2s (user→assistant) = 5s
      expect(result.claudeTime).toBe(5000);
      // Human time: 10s (assistant→user) = 10s
      expect(result.humanTime).toBe(10000);
      // Active time: 15s total
      expect(result.activeTime).toBe(15000);
      // Human: 10/15 = 67%
      expect(result.humanPercentage).toBe(67);
      // Claude: 5/15 = 33%
      expect(result.claudePercentage).toBe(33);
      expect(result.messagePairCount).toBe(3);
    });

    it("excludes gaps larger than idle threshold", () => {
      const thirtyOneMinutes = 31 * 60 * 1000; // 31 minutes in ms

      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"), // 5 seconds
        // 31 minute gap (should be excluded)
        createMessage("user", "2026-01-15T10:31:05.000Z"),
        createMessage("assistant", "2026-01-15T10:31:10.000Z"), // 5 seconds
      ];

      const result = calculateTimeSplit(messages);

      // Only 10 seconds of active time (5s + 5s), gap excluded
      expect(result.activeTime).toBe(10000);
      expect(result.claudeTime).toBe(10000);
      expect(result.humanTime).toBe(0);
      expect(result.idleTime).toBe(thirtyOneMinutes);
      expect(result.gapCount).toBe(1);
      expect(result.messagePairCount).toBe(2);
    });

    it("handles custom idle threshold", () => {
      const tenMinutes = 10 * 60 * 1000;
      const customThreshold = 5 * 60 * 1000; // 5 minutes

      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"), // 5 seconds
        // 10 minute gap (exceeds 5 min threshold)
        createMessage("user", "2026-01-15T10:10:05.000Z"),
        createMessage("assistant", "2026-01-15T10:10:10.000Z"), // 5 seconds
      ];

      const result = calculateTimeSplit(messages, customThreshold);

      expect(result.activeTime).toBe(10000);
      expect(result.idleTime).toBe(tenMinutes);
      expect(result.gapCount).toBe(1);
    });

    it("counts user → user as human time", () => {
      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("user", "2026-01-15T10:00:05.000Z"), // User sent another message
      ];

      const result = calculateTimeSplit(messages);

      expect(result.humanTime).toBe(5000);
      expect(result.claudeTime).toBe(0);
    });

    it("counts assistant → assistant as claude time", () => {
      const messages = [
        createMessage("assistant", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"), // Continuation
      ];

      const result = calculateTimeSplit(messages);

      expect(result.claudeTime).toBe(5000);
      expect(result.humanTime).toBe(0);
    });

    it("handles exact threshold boundary (not exceeded)", () => {
      const exactlyThirtyMinutes = DEFAULT_IDLE_THRESHOLD_MS;

      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"),
        // Exactly 30 minutes (should NOT be excluded)
        createMessage(
          "user",
          new Date(
            new Date("2026-01-15T10:00:05.000Z").getTime() + exactlyThirtyMinutes
          ).toISOString()
        ),
      ];

      const result = calculateTimeSplit(messages);

      // The 30 minute gap is exactly at threshold, not exceeded, so it's counted
      expect(result.gapCount).toBe(0);
      expect(result.idleTime).toBe(0);
      expect(result.humanTime).toBe(exactlyThirtyMinutes);
    });

    it("handles multiple gaps in conversation", () => {
      const fortyMinutes = 40 * 60 * 1000;

      const messages = [
        createMessage("user", "2026-01-15T10:00:00.000Z"),
        createMessage("assistant", "2026-01-15T10:00:05.000Z"), // 5s
        // 40 minute gap
        createMessage("user", "2026-01-15T10:40:05.000Z"),
        createMessage("assistant", "2026-01-15T10:40:10.000Z"), // 5s
        // Another 40 minute gap
        createMessage("user", "2026-01-15T11:20:10.000Z"),
        createMessage("assistant", "2026-01-15T11:20:15.000Z"), // 5s
      ];

      const result = calculateTimeSplit(messages);

      expect(result.activeTime).toBe(15000); // 5s + 5s + 5s
      expect(result.gapCount).toBe(2);
      expect(result.idleTime).toBe(fortyMinutes * 2);
    });
  });

  describe("aggregateTimeSplits", () => {
    it("returns empty time split for empty array", () => {
      const result = aggregateTimeSplits([]);

      expect(result).toEqual(EMPTY_TIME_SPLIT);
    });

    it("returns same values for single session", () => {
      const sessionSplit: TimeSplit = {
        activeTime: 10000,
        humanTime: 6000,
        claudeTime: 4000,
        idleTime: 5000,
        humanPercentage: 60,
        claudePercentage: 40,
        messagePairCount: 10,
        gapCount: 1,
      };

      const result = aggregateTimeSplits([sessionSplit]);

      expect(result.activeTime).toBe(10000);
      expect(result.humanTime).toBe(6000);
      expect(result.claudeTime).toBe(4000);
      expect(result.idleTime).toBe(5000);
      expect(result.messagePairCount).toBe(10);
      expect(result.gapCount).toBe(1);
    });

    it("sums values from multiple sessions", () => {
      const session1: TimeSplit = {
        activeTime: 10000,
        humanTime: 6000,
        claudeTime: 4000,
        idleTime: 5000,
        humanPercentage: 60,
        claudePercentage: 40,
        messagePairCount: 10,
        gapCount: 1,
      };

      const session2: TimeSplit = {
        activeTime: 20000,
        humanTime: 12000,
        claudeTime: 8000,
        idleTime: 10000,
        humanPercentage: 60,
        claudePercentage: 40,
        messagePairCount: 20,
        gapCount: 2,
      };

      const result = aggregateTimeSplits([session1, session2]);

      expect(result.activeTime).toBe(30000);
      expect(result.humanTime).toBe(18000);
      expect(result.claudeTime).toBe(12000);
      expect(result.idleTime).toBe(15000);
      expect(result.messagePairCount).toBe(30);
      expect(result.gapCount).toBe(3);
    });

    it("recalculates percentages based on totals", () => {
      const session1: TimeSplit = {
        activeTime: 10000,
        humanTime: 9000, // 90%
        claudeTime: 1000, // 10%
        idleTime: 0,
        humanPercentage: 90,
        claudePercentage: 10,
        messagePairCount: 5,
        gapCount: 0,
      };

      const session2: TimeSplit = {
        activeTime: 10000,
        humanTime: 1000, // 10%
        claudeTime: 9000, // 90%
        idleTime: 0,
        humanPercentage: 10,
        claudePercentage: 90,
        messagePairCount: 5,
        gapCount: 0,
      };

      const result = aggregateTimeSplits([session1, session2]);

      // Total: 10k human, 10k claude = 50/50
      expect(result.humanPercentage).toBe(50);
      expect(result.claudePercentage).toBe(50);
    });
  });

  describe("formatTimeSplit", () => {
    it("formats time split as readable string", () => {
      const split: TimeSplit = {
        activeTime: 7200000, // 2 hours
        humanTime: 4320000, // 1h 12m
        claudeTime: 2880000, // 48m
        idleTime: 3600000, // 1 hour
        humanPercentage: 60,
        claudePercentage: 40,
        messagePairCount: 50,
        gapCount: 2,
      };

      const result = formatTimeSplit(split);

      expect(result).toContain("Active: 2h 0m");
      expect(result).toContain("Human: 1h 12m (60%)");
      expect(result).toContain("Claude: 48m (40%)");
      expect(result).toContain("Idle: 1h 0m");
      expect(result).toContain("Pairs: 50, Gaps: 2");
    });

    it("formats zero values correctly", () => {
      const result = formatTimeSplit(EMPTY_TIME_SPLIT);

      expect(result).toContain("Active: 0m");
      expect(result).toContain("Human: 0m (0%)");
      expect(result).toContain("Claude: 0m (0%)");
    });
  });

  describe("DEFAULT_IDLE_THRESHOLD_MS", () => {
    it("is 30 minutes", () => {
      expect(DEFAULT_IDLE_THRESHOLD_MS).toBe(30 * 60 * 1000);
    });
  });
});

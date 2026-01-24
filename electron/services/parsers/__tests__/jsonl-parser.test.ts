import { vol } from "memfs";
import { parseJsonlMessages, parseMultipleJsonlFiles } from "../jsonl-parser";

// Mock the fs module
jest.mock("fs", () => {
  const memfs = require("memfs");
  return {
    ...memfs.fs,
    createReadStream: memfs.fs.createReadStream,
  };
});

describe("jsonl-parser", () => {
  beforeEach(() => {
    vol.reset();
  });

  describe("parseJsonlMessages", () => {
    it("parses user and assistant messages from JSONL file", async () => {
      const sessionId = "test-session-123";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
          message: { role: "user", content: "Hello" },
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
          message: { role: "assistant", content: "Hi there" },
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-2",
          sessionId,
          timestamp: "2026-01-15T10:00:30.000Z",
          message: { role: "user", content: "Thanks" },
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.errors).toHaveLength(0);
      expect(result.messages).toHaveLength(3);
      expect(result.messages[0].type).toBe("user");
      expect(result.messages[0].uuid).toBe("user-1");
      expect(result.messages[1].type).toBe("assistant");
      expect(result.messages[2].type).toBe("user");
    });

    it("sorts messages chronologically", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      // Messages in wrong order in file
      const jsonlContent = [
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].uuid).toBe("user-1"); // Earlier timestamp first
      expect(result.messages[1].uuid).toBe("assistant-1");
    });

    it("skips non-user/assistant message types", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "file-history-snapshot",
          messageId: "snapshot-1",
          snapshot: {},
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
        JSON.stringify({
          type: "summary",
          summary: "Session summary",
          leafUuid: "user-1",
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
        JSON.stringify({
          type: "progress",
          content: "Processing...",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].type).toBe("user");
      expect(result.messages[1].type).toBe("assistant");
    });

    it("skips meta messages (isMeta: true)", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
          isMeta: true, // Should be skipped
          message: { content: "local command caveat" },
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-2",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
          message: { content: "Real message" },
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].uuid).toBe("user-2");
    });

    it("skips API error messages", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
          isApiErrorMessage: true, // Should be skipped
          message: { content: "API Error: 500" },
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-2",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
          message: { content: "Real response" },
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].uuid).toBe("assistant-2");
    });

    it("handles malformed JSON lines gracefully", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
        "not valid json {{{",
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
        "{incomplete json",
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      // Should skip malformed lines and continue
      expect(result.messages).toHaveLength(2);
      expect(result.skippedLines).toBe(2); // Two malformed lines
      expect(result.errors).toHaveLength(0); // No fatal errors
    });

    it("skips entries without timestamp", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          // Missing timestamp
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-2",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].uuid).toBe("user-2");
    });

    it("skips entries without uuid", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
          // Missing uuid
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-2",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0].uuid).toBe("user-2");
    });

    it("deduplicates messages by uuid", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
        JSON.stringify({
          type: "user",
          uuid: "user-1", // Duplicate uuid
          sessionId,
          timestamp: "2026-01-15T10:00:01.000Z",
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: jsonlContent,
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(2);
      expect(result.messages[0].uuid).toBe("user-1");
      expect(result.messages[1].uuid).toBe("assistant-1");
    });

    it("returns error for non-existent file", async () => {
      const result = await parseJsonlMessages("/non/existent/file.jsonl", "test");

      expect(result.messages).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("File not found");
    });

    it("handles empty file", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: "",
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it("handles file with only empty lines", async () => {
      const sessionId = "test-session";
      const filePath = `/test/${sessionId}.jsonl`;

      vol.fromNestedJSON({
        "/test": {
          [`${sessionId}.jsonl`]: "\n\n\n",
        },
      });

      const result = await parseJsonlMessages(filePath, sessionId);

      expect(result.messages).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("parseMultipleJsonlFiles", () => {
    it("combines messages from multiple files", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      const file1Content = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId: session1,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-1",
          sessionId: session1,
          timestamp: "2026-01-15T10:00:05.000Z",
        }),
      ].join("\n");

      const file2Content = [
        JSON.stringify({
          type: "user",
          uuid: "user-2",
          sessionId: session2,
          timestamp: "2026-01-15T11:00:00.000Z",
        }),
        JSON.stringify({
          type: "assistant",
          uuid: "assistant-2",
          sessionId: session2,
          timestamp: "2026-01-15T11:00:05.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${session1}.jsonl`]: file1Content,
          [`${session2}.jsonl`]: file2Content,
        },
      });

      const result = await parseMultipleJsonlFiles(
        [`/test/${session1}.jsonl`, `/test/${session2}.jsonl`],
        [session1, session2]
      );

      expect(result.errors).toHaveLength(0);
      expect(result.messages).toHaveLength(4);
      // Should be sorted chronologically across all files
      expect(result.messages[0].timestamp.toISOString()).toBe("2026-01-15T10:00:00.000Z");
      expect(result.messages[3].timestamp.toISOString()).toBe("2026-01-15T11:00:05.000Z");
    });

    it("handles mix of valid and invalid files", async () => {
      const session1 = "session-1";

      const file1Content = [
        JSON.stringify({
          type: "user",
          uuid: "user-1",
          sessionId: session1,
          timestamp: "2026-01-15T10:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/test": {
          [`${session1}.jsonl`]: file1Content,
        },
      });

      const result = await parseMultipleJsonlFiles(
        [`/test/${session1}.jsonl`, `/test/non-existent.jsonl`],
        [session1, "non-existent"]
      );

      expect(result.messages).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
    });
  });
});

import { vol } from "memfs";
import {
  parseSessionIndex,
  discoverProjectDirectories,
  discoverJsonlFiles,
  parseJsonlFile,
  parseSessionsFromJsonl,
  discoverAndParseAll,
  hasSessionIndex,
} from "../session-parser";

// Mock the fs module
jest.mock("fs", () => {
  const memfs = require("memfs");
  return {
    ...memfs.fs,
    createReadStream: memfs.fs.createReadStream,
  };
});

// Mock os.homedir to return a predictable path
jest.mock("os", () => ({
  homedir: () => "/home/user",
}));

describe("session-parser", () => {
  beforeEach(() => {
    // Reset the virtual filesystem before each test
    vol.reset();
  });

  describe("parseSessionIndex", () => {
    const basePath = "/home/user/.claude/projects";

    it("parses valid sessions-index.json with snake_case fields", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          project_path: "/Users/name/project",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
          message_count: 10,
          summary: "Test session",
          first_prompt: "Hello",
          git_branch: "main",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0]).toEqual({
        id: "abc123",
        projectPath: "/Users/name/project",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
        duration: 3600000, // 1 hour in ms
        messageCount: 10,
        summary: "Test session",
        firstPrompt: "Hello",
        gitBranch: "main",
      });
    });

    it("parses valid sessions-index.json with camelCase fields", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          sessionId: "def456",
          projectPath: "/Users/name/project",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T12:00:00.000Z",
          messageCount: 20,
          summary: "Another session",
          firstPrompt: "Hi there",
          gitBranch: "feature",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe("def456");
      expect(result.sessions[0].messageCount).toBe(20);
      expect(result.sessions[0].gitBranch).toBe("feature");
    });

    it("handles missing sessions-index.json", () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {},
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(0);
      expect(result.projectPath).toBe("/Users/name/project");
      expect(result.projectName).toBe("project");
    });

    it("handles malformed JSON", () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": "not valid json {",
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Failed to parse JSON");
      expect(result.sessions).toHaveLength(0);
    });

    it("handles unsupported JSON format", () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify({ not: "an array" }),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("unsupported format");
      expect(result.sessions).toHaveLength(0);
    });

    it("parses versioned format with entries array", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = {
        version: 1,
        entries: [
          {
            sessionId: "abc123",
            projectPath: "/Users/name/project",
            created: "2026-01-01T10:00:00.000Z",
            modified: "2026-01-01T11:00:00.000Z",
            messageCount: 10,
            summary: "Test session",
            firstPrompt: "Hello",
            gitBranch: "main",
          },
        ],
      };

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe("abc123");
    });

    it("skips entries missing session_id", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("missing session_id");
      expect(result.sessions).toHaveLength(0);
    });

    it("skips entries missing created timestamp", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          modified: "2026-01-01T11:00:00.000Z",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("missing created timestamp");
      expect(result.sessions).toHaveLength(0);
    });

    it("skips entries missing modified timestamp", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "2026-01-01T10:00:00.000Z",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("missing modified timestamp");
      expect(result.sessions).toHaveLength(0);
    });

    it("skips entries with invalid created date", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "not-a-date",
          modified: "2026-01-01T11:00:00.000Z",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("invalid created date");
      expect(result.sessions).toHaveLength(0);
    });

    it("skips entries with invalid modified date", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "2026-01-01T10:00:00.000Z",
          modified: "invalid-date",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("invalid modified date");
      expect(result.sessions).toHaveLength(0);
    });

    it("handles optional fields being null/undefined", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
          // No optional fields
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].messageCount).toBe(0);
      expect(result.sessions[0].summary).toBeNull();
      expect(result.sessions[0].firstPrompt).toBeNull();
      expect(result.sessions[0].gitBranch).toBeNull();
    });

    it("processes multiple valid entries", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "session1",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
          message_count: 5,
        },
        {
          session_id: "session2",
          created: "2026-01-02T10:00:00.000Z",
          modified: "2026-01-02T12:00:00.000Z",
          message_count: 10,
        },
        {
          session_id: "session3",
          created: "2026-01-03T10:00:00.000Z",
          modified: "2026-01-03T14:00:00.000Z",
          message_count: 15,
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(3);
      expect(result.sessions.map((s) => s.id)).toEqual(["session1", "session2", "session3"]);
    });

    it("continues processing after skipping invalid entry", () => {
      const projectDir = "-Users-name-project";
      const sessionsIndex = [
        {
          session_id: "valid1",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
        },
        {
          // Invalid - missing session_id
          created: "2026-01-02T10:00:00.000Z",
          modified: "2026-01-02T11:00:00.000Z",
        },
        {
          session_id: "valid2",
          created: "2026-01-03T10:00:00.000Z",
          modified: "2026-01-03T11:00:00.000Z",
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
      });

      const result = parseSessionIndex(projectDir, basePath);

      expect(result.errors).toHaveLength(1);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions.map((s) => s.id)).toEqual(["valid1", "valid2"]);
    });
  });

  describe("discoverProjectDirectories", () => {
    it("discovers URL-encoded project directories", () => {
      const basePath = "/home/user/.claude/projects";

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project1": {},
          "-Users-name-project2": {},
          "-home-user-code": {},
        },
      });

      const dirs = discoverProjectDirectories(basePath);

      expect(dirs).toHaveLength(3);
      expect(dirs).toContain("-Users-name-project1");
      expect(dirs).toContain("-Users-name-project2");
      expect(dirs).toContain("-home-user-code");
    });

    it("filters out non-URL-encoded directories", () => {
      const basePath = "/home/user/.claude/projects";

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project": {},
          "some-other-dir": {}, // Does not start with -
          ".hidden": {}, // Hidden directory
        },
      });

      const dirs = discoverProjectDirectories(basePath);

      expect(dirs).toHaveLength(1);
      expect(dirs).toContain("-Users-name-project");
    });

    it("returns empty array for non-existent path", () => {
      const basePath = "/nonexistent/path";

      const dirs = discoverProjectDirectories(basePath);

      expect(dirs).toEqual([]);
    });

    it("ignores files in the projects directory", () => {
      const basePath = "/home/user/.claude/projects";

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project": {},
          "some-file.txt": "content",
        },
      });

      const dirs = discoverProjectDirectories(basePath);

      expect(dirs).toHaveLength(1);
      expect(dirs).toContain("-Users-name-project");
    });
  });

  describe("hasSessionIndex", () => {
    const basePath = "/home/user/.claude/projects";

    it("returns true when sessions-index.json exists", () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "sessions-index.json": "[]",
          },
        },
      });

      expect(hasSessionIndex(projectDir, basePath)).toBe(true);
    });

    it("returns false when sessions-index.json does not exist", () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {},
        },
      });

      expect(hasSessionIndex(projectDir, basePath)).toBe(false);
    });
  });

  describe("discoverJsonlFiles", () => {
    it("discovers jsonl files in a directory", () => {
      const projectPath = "/home/user/.claude/projects/-Users-name-project";

      vol.fromNestedJSON({
        [projectPath]: {
          "session1.jsonl": '{"type":"user"}',
          "session2.jsonl": '{"type":"user"}',
          "sessions-index.json": "[]",
          "other-file.txt": "content",
        },
      });

      const files = discoverJsonlFiles(projectPath);

      expect(files).toHaveLength(2);
      expect(files).toContain(`${projectPath}/session1.jsonl`);
      expect(files).toContain(`${projectPath}/session2.jsonl`);
    });

    it("returns empty array for non-existent directory", () => {
      const files = discoverJsonlFiles("/nonexistent/path");
      expect(files).toEqual([]);
    });

    it("returns empty array when no jsonl files exist", () => {
      const projectPath = "/home/user/.claude/projects/-Users-name-project";

      vol.fromNestedJSON({
        [projectPath]: {
          "sessions-index.json": "[]",
        },
      });

      const files = discoverJsonlFiles(projectPath);
      expect(files).toEqual([]);
    });
  });

  describe("parseJsonlFile", () => {
    it("parses a valid jsonl session file", async () => {
      const filePath = "/home/user/.claude/projects/-Users-name-project/abc123.jsonl";

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-01T10:00:00.000Z",
          gitBranch: "main",
          message: { content: [{ type: "text", text: "Hello world" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-01T10:05:00.000Z",
        }),
        JSON.stringify({
          type: "summary",
          summary: "Test conversation",
        }),
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-01T10:10:00.000Z",
          message: { content: [{ type: "text", text: "Follow up" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-01T10:15:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        "/home/user/.claude/projects/-Users-name-project": {
          "abc123.jsonl": jsonlContent,
        },
      });

      const result = await parseJsonlFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.sessionId).toBe("abc123");
      expect(result!.created).toBe("2026-01-01T10:00:00.000Z");
      expect(result!.modified).toBe("2026-01-01T10:15:00.000Z");
      expect(result!.messageCount).toBe(4);
      expect(result!.summary).toBe("Test conversation");
      expect(result!.firstPrompt).toBe("Hello world");
      expect(result!.gitBranch).toBe("main");
    });

    it("returns null for non-existent file", async () => {
      const result = await parseJsonlFile("/nonexistent/file.jsonl");
      expect(result).toBeNull();
    });

    it("handles empty jsonl file", async () => {
      const filePath = "/home/user/.claude/projects/-Users-name-project/empty.jsonl";

      vol.fromNestedJSON({
        "/home/user/.claude/projects/-Users-name-project": {
          "empty.jsonl": "",
        },
      });

      const result = await parseJsonlFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.sessionId).toBe("empty");
      expect(result!.messageCount).toBe(0);
      // Should fall back to file timestamps
      expect(result!.created).not.toBeNull();
      expect(result!.modified).not.toBeNull();
    });

    it("truncates long first prompts", async () => {
      const filePath = "/home/user/.claude/projects/-Users-name-project/long.jsonl";
      const longText = "x".repeat(600);

      const jsonlContent = JSON.stringify({
        type: "user",
        timestamp: "2026-01-01T10:00:00.000Z",
        message: { content: [{ type: "text", text: longText }] },
      });

      vol.fromNestedJSON({
        "/home/user/.claude/projects/-Users-name-project": {
          "long.jsonl": jsonlContent,
        },
      });

      const result = await parseJsonlFile(filePath);

      expect(result).not.toBeNull();
      expect(result!.firstPrompt).toHaveLength(500);
    });
  });

  describe("parseSessionsFromJsonl", () => {
    const basePath = "/home/user/.claude/projects";

    it("parses sessions from jsonl files", async () => {
      const projectDir = "-Users-name-project";

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-01T10:00:00.000Z",
          gitBranch: "main",
          message: { content: [{ type: "text", text: "Hello" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-01T11:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "session1.jsonl": jsonlContent,
          },
        },
      });

      const result = await parseSessionsFromJsonl(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(1);
      expect(result.sessions[0].id).toBe("session1");
      expect(result.sessions[0].projectPath).toBe("/Users/name/project");
      expect(result.sessions[0].duration).toBe(3600000); // 1 hour
      expect(result.projectName).toBe("project");
    });

    it("handles multiple jsonl files", async () => {
      const projectDir = "-Users-name-project";

      const createJsonl = (timestamp: string) =>
        [
          JSON.stringify({
            type: "user",
            timestamp,
            message: { content: [{ type: "text", text: "Test" }] },
          }),
          JSON.stringify({
            type: "assistant",
            timestamp,
          }),
        ].join("\n");

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {
            "session1.jsonl": createJsonl("2026-01-01T10:00:00.000Z"),
            "session2.jsonl": createJsonl("2026-01-02T10:00:00.000Z"),
          },
        },
      });

      const result = await parseSessionsFromJsonl(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(2);
    });

    it("returns empty sessions for project with no jsonl files", async () => {
      const projectDir = "-Users-name-project";

      vol.fromNestedJSON({
        [basePath]: {
          [projectDir]: {},
        },
      });

      const result = await parseSessionsFromJsonl(projectDir, basePath);

      expect(result.errors).toHaveLength(0);
      expect(result.sessions).toHaveLength(0);
    });
  });

  describe("discoverAndParseAll", () => {
    const basePath = "/home/user/.claude/projects";

    it("discovers projects with sessions-index.json", async () => {
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
          message_count: 10,
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project": {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
        // Create the decoded project path so existsSync check passes
        "/Users/name/project": {},
      });

      const result = await discoverAndParseAll();

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].name).toBe("project");
      expect(result.sessions).toHaveLength(1);
    });

    it("falls back to jsonl parsing for projects without sessions-index.json", async () => {
      const jsonlContent = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-01T10:00:00.000Z",
          message: { content: [{ type: "text", text: "Hello" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-01T11:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project": {
            "session1.jsonl": jsonlContent,
          },
        },
        // Create the decoded project path so existsSync check passes
        "/Users/name/project": {},
      });

      const result = await discoverAndParseAll();

      expect(result.projects).toHaveLength(1);
      expect(result.sessions).toHaveLength(1);
    });

    it("handles mix of indexed and non-indexed projects", async () => {
      const sessionsIndex = [
        {
          session_id: "indexed-session",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
        },
      ];

      const jsonlContent = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-02T10:00:00.000Z",
          message: { content: [{ type: "text", text: "Hello" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-02T11:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-indexed-project": {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
          "-Users-name-jsonl-project": {
            "session1.jsonl": jsonlContent,
          },
        },
        // Create the decoded project paths so existsSync check passes
        "/Users/name/indexed-project": {},
        "/Users/name/jsonl-project": {},
      });

      const result = await discoverAndParseAll();

      expect(result.projects).toHaveLength(2);
      expect(result.sessions).toHaveLength(2);
    });

    it("returns empty result when claude projects directory does not exist", async () => {
      vol.reset();

      const result = await discoverAndParseAll();

      expect(result.projects).toHaveLength(0);
      expect(result.sessions).toHaveLength(0);
      expect(result.claudeProjectsPath).toBeNull();
    });

    it("calculates project aggregates correctly", async () => {
      const jsonlContent1 = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-01T10:00:00.000Z",
          message: { content: [{ type: "text", text: "Hello" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-01T11:00:00.000Z",
        }),
      ].join("\n");

      const jsonlContent2 = [
        JSON.stringify({
          type: "user",
          timestamp: "2026-01-02T10:00:00.000Z",
          message: { content: [{ type: "text", text: "Hi" }] },
        }),
        JSON.stringify({
          type: "assistant",
          timestamp: "2026-01-02T12:00:00.000Z",
        }),
      ].join("\n");

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-project": {
            "session1.jsonl": jsonlContent1,
            "session2.jsonl": jsonlContent2,
          },
        },
        // Create the decoded project path so existsSync check passes
        "/Users/name/project": {},
      });

      const result = await discoverAndParseAll();

      expect(result.projects).toHaveLength(1);
      const project = result.projects[0];
      expect(project.sessionCount).toBe(2);
      expect(project.firstActivity).toBe("2026-01-01T10:00:00.000Z");
      expect(project.lastActivity).toBe("2026-01-02T12:00:00.000Z");
      // 1 hour + 2 hours = 3 hours
      expect(project.totalTime).toBe(3600000 + 7200000);
    });

    it("skips projects whose decoded path does not exist", async () => {
      const sessionsIndex = [
        {
          session_id: "abc123",
          created: "2026-01-01T10:00:00.000Z",
          modified: "2026-01-01T11:00:00.000Z",
          message_count: 10,
        },
      ];

      vol.fromNestedJSON({
        [basePath]: {
          "-Users-name-deleted-project": {
            "sessions-index.json": JSON.stringify(sessionsIndex),
          },
        },
        // Intentionally NOT creating the decoded project path
      });

      const result = await discoverAndParseAll();

      // Project should be skipped because /Users/name/deleted-project doesn't exist
      expect(result.projects).toHaveLength(0);
      expect(result.sessions).toHaveLength(0);
    });
  });
});

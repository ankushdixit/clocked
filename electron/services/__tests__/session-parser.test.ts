import { vol } from "memfs";
import { parseSessionIndex, discoverProjectDirectories } from "../session-parser";

// Mock the fs module
jest.mock("fs", () => require("memfs").fs);

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

    it("handles non-array JSON", () => {
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
      expect(result.errors[0]).toContain("does not contain an array");
      expect(result.sessions).toHaveLength(0);
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
});

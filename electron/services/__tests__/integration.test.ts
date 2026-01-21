import { join } from "path";
import { tmpdir } from "os";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "fs";

// Create unique test home directory for this test file
const testHomeDir = join(tmpdir(), "clocked-integration-test-" + Date.now());

// Mock homedir for database
jest.mock("os", () => ({
  ...jest.requireActual("os"),
  homedir: () => testHomeDir,
}));

// Import after mocking
import {
  initializeDatabase,
  closeDatabase,
  getAllProjects,
  getAllSessions,
  getSessionsByProject,
  clearDatabase,
} from "../database";
import { syncSessionsToDatabase } from "../session-parser";

describe("Integration: Session Parser + Database", () => {
  const claudeProjectsPath = join(testHomeDir, ".claude", "projects");

  beforeAll(() => {
    // Create the test home directory and .claude/projects
    mkdirSync(claudeProjectsPath, { recursive: true });
    // Initialize database
    initializeDatabase();
  });

  afterAll(() => {
    closeDatabase();
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    clearDatabase();
    // Clean up project directories but keep .claude/projects
    const entries = existsSync(claudeProjectsPath)
      ? require("fs").readdirSync(claudeProjectsPath)
      : [];
    for (const entry of entries) {
      rmSync(join(claudeProjectsPath, entry), { recursive: true, force: true });
    }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function createProject(encodedPath: string, sessions: any[]): void {
    const projectDir = join(claudeProjectsPath, encodedPath);
    mkdirSync(projectDir, { recursive: true });
    writeFileSync(join(projectDir, "sessions-index.json"), JSON.stringify(sessions));
  }

  it("syncs single project with multiple sessions", () => {
    createProject("-Users-dev-myproject", [
      {
        session_id: "session-1",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
        message_count: 10,
        summary: "First session",
        git_branch: "main",
      },
      {
        session_id: "session-2",
        created: "2026-01-02T14:00:00.000Z",
        modified: "2026-01-02T16:00:00.000Z",
        message_count: 25,
        summary: "Second session",
        git_branch: "feature",
      },
    ]);

    const result = syncSessionsToDatabase();

    expect(result.projects).toHaveLength(1);
    expect(result.sessions).toHaveLength(2);
    expect(result.errors).toHaveLength(0);

    // Check database
    const projects = getAllProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].path).toBe("/Users/dev/myproject");
    expect(projects[0].name).toBe("myproject");
    expect(projects[0].sessionCount).toBe(2);
    expect(projects[0].messageCount).toBe(35); // 10 + 25

    const sessions = getAllSessions();
    expect(sessions).toHaveLength(2);
  });

  it("syncs multiple projects", () => {
    createProject("-Users-dev-project1", [
      {
        session_id: "p1-session-1",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
        message_count: 5,
      },
    ]);

    createProject("-Users-dev-project2", [
      {
        session_id: "p2-session-1",
        created: "2026-01-05T10:00:00.000Z",
        modified: "2026-01-05T12:00:00.000Z",
        message_count: 15,
      },
      {
        session_id: "p2-session-2",
        created: "2026-01-06T10:00:00.000Z",
        modified: "2026-01-06T14:00:00.000Z",
        message_count: 20,
      },
    ]);

    createProject("-home-user-code", [
      {
        session_id: "p3-session-1",
        created: "2026-01-10T10:00:00.000Z",
        modified: "2026-01-10T11:00:00.000Z",
        message_count: 8,
      },
    ]);

    const result = syncSessionsToDatabase();

    expect(result.projects).toHaveLength(3);
    expect(result.sessions).toHaveLength(4);

    const projects = getAllProjects();
    expect(projects).toHaveLength(3);

    const sessions = getAllSessions();
    expect(sessions).toHaveLength(4);

    // Check sessions by project
    const p1Sessions = getSessionsByProject("/Users/dev/project1");
    expect(p1Sessions.sessions).toHaveLength(1);
    expect(p1Sessions.total).toBe(1);

    const p2Sessions = getSessionsByProject("/Users/dev/project2");
    expect(p2Sessions.sessions).toHaveLength(2);
    expect(p2Sessions.total).toBe(2);
  });

  it("handles project with no sessions-index.json", () => {
    // Create project directory without sessions-index.json
    const projectDir = join(claudeProjectsPath, "-Users-dev-empty");
    mkdirSync(projectDir, { recursive: true });

    const result = syncSessionsToDatabase();

    // Project without sessions-index.json should be skipped
    expect(result.projects).toHaveLength(0);
    expect(result.sessions).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("handles malformed sessions-index.json gracefully", () => {
    // Create project with valid sessions
    createProject("-Users-dev-valid", [
      {
        session_id: "valid-session",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
      },
    ]);

    // Create project with malformed JSON
    const malformedDir = join(claudeProjectsPath, "-Users-dev-malformed");
    mkdirSync(malformedDir, { recursive: true });
    writeFileSync(join(malformedDir, "sessions-index.json"), "not valid json");

    const result = syncSessionsToDatabase();

    // Valid project should be synced
    expect(result.projects).toHaveLength(1);
    expect(result.sessions).toHaveLength(1);

    // Error should be recorded
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("Failed to parse JSON");

    // Check database has only valid data
    const projects = getAllProjects();
    expect(projects).toHaveLength(1);
    expect(projects[0].path).toBe("/Users/dev/valid");
  });

  it("skips invalid session entries but keeps valid ones", () => {
    createProject("-Users-dev-mixed", [
      // Valid
      {
        session_id: "valid-1",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
      },
      // Invalid - missing session_id
      {
        created: "2026-01-02T10:00:00.000Z",
        modified: "2026-01-02T11:00:00.000Z",
      },
      // Valid
      {
        session_id: "valid-2",
        created: "2026-01-03T10:00:00.000Z",
        modified: "2026-01-03T11:00:00.000Z",
      },
      // Invalid - missing dates
      {
        session_id: "invalid-no-dates",
      },
    ]);

    const result = syncSessionsToDatabase();

    expect(result.sessions).toHaveLength(2);
    expect(result.errors.length).toBeGreaterThan(0);

    const sessions = getAllSessions();
    expect(sessions).toHaveLength(2);
    const sessionIds = sessions.map((s) => s.id);
    expect(sessionIds).toContain("valid-1");
    expect(sessionIds).toContain("valid-2");
  });

  it("calculates correct project aggregates", () => {
    createProject("-Users-dev-project", [
      {
        session_id: "session-1",
        created: "2026-01-10T10:00:00.000Z",
        modified: "2026-01-10T11:00:00.000Z",
        message_count: 10,
      },
      {
        session_id: "session-2",
        created: "2026-01-05T09:00:00.000Z", // Earlier start
        modified: "2026-01-05T10:00:00.000Z",
        message_count: 5,
      },
      {
        session_id: "session-3",
        created: "2026-01-15T14:00:00.000Z",
        modified: "2026-01-15T18:00:00.000Z", // Latest end
        message_count: 20,
      },
    ]);

    syncSessionsToDatabase();

    const projects = getAllProjects();
    expect(projects).toHaveLength(1);

    const project = projects[0];
    expect(project.sessionCount).toBe(3);
    expect(project.messageCount).toBe(35); // 10 + 5 + 20
    expect(project.firstActivity).toBe("2026-01-05T09:00:00.000Z");
    expect(project.lastActivity).toBe("2026-01-15T18:00:00.000Z");
  });

  it("updates existing data on re-sync", () => {
    // First sync
    createProject("-Users-dev-project", [
      {
        session_id: "session-1",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
        message_count: 10,
      },
    ]);

    syncSessionsToDatabase();
    expect(getAllSessions()).toHaveLength(1);

    // Update sessions-index.json with more sessions
    createProject("-Users-dev-project", [
      {
        session_id: "session-1",
        created: "2026-01-01T10:00:00.000Z",
        modified: "2026-01-01T11:00:00.000Z",
        message_count: 10,
      },
      {
        session_id: "session-2",
        created: "2026-01-02T10:00:00.000Z",
        modified: "2026-01-02T12:00:00.000Z",
        message_count: 20,
      },
    ]);

    // Second sync
    syncSessionsToDatabase();

    const sessions = getAllSessions();
    expect(sessions).toHaveLength(2);

    const projects = getAllProjects();
    expect(projects[0].sessionCount).toBe(2);
    expect(projects[0].messageCount).toBe(30);
  });

  it("returns empty result when no Claude projects exist", () => {
    // Remove the Claude projects directory
    rmSync(claudeProjectsPath, { recursive: true, force: true });

    const result = syncSessionsToDatabase();

    expect(result.projects).toHaveLength(0);
    expect(result.sessions).toHaveLength(0);
    expect(result.claudeProjectsPath).toBeNull();

    // Recreate for other tests
    mkdirSync(claudeProjectsPath, { recursive: true });
  });

  describe("Query performance", () => {
    it("queries 1000 sessions in under 100ms", () => {
      // Ensure the Claude projects directory exists (may be deleted by previous test)
      if (!existsSync(claudeProjectsPath)) {
        mkdirSync(claudeProjectsPath, { recursive: true });
      }

      // Create a project with 1000 sessions
      // Use ISO date from base timestamp to avoid invalid dates
      const baseTimestamp = new Date("2026-01-01T00:00:00.000Z").getTime();
      const hourInMs = 60 * 60 * 1000;

      const sessions = Array.from({ length: 1000 }, (_, i) => {
        const created = new Date(baseTimestamp + i * hourInMs);
        const modified = new Date(baseTimestamp + i * hourInMs + 30 * 60 * 1000); // 30 min later
        return {
          session_id: `session-${i}`,
          created: created.toISOString(),
          modified: modified.toISOString(),
          message_count: i,
        };
      });

      // Note: the directory "-Users-dev-largeproject" decodes to "/Users/dev/largeproject"
      // (all hyphens become slashes in the path decoder)
      createProject("-Users-dev-largeproject", sessions);

      // Verify the file was created
      const projectDir = join(claudeProjectsPath, "-Users-dev-largeproject");
      const indexPath = join(projectDir, "sessions-index.json");
      expect(existsSync(projectDir)).toBe(true);
      expect(existsSync(indexPath)).toBe(true);

      const result = syncSessionsToDatabase();

      // Verify sync worked
      expect(result.sessions.length).toBe(1000);
      expect(result.projects.length).toBe(1);

      // Also verify the database has the data
      const allProjectsInDb = getAllProjects();
      const allSessionsInDb = getAllSessions();
      expect(allProjectsInDb.length).toBe(1);
      expect(allSessionsInDb.length).toBe(1000);

      // Measure query time for getSessionsByProject
      const startByProject = performance.now();
      const resultByProject = getSessionsByProject("/Users/dev/largeproject");
      const endByProject = performance.now();

      expect(resultByProject.total).toBe(1000);
      expect(endByProject - startByProject).toBeLessThan(100);

      // Measure query time for getAllSessions
      const startAll = performance.now();
      const allSessions = getAllSessions();
      const endAll = performance.now();

      expect(allSessions).toHaveLength(1000);
      expect(endAll - startAll).toBeLessThan(100);
    });
  });
});

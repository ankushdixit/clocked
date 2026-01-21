import { existsSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// We need to test the database module in isolation with a temp directory
// So we'll mock homedir to return a temp path
const testHomeDir = join(tmpdir(), "clocked-test-" + Date.now());

jest.mock("os", () => ({
  ...jest.requireActual("os"),
  homedir: () => testHomeDir,
}));

// Import after mocking
import {
  initializeDatabase,
  closeDatabase,
  getDatabasePath,
  getDatabaseDir,
  upsertProject,
  getAllProjects,
  getProjectByPath,
  deleteAllProjects,
  upsertSession,
  upsertSessions,
  getAllSessions,
  getSessionsByProject,
  getSessionsByDateRange,
  getSessionById,
  deleteAllSessions,
  deleteSessionsByProject,
  getSessionCount,
  getProjectCount,
  clearDatabase,
  ProjectInput,
  SessionInput,
} from "../database";

describe("database", () => {
  beforeAll(() => {
    // Create the test home directory
    if (!existsSync(testHomeDir)) {
      mkdirSync(testHomeDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up the database connection and test directory
    closeDatabase();
    if (existsSync(testHomeDir)) {
      rmSync(testHomeDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // Initialize database and clear data before each test
    initializeDatabase();
    clearDatabase();
  });

  describe("getDatabasePath", () => {
    it("returns correct path", () => {
      const path = getDatabasePath();
      expect(path).toBe(join(testHomeDir, ".clocked", "cache.db"));
    });
  });

  describe("getDatabaseDir", () => {
    it("returns correct directory", () => {
      const dir = getDatabaseDir();
      expect(dir).toBe(join(testHomeDir, ".clocked"));
    });
  });

  describe("initializeDatabase", () => {
    it("creates database file", () => {
      const db = initializeDatabase();
      expect(db).toBeDefined();
      expect(existsSync(getDatabasePath())).toBe(true);
    });

    it("creates tables", () => {
      const db = initializeDatabase();
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain("projects");
      expect(tableNames).toContain("sessions");
    });

    it("creates indexes", () => {
      const db = initializeDatabase();
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%'")
        .all() as { name: string }[];
      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain("idx_sessions_project");
      expect(indexNames).toContain("idx_sessions_created");
      expect(indexNames).toContain("idx_sessions_modified");
    });
  });

  describe("Project operations", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
    };

    it("upsertProject inserts new project", () => {
      upsertProject(testProject);
      const projects = getAllProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].path).toBe(testProject.path);
      expect(projects[0].name).toBe(testProject.name);
    });

    it("upsertProject updates existing project", () => {
      upsertProject(testProject);

      const updatedProject: ProjectInput = {
        ...testProject,
        sessionCount: 10,
        messageCount: 200,
      };
      upsertProject(updatedProject);

      const projects = getAllProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].sessionCount).toBe(10);
      expect(projects[0].messageCount).toBe(200);
    });

    it("getAllProjects returns all projects ordered by last activity", () => {
      const project1: ProjectInput = {
        path: "/Users/test/project1",
        name: "project1",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-10T15:00:00.000Z",
        sessionCount: 3,
        messageCount: 50,
      };
      const project2: ProjectInput = {
        path: "/Users/test/project2",
        name: "project2",
        firstActivity: "2026-01-05T10:00:00.000Z",
        lastActivity: "2026-01-20T15:00:00.000Z",
        sessionCount: 5,
        messageCount: 100,
      };

      upsertProject(project1);
      upsertProject(project2);

      const projects = getAllProjects();
      expect(projects).toHaveLength(2);
      // project2 has more recent lastActivity, should be first
      expect(projects[0].path).toBe("/Users/test/project2");
      expect(projects[1].path).toBe("/Users/test/project1");
    });

    it("getProjectByPath returns correct project", () => {
      upsertProject(testProject);
      const project = getProjectByPath(testProject.path);
      expect(project).not.toBeNull();
      expect(project!.path).toBe(testProject.path);
    });

    it("getProjectByPath returns null for non-existent project", () => {
      const project = getProjectByPath("/nonexistent/path");
      expect(project).toBeNull();
    });

    it("deleteAllProjects removes all projects", () => {
      upsertProject(testProject);
      expect(getAllProjects()).toHaveLength(1);

      deleteAllProjects();
      expect(getAllProjects()).toHaveLength(0);
    });

    it("getProjectCount returns correct count", () => {
      expect(getProjectCount()).toBe(0);

      upsertProject(testProject);
      expect(getProjectCount()).toBe(1);

      upsertProject({
        ...testProject,
        path: "/Users/test/project2",
        name: "project2",
      });
      expect(getProjectCount()).toBe(2);
    });
  });

  describe("Session operations", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 1,
      messageCount: 10,
    };

    const testSession: SessionInput = {
      id: "session-123",
      projectPath: "/Users/test/project",
      created: "2026-01-10T10:00:00.000Z",
      modified: "2026-01-10T11:00:00.000Z",
      duration: 3600000,
      messageCount: 10,
      summary: "Test session",
      firstPrompt: "Hello",
      gitBranch: "main",
    };

    beforeEach(() => {
      // Create project before sessions
      upsertProject(testProject);
    });

    it("upsertSession inserts new session", () => {
      upsertSession(testSession);
      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].id).toBe(testSession.id);
    });

    it("upsertSession updates existing session", () => {
      upsertSession(testSession);

      const updatedSession: SessionInput = {
        ...testSession,
        messageCount: 20,
        summary: "Updated summary",
      };
      upsertSession(updatedSession);

      const sessions = getAllSessions();
      expect(sessions).toHaveLength(1);
      expect(sessions[0].messageCount).toBe(20);
      expect(sessions[0].summary).toBe("Updated summary");
    });

    it("upsertSessions inserts multiple sessions", () => {
      const sessions: SessionInput[] = [
        testSession,
        {
          ...testSession,
          id: "session-456",
          created: "2026-01-11T10:00:00.000Z",
          modified: "2026-01-11T12:00:00.000Z",
        },
        {
          ...testSession,
          id: "session-789",
          created: "2026-01-12T10:00:00.000Z",
          modified: "2026-01-12T14:00:00.000Z",
        },
      ];

      upsertSessions(sessions);
      expect(getAllSessions()).toHaveLength(3);
    });

    it("getAllSessions returns sessions ordered by modified desc", () => {
      const sessions: SessionInput[] = [
        {
          ...testSession,
          id: "old",
          modified: "2026-01-01T11:00:00.000Z",
        },
        {
          ...testSession,
          id: "new",
          modified: "2026-01-20T11:00:00.000Z",
        },
        {
          ...testSession,
          id: "mid",
          modified: "2026-01-10T11:00:00.000Z",
        },
      ];

      upsertSessions(sessions);
      const result = getAllSessions();

      expect(result[0].id).toBe("new");
      expect(result[1].id).toBe("mid");
      expect(result[2].id).toBe("old");
    });

    it("getSessionsByProject returns sessions for project with pagination", () => {
      const sessions: SessionInput[] = Array.from({ length: 15 }, (_, i) => ({
        ...testSession,
        id: `session-${i}`,
        modified: `2026-01-${String(i + 1).padStart(2, "0")}T11:00:00.000Z`,
      }));

      upsertSessions(sessions);

      // Get first page
      const page1 = getSessionsByProject("/Users/test/project", 5, 0);
      expect(page1.sessions).toHaveLength(5);
      expect(page1.total).toBe(15);

      // Get second page
      const page2 = getSessionsByProject("/Users/test/project", 5, 5);
      expect(page2.sessions).toHaveLength(5);
      expect(page2.total).toBe(15);

      // Sessions should be different between pages
      const page1Ids = page1.sessions.map((s) => s.id);
      const page2Ids = page2.sessions.map((s) => s.id);
      expect(page1Ids).not.toEqual(page2Ids);
    });

    it("getSessionsByProject returns all sessions when no limit", () => {
      const sessions: SessionInput[] = Array.from({ length: 10 }, (_, i) => ({
        ...testSession,
        id: `session-${i}`,
      }));

      upsertSessions(sessions);

      const result = getSessionsByProject("/Users/test/project");
      expect(result.sessions).toHaveLength(10);
      expect(result.total).toBe(10);
    });

    it("getSessionsByDateRange returns sessions in range", () => {
      const sessions: SessionInput[] = [
        {
          ...testSession,
          id: "jan5",
          created: "2026-01-05T10:00:00.000Z",
        },
        {
          ...testSession,
          id: "jan10",
          created: "2026-01-10T10:00:00.000Z",
        },
        {
          ...testSession,
          id: "jan15",
          created: "2026-01-15T10:00:00.000Z",
        },
        {
          ...testSession,
          id: "jan20",
          created: "2026-01-20T10:00:00.000Z",
        },
      ];

      upsertSessions(sessions);

      const result = getSessionsByDateRange("2026-01-08T00:00:00.000Z", "2026-01-17T00:00:00.000Z");

      expect(result).toHaveLength(2);
      const ids = result.map((s) => s.id);
      expect(ids).toContain("jan10");
      expect(ids).toContain("jan15");
    });

    it("getSessionById returns correct session", () => {
      upsertSession(testSession);
      const session = getSessionById(testSession.id);
      expect(session).not.toBeNull();
      expect(session!.id).toBe(testSession.id);
      expect(session!.summary).toBe(testSession.summary);
    });

    it("getSessionById returns null for non-existent session", () => {
      const session = getSessionById("nonexistent-id");
      expect(session).toBeNull();
    });

    it("deleteAllSessions removes all sessions", () => {
      upsertSession(testSession);
      expect(getAllSessions()).toHaveLength(1);

      deleteAllSessions();
      expect(getAllSessions()).toHaveLength(0);
    });

    it("deleteSessionsByProject removes sessions for specific project", () => {
      // Create another project
      upsertProject({
        path: "/Users/test/project2",
        name: "project2",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 1,
        messageCount: 5,
      });

      // Add sessions to both projects
      upsertSession(testSession);
      upsertSession({
        ...testSession,
        id: "session-other",
        projectPath: "/Users/test/project2",
      });

      expect(getAllSessions()).toHaveLength(2);

      deleteSessionsByProject("/Users/test/project");
      const remaining = getAllSessions();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].projectPath).toBe("/Users/test/project2");
    });

    it("getSessionCount returns correct count", () => {
      expect(getSessionCount()).toBe(0);

      upsertSession(testSession);
      expect(getSessionCount()).toBe(1);

      upsertSession({
        ...testSession,
        id: "session-2",
      });
      expect(getSessionCount()).toBe(2);
    });

    it("handles null optional fields", () => {
      const sessionWithNulls: SessionInput = {
        id: "session-nulls",
        projectPath: "/Users/test/project",
        created: "2026-01-10T10:00:00.000Z",
        modified: "2026-01-10T11:00:00.000Z",
        duration: 3600000,
        messageCount: 0,
        summary: null,
        firstPrompt: null,
        gitBranch: null,
      };

      upsertSession(sessionWithNulls);
      const session = getSessionById("session-nulls");

      expect(session).not.toBeNull();
      expect(session!.summary).toBeNull();
      expect(session!.firstPrompt).toBeNull();
      expect(session!.gitBranch).toBeNull();
    });
  });

  describe("clearDatabase", () => {
    it("clears both projects and sessions", () => {
      const project: ProjectInput = {
        path: "/Users/test/project",
        name: "project",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 1,
        messageCount: 10,
      };

      const session: SessionInput = {
        id: "session-123",
        projectPath: "/Users/test/project",
        created: "2026-01-10T10:00:00.000Z",
        modified: "2026-01-10T11:00:00.000Z",
        duration: 3600000,
        messageCount: 10,
        summary: null,
        firstPrompt: null,
        gitBranch: null,
      };

      upsertProject(project);
      upsertSession(session);

      expect(getProjectCount()).toBe(1);
      expect(getSessionCount()).toBe(1);

      clearDatabase();

      expect(getProjectCount()).toBe(0);
      expect(getSessionCount()).toBe(0);
    });
  });
});

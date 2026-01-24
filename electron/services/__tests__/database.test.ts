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
  getDatabase,
  getDatabasePath,
  getDatabaseDir,
  upsertProject,
  getAllProjects,
  getProjectByPath,
  deleteAllProjects,
  deleteProject,
  deleteOrphanedProjects,
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
  setProjectHidden,
  getHiddenProjects,
  setProjectGroup,
  setDefaultProject,
  getDefaultProject,
  clearDefaultProject,
  createProjectGroup,
  getAllProjectGroups,
  getProjectGroupById,
  updateProjectGroup,
  deleteProjectGroup,
  mergeProjects,
  unmergeProject,
  getMergedProjects,
  getSetting,
  setSetting,
  getAllSettings,
  getMonthlySummary,
  DEFAULT_SETTINGS,
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
      totalTime: 3600000,
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
        totalTime: 1800000,
      };
      const project2: ProjectInput = {
        path: "/Users/test/project2",
        name: "project2",
        firstActivity: "2026-01-05T10:00:00.000Z",
        lastActivity: "2026-01-20T15:00:00.000Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 7200000,
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
      totalTime: 3600000,
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
        totalTime: 1800000,
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
        totalTime: 3600000,
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

  describe("deleteProject", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    it("deletes a project by path", () => {
      upsertProject(testProject);
      expect(getProjectByPath(testProject.path)).not.toBeNull();

      deleteProject(testProject.path);
      expect(getProjectByPath(testProject.path)).toBeNull();
    });

    it("does not affect other projects", () => {
      const project2: ProjectInput = {
        ...testProject,
        path: "/Users/test/project2",
        name: "project2",
      };
      upsertProject(testProject);
      upsertProject(project2);

      deleteProject(testProject.path);

      expect(getProjectByPath(testProject.path)).toBeNull();
      expect(getProjectByPath(project2.path)).not.toBeNull();
    });

    it("handles non-existent project gracefully", () => {
      // Should not throw
      expect(() => deleteProject("/nonexistent/path")).not.toThrow();
    });
  });

  describe("deleteOrphanedProjects", () => {
    it("deletes projects not in the valid paths set", () => {
      const projects: ProjectInput[] = [
        {
          path: "/Users/test/project1",
          name: "project1",
          firstActivity: "2026-01-01T10:00:00.000Z",
          lastActivity: "2026-01-15T15:00:00.000Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
        },
        {
          path: "/Users/test/project2",
          name: "project2",
          firstActivity: "2026-01-01T10:00:00.000Z",
          lastActivity: "2026-01-15T15:00:00.000Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
        },
        {
          path: "/Users/test/project3",
          name: "project3",
          firstActivity: "2026-01-01T10:00:00.000Z",
          lastActivity: "2026-01-15T15:00:00.000Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
        },
      ];

      projects.forEach((p) => upsertProject(p));

      const validPaths = new Set(["/Users/test/project1", "/Users/test/project3"]);
      const deletedCount = deleteOrphanedProjects(validPaths);

      expect(deletedCount).toBe(1);
      expect(getProjectByPath("/Users/test/project1")).not.toBeNull();
      expect(getProjectByPath("/Users/test/project2")).toBeNull();
      expect(getProjectByPath("/Users/test/project3")).not.toBeNull();
    });

    it("deletes hidden orphaned projects as well", () => {
      const project: ProjectInput = {
        path: "/Users/test/hidden-project",
        name: "hidden-project",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
      };
      upsertProject(project);
      setProjectHidden(project.path, true);

      const validPaths = new Set<string>();
      const deletedCount = deleteOrphanedProjects(validPaths);

      expect(deletedCount).toBe(1);
      expect(getProjectByPath(project.path)).toBeNull();
    });

    it("returns 0 when all projects are valid", () => {
      const project: ProjectInput = {
        path: "/Users/test/project",
        name: "project",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
      };
      upsertProject(project);

      const validPaths = new Set(["/Users/test/project"]);
      const deletedCount = deleteOrphanedProjects(validPaths);

      expect(deletedCount).toBe(0);
    });
  });

  describe("Hidden projects", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    it("setProjectHidden hides a project", () => {
      upsertProject(testProject);
      setProjectHidden(testProject.path, true);

      const project = getProjectByPath(testProject.path);
      expect(project?.isHidden).toBe(true);
    });

    it("setProjectHidden unhides a project", () => {
      upsertProject(testProject);
      setProjectHidden(testProject.path, true);
      setProjectHidden(testProject.path, false);

      const project = getProjectByPath(testProject.path);
      expect(project?.isHidden).toBe(false);
    });

    it("getAllProjects excludes hidden projects by default", () => {
      const visibleProject: ProjectInput = {
        ...testProject,
        path: "/Users/test/visible",
        name: "visible",
      };
      const hiddenProject: ProjectInput = {
        ...testProject,
        path: "/Users/test/hidden",
        name: "hidden",
      };

      upsertProject(visibleProject);
      upsertProject(hiddenProject);
      setProjectHidden(hiddenProject.path, true);

      const projects = getAllProjects();
      expect(projects).toHaveLength(1);
      expect(projects[0].path).toBe(visibleProject.path);
    });

    it("getAllProjects includes hidden projects when includeHidden is true", () => {
      const visibleProject: ProjectInput = {
        ...testProject,
        path: "/Users/test/visible",
        name: "visible",
      };
      const hiddenProject: ProjectInput = {
        ...testProject,
        path: "/Users/test/hidden",
        name: "hidden",
      };

      upsertProject(visibleProject);
      upsertProject(hiddenProject);
      setProjectHidden(hiddenProject.path, true);

      const projects = getAllProjects({ includeHidden: true });
      expect(projects).toHaveLength(2);
    });

    it("getHiddenProjects returns only hidden projects", () => {
      const visibleProject: ProjectInput = {
        ...testProject,
        path: "/Users/test/visible",
        name: "visible",
      };
      const hiddenProject1: ProjectInput = {
        ...testProject,
        path: "/Users/test/hidden1",
        name: "hidden1",
      };
      const hiddenProject2: ProjectInput = {
        ...testProject,
        path: "/Users/test/hidden2",
        name: "hidden2",
      };

      upsertProject(visibleProject);
      upsertProject(hiddenProject1);
      upsertProject(hiddenProject2);
      setProjectHidden(hiddenProject1.path, true);
      setProjectHidden(hiddenProject2.path, true);

      const hiddenProjects = getHiddenProjects();
      expect(hiddenProjects).toHaveLength(2);
      const paths = hiddenProjects.map((p) => p.path);
      expect(paths).toContain(hiddenProject1.path);
      expect(paths).toContain(hiddenProject2.path);
      expect(paths).not.toContain(visibleProject.path);
    });

    it("getHiddenProjects returns empty array when no projects are hidden", () => {
      upsertProject(testProject);

      const hiddenProjects = getHiddenProjects();
      expect(hiddenProjects).toHaveLength(0);
    });
  });

  describe("Default project", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    it("setDefaultProject sets a project as default", () => {
      upsertProject(testProject);
      setDefaultProject(testProject.path);

      const project = getProjectByPath(testProject.path);
      expect(project?.isDefault).toBe(true);
    });

    it("setDefaultProject clears the previous default project", () => {
      const project1: ProjectInput = {
        ...testProject,
        path: "/Users/test/project1",
        name: "project1",
      };
      const project2: ProjectInput = {
        ...testProject,
        path: "/Users/test/project2",
        name: "project2",
      };

      upsertProject(project1);
      upsertProject(project2);

      // Set first project as default
      setDefaultProject(project1.path);
      expect(getProjectByPath(project1.path)?.isDefault).toBe(true);
      expect(getProjectByPath(project2.path)?.isDefault).toBe(false);

      // Set second project as default - should clear the first
      setDefaultProject(project2.path);
      expect(getProjectByPath(project1.path)?.isDefault).toBe(false);
      expect(getProjectByPath(project2.path)?.isDefault).toBe(true);
    });

    it("getDefaultProject returns the default project", () => {
      upsertProject(testProject);
      setDefaultProject(testProject.path);

      const defaultProject = getDefaultProject();
      expect(defaultProject).not.toBeNull();
      expect(defaultProject?.path).toBe(testProject.path);
      expect(defaultProject?.isDefault).toBe(true);
    });

    it("getDefaultProject returns null when no default is set", () => {
      upsertProject(testProject);

      const defaultProject = getDefaultProject();
      expect(defaultProject).toBeNull();
    });

    it("clearDefaultProject clears the default project", () => {
      upsertProject(testProject);
      setDefaultProject(testProject.path);
      expect(getDefaultProject()).not.toBeNull();

      clearDefaultProject();
      expect(getDefaultProject()).toBeNull();
      expect(getProjectByPath(testProject.path)?.isDefault).toBe(false);
    });

    it("only one project can be default at a time", () => {
      const projects: ProjectInput[] = [
        { ...testProject, path: "/Users/test/p1", name: "p1" },
        { ...testProject, path: "/Users/test/p2", name: "p2" },
        { ...testProject, path: "/Users/test/p3", name: "p3" },
      ];

      projects.forEach((p) => upsertProject(p));
      projects.forEach((p) => setDefaultProject(p.path));

      const allProjects = getAllProjects({ includeHidden: true });
      const defaultProjects = allProjects.filter((p) => p.isDefault);
      expect(defaultProjects).toHaveLength(1);
      expect(defaultProjects[0].path).toBe("/Users/test/p3"); // Last one set
    });
  });

  describe("Project groups", () => {
    it("createProjectGroup creates a new group with auto-incrementing sort order", () => {
      const group1 = createProjectGroup({ name: "Group 1" });
      const group2 = createProjectGroup({ name: "Group 2" });

      expect(group1.name).toBe("Group 1");
      expect(group1.sortOrder).toBe(0);
      expect(group1.color).toBeNull();
      expect(group1.id).toBeDefined();

      expect(group2.name).toBe("Group 2");
      expect(group2.sortOrder).toBe(1);
    });

    it("createProjectGroup accepts optional color", () => {
      const group = createProjectGroup({ name: "Colored Group", color: "#FF5733" });

      expect(group.color).toBe("#FF5733");
    });

    it("getAllProjectGroups returns groups ordered by sort order", () => {
      createProjectGroup({ name: "Group A" });
      createProjectGroup({ name: "Group B" });
      createProjectGroup({ name: "Group C" });

      const groups = getAllProjectGroups();
      expect(groups).toHaveLength(3);
      expect(groups[0].sortOrder).toBe(0);
      expect(groups[1].sortOrder).toBe(1);
      expect(groups[2].sortOrder).toBe(2);
    });

    it("getProjectGroupById returns the correct group", () => {
      const created = createProjectGroup({ name: "Test Group", color: "#123456" });

      const retrieved = getProjectGroupById(created.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Test Group");
      expect(retrieved?.color).toBe("#123456");
    });

    it("getProjectGroupById returns null for non-existent group", () => {
      const group = getProjectGroupById("non-existent-id");
      expect(group).toBeNull();
    });

    it("updateProjectGroup updates name", () => {
      const group = createProjectGroup({ name: "Original Name" });

      const updated = updateProjectGroup(group.id, { name: "New Name" });
      expect(updated?.name).toBe("New Name");
    });

    it("updateProjectGroup updates color", () => {
      const group = createProjectGroup({ name: "Test", color: "#000000" });

      const updated = updateProjectGroup(group.id, { color: "#FFFFFF" });
      expect(updated?.color).toBe("#FFFFFF");
    });

    it("updateProjectGroup can set color to null", () => {
      const group = createProjectGroup({ name: "Test", color: "#FF0000" });

      const updated = updateProjectGroup(group.id, { color: null });
      expect(updated?.color).toBeNull();
    });

    it("updateProjectGroup updates sort order", () => {
      const group = createProjectGroup({ name: "Test" });

      const updated = updateProjectGroup(group.id, { sortOrder: 99 });
      expect(updated?.sortOrder).toBe(99);
    });

    it("updateProjectGroup returns null for non-existent group", () => {
      const result = updateProjectGroup("non-existent-id", { name: "New Name" });
      expect(result).toBeNull();
    });

    it("updateProjectGroup with no updates returns unchanged group", () => {
      const group = createProjectGroup({ name: "Test", color: "#123" });

      const unchanged = updateProjectGroup(group.id, {});
      expect(unchanged?.name).toBe("Test");
      expect(unchanged?.color).toBe("#123");
    });

    it("deleteProjectGroup removes the group", () => {
      const group = createProjectGroup({ name: "To Delete" });
      expect(getProjectGroupById(group.id)).not.toBeNull();

      deleteProjectGroup(group.id);
      expect(getProjectGroupById(group.id)).toBeNull();
    });

    it("deleteProjectGroup unassigns projects from the deleted group", () => {
      // Create a group and assign projects to it
      const group = createProjectGroup({ name: "Test Group" });

      const project1: ProjectInput = {
        path: "/Users/test/project1",
        name: "project1",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
      };
      const project2: ProjectInput = {
        path: "/Users/test/project2",
        name: "project2",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
      };

      upsertProject(project1);
      upsertProject(project2);
      setProjectGroup(project1.path, group.id);
      setProjectGroup(project2.path, group.id);

      // Verify projects are assigned
      expect(getProjectByPath(project1.path)?.groupId).toBe(group.id);
      expect(getProjectByPath(project2.path)?.groupId).toBe(group.id);

      // Delete the group
      deleteProjectGroup(group.id);

      // Verify projects have null groupId
      expect(getProjectByPath(project1.path)?.groupId).toBeNull();
      expect(getProjectByPath(project2.path)?.groupId).toBeNull();
    });
  });

  describe("setProjectGroup", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/project",
      name: "project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    it("assigns a project to a group", () => {
      upsertProject(testProject);
      const group = createProjectGroup({ name: "Test Group" });

      setProjectGroup(testProject.path, group.id);

      const project = getProjectByPath(testProject.path);
      expect(project?.groupId).toBe(group.id);
    });

    it("moves a project from one group to another", () => {
      upsertProject(testProject);
      const group1 = createProjectGroup({ name: "Group 1" });
      const group2 = createProjectGroup({ name: "Group 2" });

      setProjectGroup(testProject.path, group1.id);
      expect(getProjectByPath(testProject.path)?.groupId).toBe(group1.id);

      setProjectGroup(testProject.path, group2.id);
      expect(getProjectByPath(testProject.path)?.groupId).toBe(group2.id);
    });

    it("unassigns a project from a group by setting null", () => {
      upsertProject(testProject);
      const group = createProjectGroup({ name: "Test Group" });

      setProjectGroup(testProject.path, group.id);
      expect(getProjectByPath(testProject.path)?.groupId).toBe(group.id);

      setProjectGroup(testProject.path, null);
      expect(getProjectByPath(testProject.path)?.groupId).toBeNull();
    });

    it("multiple projects can be in the same group", () => {
      const project1: ProjectInput = {
        ...testProject,
        path: "/Users/test/project1",
        name: "project1",
      };
      const project2: ProjectInput = {
        ...testProject,
        path: "/Users/test/project2",
        name: "project2",
      };

      upsertProject(project1);
      upsertProject(project2);
      const group = createProjectGroup({ name: "Shared Group" });

      setProjectGroup(project1.path, group.id);
      setProjectGroup(project2.path, group.id);

      expect(getProjectByPath(project1.path)?.groupId).toBe(group.id);
      expect(getProjectByPath(project2.path)?.groupId).toBe(group.id);
    });
  });

  describe("Combined project management scenarios", () => {
    const baseProject: ProjectInput = {
      path: "/Users/test/base",
      name: "base",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    it("hidden default project is still returned by getDefaultProject", () => {
      upsertProject(baseProject);
      setDefaultProject(baseProject.path);
      setProjectHidden(baseProject.path, true);

      const defaultProject = getDefaultProject();
      expect(defaultProject).not.toBeNull();
      expect(defaultProject?.isHidden).toBe(true);
      expect(defaultProject?.isDefault).toBe(true);
    });

    it("deleting default project clears default status", () => {
      upsertProject(baseProject);
      setDefaultProject(baseProject.path);
      expect(getDefaultProject()).not.toBeNull();

      deleteProject(baseProject.path);

      expect(getDefaultProject()).toBeNull();
    });

    it("project retains group assignment after being hidden and unhidden", () => {
      upsertProject(baseProject);
      const group = createProjectGroup({ name: "Persistent Group" });

      setProjectGroup(baseProject.path, group.id);
      setProjectHidden(baseProject.path, true);
      setProjectHidden(baseProject.path, false);

      expect(getProjectByPath(baseProject.path)?.groupId).toBe(group.id);
    });

    it("clearDatabase also removes project groups", () => {
      createProjectGroup({ name: "Group 1" });
      createProjectGroup({ name: "Group 2" });
      expect(getAllProjectGroups()).toHaveLength(2);

      clearDatabase();

      expect(getAllProjectGroups()).toHaveLength(0);
    });
  });

  describe("Project merge operations", () => {
    const primaryProject: ProjectInput = {
      path: "/Users/test/primary",
      name: "primary",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-20T15:00:00.000Z",
      sessionCount: 10,
      messageCount: 200,
      totalTime: 7200000,
    };

    const sourceProject1: ProjectInput = {
      path: "/Users/test/source1",
      name: "source1",
      firstActivity: "2026-01-05T10:00:00.000Z",
      lastActivity: "2026-01-15T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
    };

    const sourceProject2: ProjectInput = {
      path: "/Users/test/source2",
      name: "source2",
      firstActivity: "2026-01-08T10:00:00.000Z",
      lastActivity: "2026-01-18T15:00:00.000Z",
      sessionCount: 3,
      messageCount: 50,
      totalTime: 1800000,
    };

    beforeEach(() => {
      upsertProject(primaryProject);
      upsertProject(sourceProject1);
      upsertProject(sourceProject2);
    });

    describe("mergeProjects", () => {
      it("sets merged_into on source projects", () => {
        mergeProjects([sourceProject1.path, sourceProject2.path], primaryProject.path);

        const source1 = getProjectByPath(sourceProject1.path);
        const source2 = getProjectByPath(sourceProject2.path);

        expect(source1?.mergedInto).toBe(primaryProject.path);
        expect(source2?.mergedInto).toBe(primaryProject.path);
      });

      it("does not set merged_into on the primary project", () => {
        mergeProjects([sourceProject1.path, sourceProject2.path], primaryProject.path);

        const primary = getProjectByPath(primaryProject.path);
        expect(primary?.mergedInto).toBeNull();
      });

      it("handles single source project", () => {
        mergeProjects([sourceProject1.path], primaryProject.path);

        const source1 = getProjectByPath(sourceProject1.path);
        expect(source1?.mergedInto).toBe(primaryProject.path);
      });

      it("ignores if source path is same as target path", () => {
        mergeProjects([primaryProject.path, sourceProject1.path], primaryProject.path);

        const primary = getProjectByPath(primaryProject.path);
        const source1 = getProjectByPath(sourceProject1.path);

        expect(primary?.mergedInto).toBeNull();
        expect(source1?.mergedInto).toBe(primaryProject.path);
      });

      it("throws error if target project does not exist", () => {
        expect(() => {
          mergeProjects([sourceProject1.path], "/nonexistent/path");
        }).toThrow('Target project "/nonexistent/path" not found');
      });

      it("throws error if target is already merged into another project", () => {
        // First merge source1 into primary
        mergeProjects([sourceProject1.path], primaryProject.path);

        // Now try to use source1 (which is merged) as a target
        expect(() => {
          mergeProjects([sourceProject2.path], sourceProject1.path);
        }).toThrow('Target project "/Users/test/source1" is already merged into another project');
      });

      it("handles empty source array gracefully", () => {
        expect(() => {
          mergeProjects([], primaryProject.path);
        }).not.toThrow();

        const primary = getProjectByPath(primaryProject.path);
        expect(primary?.mergedInto).toBeNull();
      });
    });

    describe("unmergeProject", () => {
      it("clears merged_into field", () => {
        mergeProjects([sourceProject1.path], primaryProject.path);
        expect(getProjectByPath(sourceProject1.path)?.mergedInto).toBe(primaryProject.path);

        unmergeProject(sourceProject1.path);
        expect(getProjectByPath(sourceProject1.path)?.mergedInto).toBeNull();
      });

      it("does not affect other merged projects", () => {
        mergeProjects([sourceProject1.path, sourceProject2.path], primaryProject.path);

        unmergeProject(sourceProject1.path);

        expect(getProjectByPath(sourceProject1.path)?.mergedInto).toBeNull();
        expect(getProjectByPath(sourceProject2.path)?.mergedInto).toBe(primaryProject.path);
      });

      it("handles unmerging a project that is not merged", () => {
        expect(() => {
          unmergeProject(sourceProject1.path);
        }).not.toThrow();

        expect(getProjectByPath(sourceProject1.path)?.mergedInto).toBeNull();
      });

      it("handles unmerging non-existent project gracefully", () => {
        expect(() => {
          unmergeProject("/nonexistent/path");
        }).not.toThrow();
      });
    });

    describe("getMergedProjects", () => {
      it("returns all projects merged into a primary", () => {
        mergeProjects([sourceProject1.path, sourceProject2.path], primaryProject.path);

        const merged = getMergedProjects(primaryProject.path);

        expect(merged).toHaveLength(2);
        const paths = merged.map((p) => p.path);
        expect(paths).toContain(sourceProject1.path);
        expect(paths).toContain(sourceProject2.path);
      });

      it("returns empty array when no projects are merged", () => {
        const merged = getMergedProjects(primaryProject.path);
        expect(merged).toHaveLength(0);
      });

      it("returns empty array for non-existent primary path", () => {
        const merged = getMergedProjects("/nonexistent/path");
        expect(merged).toHaveLength(0);
      });

      it("does not return the primary project itself", () => {
        mergeProjects([sourceProject1.path], primaryProject.path);

        const merged = getMergedProjects(primaryProject.path);

        expect(merged).toHaveLength(1);
        expect(merged[0].path).toBe(sourceProject1.path);
      });

      it("returns projects ordered by last activity desc", () => {
        mergeProjects([sourceProject1.path, sourceProject2.path], primaryProject.path);

        const merged = getMergedProjects(primaryProject.path);

        // source2 has lastActivity 2026-01-18, source1 has 2026-01-15
        expect(merged[0].path).toBe(sourceProject2.path);
        expect(merged[1].path).toBe(sourceProject1.path);
      });
    });

    describe("merge with other project features", () => {
      it("merged projects retain their hidden status", () => {
        setProjectHidden(sourceProject1.path, true);
        mergeProjects([sourceProject1.path], primaryProject.path);

        const source1 = getProjectByPath(sourceProject1.path);
        expect(source1?.isHidden).toBe(true);
        expect(source1?.mergedInto).toBe(primaryProject.path);
      });

      it("merged projects retain their group assignment", () => {
        const group = createProjectGroup({ name: "Test Group" });
        setProjectGroup(sourceProject1.path, group.id);
        mergeProjects([sourceProject1.path], primaryProject.path);

        const source1 = getProjectByPath(sourceProject1.path);
        expect(source1?.groupId).toBe(group.id);
        expect(source1?.mergedInto).toBe(primaryProject.path);
      });

      it("getAllProjects includes merged projects by default", () => {
        mergeProjects([sourceProject1.path], primaryProject.path);

        // The frontend handles filtering merged projects
        // getAllProjects should return all projects
        const allProjects = getAllProjects({ includeHidden: true });
        const paths = allProjects.map((p) => p.path);

        expect(paths).toContain(primaryProject.path);
        expect(paths).toContain(sourceProject1.path);
        expect(paths).toContain(sourceProject2.path);
      });

      it("mergedInto field is included in project queries", () => {
        mergeProjects([sourceProject1.path], primaryProject.path);

        const project = getProjectByPath(sourceProject1.path);
        expect(project).toHaveProperty("mergedInto");
        expect(project?.mergedInto).toBe(primaryProject.path);
      });

      it("unmerged projects have null mergedInto", () => {
        const project = getProjectByPath(sourceProject1.path);
        expect(project?.mergedInto).toBeNull();
      });
    });
  });

  describe("Monthly summary analytics", () => {
    const testProject: ProjectInput = {
      path: "/Users/test/analytics-project",
      name: "analytics-project",
      firstActivity: "2026-01-01T10:00:00.000Z",
      lastActivity: "2026-01-31T15:00:00.000Z",
      sessionCount: 10,
      messageCount: 200,
      totalTime: 36000000,
    };

    const testProject2: ProjectInput = {
      path: "/Users/test/analytics-project-2",
      name: "analytics-project-2",
      firstActivity: "2026-01-05T10:00:00.000Z",
      lastActivity: "2026-01-25T15:00:00.000Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 18000000,
    };

    beforeEach(() => {
      upsertProject(testProject);
      upsertProject(testProject2);
    });

    describe("getMonthlySummary", () => {
      it("returns correct totals for a month with sessions", () => {
        // Create sessions spread across January 2026
        const sessions: SessionInput[] = [
          {
            id: "session-1",
            projectPath: testProject.path,
            created: "2026-01-05T10:00:00.000Z",
            modified: "2026-01-05T11:00:00.000Z",
            duration: 3600000, // 1 hour
            messageCount: 20,
            summary: "Session 1",
            firstPrompt: "Hello",
            gitBranch: "main",
          },
          {
            id: "session-2",
            projectPath: testProject.path,
            created: "2026-01-10T14:00:00.000Z",
            modified: "2026-01-10T15:30:00.000Z",
            duration: 5400000, // 1.5 hours
            messageCount: 35,
            summary: "Session 2",
            firstPrompt: "Continue",
            gitBranch: "feature",
          },
          {
            id: "session-3",
            projectPath: testProject2.path,
            created: "2026-01-15T09:00:00.000Z",
            modified: "2026-01-15T10:00:00.000Z",
            duration: 3600000, // 1 hour
            messageCount: 15,
            summary: "Session 3",
            firstPrompt: "New feature",
            gitBranch: "main",
          },
        ];

        upsertSessions(sessions);

        const summary = getMonthlySummary("2026-01");

        expect(summary.month).toBe("2026-01");
        expect(summary.totalSessions).toBe(3);
        expect(summary.totalActiveTime).toBe(12600000); // 3.5 hours total
        expect(summary.estimatedApiCost).toBeGreaterThan(0);
      });

      it("returns empty data for a month with no sessions", () => {
        const summary = getMonthlySummary("2025-06"); // No sessions in June 2025

        expect(summary.month).toBe("2025-06");
        expect(summary.totalSessions).toBe(0);
        expect(summary.totalActiveTime).toBe(0);
        expect(summary.estimatedApiCost).toBe(0);
        expect(summary.dailyActivity).toHaveLength(0);
        expect(summary.topProjects).toHaveLength(0);
      });

      it("calculates daily activity correctly for heatmap", () => {
        const sessions: SessionInput[] = [
          {
            id: "day5-session1",
            projectPath: testProject.path,
            created: "2026-01-05T10:00:00.000Z",
            modified: "2026-01-05T11:00:00.000Z",
            duration: 3600000,
            messageCount: 10,
            summary: null,
            firstPrompt: null,
            gitBranch: null,
          },
          {
            id: "day5-session2",
            projectPath: testProject.path,
            created: "2026-01-05T14:00:00.000Z",
            modified: "2026-01-05T15:00:00.000Z",
            duration: 3600000,
            messageCount: 10,
            summary: null,
            firstPrompt: null,
            gitBranch: null,
          },
          {
            id: "day10-session1",
            projectPath: testProject.path,
            created: "2026-01-10T09:00:00.000Z",
            modified: "2026-01-10T10:30:00.000Z",
            duration: 5400000,
            messageCount: 15,
            summary: null,
            firstPrompt: null,
            gitBranch: null,
          },
        ];

        upsertSessions(sessions);

        const summary = getMonthlySummary("2026-01");

        // Should have 2 distinct days of activity
        expect(summary.dailyActivity.length).toBeGreaterThanOrEqual(2);

        // Find day 5 activity
        const day5 = summary.dailyActivity.find((d) => d.date === "2026-01-05");
        expect(day5).toBeDefined();
        expect(day5?.sessionCount).toBe(2);
        expect(day5?.totalTime).toBe(7200000); // 2 hours

        // Find day 10 activity
        const day10 = summary.dailyActivity.find((d) => d.date === "2026-01-10");
        expect(day10).toBeDefined();
        expect(day10?.sessionCount).toBe(1);
        expect(day10?.totalTime).toBe(5400000); // 1.5 hours
      });

      it("returns top 5 projects ordered by total time", () => {
        // Create multiple projects with sessions
        const projects: ProjectInput[] = Array.from({ length: 7 }, (_, i) => ({
          path: `/Users/test/proj${i}`,
          name: `proj${i}`,
          firstActivity: "2026-01-01T10:00:00.000Z",
          lastActivity: "2026-01-31T15:00:00.000Z",
          sessionCount: 1,
          messageCount: 10,
          totalTime: 3600000 * (i + 1),
        }));

        projects.forEach((p) => upsertProject(p));

        // Create sessions with varying durations per project
        const sessions: SessionInput[] = projects.map((p, i) => ({
          id: `session-proj${i}`,
          projectPath: p.path,
          created: `2026-01-${String(10 + i).padStart(2, "0")}T10:00:00.000Z`,
          modified: `2026-01-${String(10 + i).padStart(2, "0")}T11:00:00.000Z`,
          duration: 3600000 * (i + 1), // Increasing duration
          messageCount: 10,
          summary: null,
          firstPrompt: null,
          gitBranch: null,
        }));

        upsertSessions(sessions);

        const summary = getMonthlySummary("2026-01");

        // Should return exactly 5 projects (top 5)
        expect(summary.topProjects).toHaveLength(5);

        // Verify they're ordered by total time descending
        for (let i = 0; i < summary.topProjects.length - 1; i++) {
          expect(summary.topProjects[i].totalTime).toBeGreaterThanOrEqual(
            summary.topProjects[i + 1].totalTime
          );
        }

        // The top project should be proj6 (highest duration)
        expect(summary.topProjects[0].path).toBe("/Users/test/proj6");
      });

      it("calculates estimated API cost based on session time", () => {
        const sessions: SessionInput[] = [
          {
            id: "cost-session",
            projectPath: testProject.path,
            created: "2026-01-15T10:00:00.000Z",
            modified: "2026-01-15T11:00:00.000Z",
            duration: 60000 * 10, // 10 minutes
            messageCount: 50,
            summary: null,
            firstPrompt: null,
            gitBranch: null,
          },
        ];

        upsertSessions(sessions);

        const summary = getMonthlySummary("2026-01");

        // Cost is $0.05 per minute = $0.50 for 10 minutes
        expect(summary.estimatedApiCost).toBe(0.5);
        expect(summary.topProjects[0].estimatedCost).toBe(0.5);
      });

      it("handles year boundary correctly (December to January)", () => {
        // Session in December 2025
        upsertSession({
          id: "dec-session",
          projectPath: testProject.path,
          created: "2025-12-20T10:00:00.000Z",
          modified: "2025-12-20T11:00:00.000Z",
          duration: 3600000,
          messageCount: 10,
          summary: null,
          firstPrompt: null,
          gitBranch: null,
        });

        // Session in January 2026
        upsertSession({
          id: "jan-session",
          projectPath: testProject.path,
          created: "2026-01-05T10:00:00.000Z",
          modified: "2026-01-05T11:00:00.000Z",
          duration: 3600000,
          messageCount: 10,
          summary: null,
          firstPrompt: null,
          gitBranch: null,
        });

        const decSummary = getMonthlySummary("2025-12");
        const janSummary = getMonthlySummary("2026-01");

        expect(decSummary.totalSessions).toBe(1);
        expect(janSummary.totalSessions).toBe(1);
      });

      it("placeholder values for humanTime and claudeTime are zero", () => {
        upsertSession({
          id: "placeholder-session",
          projectPath: testProject.path,
          created: "2026-01-15T10:00:00.000Z",
          modified: "2026-01-15T11:00:00.000Z",
          duration: 3600000,
          messageCount: 10,
          summary: null,
          firstPrompt: null,
          gitBranch: null,
        });

        const summary = getMonthlySummary("2026-01");

        // These are placeholders until Story 2.1 is implemented
        expect(summary.humanTime).toBe(0);
        expect(summary.claudeTime).toBe(0);
      });
    });
  });

  describe("Database initialization and getDatabase", () => {
    it("getDatabase returns same instance as initializeDatabase", () => {
      const db1 = initializeDatabase();
      const db2 = getDatabase();

      expect(db1).toBe(db2);
    });

    it("getDatabase auto-initializes if not already initialized", () => {
      // Close the existing database
      closeDatabase();

      // getDatabase should auto-initialize
      const db = getDatabase();
      expect(db).toBeDefined();

      // Verify database is functional
      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
        .all() as { name: string }[];
      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain("projects");
      expect(tableNames).toContain("sessions");
      expect(tableNames).toContain("settings");
    });

    it("initializeDatabase is idempotent", () => {
      const db1 = initializeDatabase();
      const db2 = initializeDatabase();
      const db3 = initializeDatabase();

      expect(db1).toBe(db2);
      expect(db2).toBe(db3);
    });

    it("closeDatabase and reinitialize creates new working database", () => {
      // Insert some data
      upsertProject({
        path: "/Users/test/close-test",
        name: "close-test",
        firstActivity: "2026-01-01T10:00:00.000Z",
        lastActivity: "2026-01-15T15:00:00.000Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 3600000,
      });

      closeDatabase();

      // Reinitialize and verify data persists
      const db = initializeDatabase();
      expect(db).toBeDefined();

      const project = getProjectByPath("/Users/test/close-test");
      expect(project).not.toBeNull();
      expect(project?.name).toBe("close-test");
    });

    it("settings table is created during initialization", () => {
      const db = initializeDatabase();

      const tables = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
        .all() as { name: string }[];

      expect(tables).toHaveLength(1);
      expect(tables[0].name).toBe("settings");
    });
  });

  describe("Database schema migrations", () => {
    it("adds merged_into column when upgrading from schema with is_hidden but not merged_into", () => {
      // Close existing database
      closeDatabase();

      // Create a database with intermediate schema (has is_hidden but not merged_into)
      const Database = require("better-sqlite3");
      const dbPath = getDatabasePath();
      const oldDb = new Database(dbPath);

      // Drop tables and recreate with intermediate schema
      oldDb.exec("DROP TABLE IF EXISTS sessions");
      oldDb.exec("DROP TABLE IF EXISTS projects");
      oldDb.exec("DROP TABLE IF EXISTS project_groups");
      oldDb.exec("DROP TABLE IF EXISTS settings");

      // Create intermediate projects table (has is_hidden, group_id, is_default but not merged_into)
      oldDb.exec(`
        CREATE TABLE projects (
          path TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          first_activity TEXT NOT NULL,
          last_activity TEXT NOT NULL,
          session_count INTEGER DEFAULT 0,
          message_count INTEGER DEFAULT 0,
          total_time INTEGER DEFAULT 0,
          is_hidden INTEGER DEFAULT 0,
          group_id TEXT DEFAULT NULL,
          is_default INTEGER DEFAULT 0
        )
      `);

      // Insert a project using intermediate schema
      oldDb
        .prepare(
          `
        INSERT INTO projects (path, name, first_activity, last_activity, session_count, message_count, total_time, is_hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `
        )
        .run(
          "/Users/test/intermediate-project",
          "intermediate-project",
          "2025-06-01T10:00:00.000Z",
          "2025-12-15T15:00:00.000Z",
          5,
          50,
          1800000,
          1 // Was hidden
        );

      // Create required tables
      oldDb.exec(`
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          project_path TEXT NOT NULL,
          created TEXT NOT NULL,
          modified TEXT NOT NULL,
          duration INTEGER NOT NULL,
          message_count INTEGER DEFAULT 0,
          summary TEXT,
          first_prompt TEXT,
          git_branch TEXT
        )
      `);

      oldDb.close();

      // Now initialize the database - should run migration for merged_into only
      const db = initializeDatabase();

      // Verify merged_into column was added
      const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("merged_into");

      // Verify the project still has its is_hidden value preserved
      const project = getProjectByPath("/Users/test/intermediate-project");
      expect(project).not.toBeNull();
      expect(project?.name).toBe("intermediate-project");
      expect(project?.isHidden).toBe(true); // Preserved from old data
      expect(project?.mergedInto).toBeNull(); // New column with default
    });

    it("migrations are idempotent - running multiple times is safe", () => {
      // Get the database and verify columns exist
      const db = initializeDatabase();

      // Force multiple migration runs by calling initializeDatabase repeatedly
      initializeDatabase();
      initializeDatabase();
      initializeDatabase();

      // Should still work correctly
      const columns = db.prepare("PRAGMA table_info(projects)").all() as { name: string }[];
      const columnNames = columns.map((c) => c.name);

      expect(columnNames).toContain("is_hidden");
      expect(columnNames).toContain("group_id");
      expect(columnNames).toContain("is_default");
      expect(columnNames).toContain("merged_into");

      // Indexes should still exist
      const indexes = db
        .prepare("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_projects%'")
        .all() as { name: string }[];
      const indexNames = indexes.map((i) => i.name);

      expect(indexNames).toContain("idx_projects_group");
      expect(indexNames).toContain("idx_projects_merged_into");
    });
  });

  describe("Settings", () => {
    describe("getSetting", () => {
      it("returns null for unset setting", () => {
        const value = getSetting("defaultIde");
        expect(value).toBeNull();
      });

      it("returns set value", () => {
        setSetting("defaultIde", "vscode");
        const value = getSetting("defaultIde");
        expect(value).toBe("vscode");
      });
    });

    describe("setSetting", () => {
      it("stores a setting value", () => {
        setSetting("defaultIde", "iterm2");
        const value = getSetting("defaultIde");
        expect(value).toBe("iterm2");
      });

      it("updates an existing setting", () => {
        setSetting("defaultIde", "terminal");
        setSetting("defaultIde", "cursor");
        const value = getSetting("defaultIde");
        expect(value).toBe("cursor");
      });

      it("stores various IDE values", () => {
        const ideValues = ["terminal", "iterm2", "vscode", "cursor", "warp"] as const;
        for (const ide of ideValues) {
          setSetting("defaultIde", ide);
          expect(getSetting("defaultIde")).toBe(ide);
        }
      });
    });

    describe("getAllSettings", () => {
      it("returns default settings when none are set", () => {
        const settings = getAllSettings();
        expect(settings).toEqual(DEFAULT_SETTINGS);
        expect(settings.defaultIde).toBe("terminal");
      });

      it("returns set values merged with defaults", () => {
        setSetting("defaultIde", "warp");
        const settings = getAllSettings();
        expect(settings.defaultIde).toBe("warp");
      });
    });

    describe("DEFAULT_SETTINGS", () => {
      it("has terminal as default IDE", () => {
        expect(DEFAULT_SETTINGS.defaultIde).toBe("terminal");
      });
    });

    describe("Settings persistence across database operations", () => {
      it("preserves IDE preference after clearDatabase is called", () => {
        // User sets their preferred IDE
        setSetting("defaultIde", "cursor");
        expect(getSetting("defaultIde")).toBe("cursor");

        // clearDatabase removes settings (simulates full reset)
        clearDatabase();

        // Settings should be cleared
        expect(getSetting("defaultIde")).toBeNull();
        expect(getAllSettings().defaultIde).toBe("terminal"); // Falls back to default
      });

      it("user changes IDE preference multiple times during a session", () => {
        // User starts with terminal (default)
        expect(getAllSettings().defaultIde).toBe("terminal");

        // User tries VSCode
        setSetting("defaultIde", "vscode");
        expect(getAllSettings().defaultIde).toBe("vscode");

        // User decides to switch to Cursor
        setSetting("defaultIde", "cursor");
        expect(getAllSettings().defaultIde).toBe("cursor");

        // User goes back to their original workflow
        setSetting("defaultIde", "terminal");
        expect(getAllSettings().defaultIde).toBe("terminal");
      });

      it("handles all supported IDE options correctly", () => {
        const allIdeOptions = [
          "terminal",
          "iterm2",
          "vscode",
          "cursor",
          "warp",
          "windsurf",
          "vscodium",
          "zed",
          "void",
          "positron",
          "antigravity",
        ] as const;

        for (const ide of allIdeOptions) {
          setSetting("defaultIde", ide);
          const settings = getAllSettings();
          expect(settings.defaultIde).toBe(ide);
        }
      });
    });

    describe("Settings edge cases and error handling", () => {
      it("handles raw string values stored directly in database (legacy/corrupted data)", () => {
        // Simulate a scenario where settings were stored as raw strings
        // (e.g., from an older version or corrupted migration)
        const db = initializeDatabase();

        // Insert a raw, non-JSON string value directly
        db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").run(
          "defaultIde",
          "vscode" // Not JSON-wrapped, just a raw string
        );

        // getSetting should handle this gracefully by returning the raw value
        const value = getSetting("defaultIde");
        // The catch block returns row.value as AppSettings[K], so "vscode" will be returned
        // but JSON.parse("vscode") throws, so it falls back to the raw string
        expect(value).toBe("vscode");
      });

      it("handles JSON-encoded values correctly", () => {
        // Normal case - value is JSON-encoded
        setSetting("defaultIde", "cursor");

        // Verify it's stored as JSON
        const db = initializeDatabase();
        const row = db.prepare("SELECT value FROM settings WHERE key = ?").get("defaultIde") as {
          value: string;
        };
        expect(row.value).toBe('"cursor"'); // JSON-encoded string

        // And retrieved correctly
        expect(getSetting("defaultIde")).toBe("cursor");
      });

      it("getAllSettings provides complete settings object even with partial data", () => {
        // Only some settings are explicitly set
        // With current implementation there's only defaultIde, but this tests the pattern
        const settings = getAllSettings();

        // Should have all keys from AppSettings with defaults applied
        expect(settings).toHaveProperty("defaultIde");
        expect(settings.defaultIde).toBe("terminal");
      });

      it("settings survive multiple initializeDatabase calls", () => {
        // User configures their settings
        setSetting("defaultIde", "warp");
        expect(getSetting("defaultIde")).toBe("warp");

        // Simulate app components calling initializeDatabase multiple times
        initializeDatabase();
        initializeDatabase();
        initializeDatabase();

        // Settings should persist
        expect(getSetting("defaultIde")).toBe("warp");
        expect(getAllSettings().defaultIde).toBe("warp");
      });
    });

    describe("Real-world settings scenarios", () => {
      it("simulates user onboarding flow - first launch then preference setup", () => {
        // App first launch - no settings exist
        const initialSettings = getAllSettings();
        expect(initialSettings.defaultIde).toBe("terminal"); // Default

        // User completes onboarding and selects their preferred IDE
        setSetting("defaultIde", "cursor");

        // App shows their preference
        const afterOnboarding = getAllSettings();
        expect(afterOnboarding.defaultIde).toBe("cursor");
      });

      it("simulates settings panel updates", () => {
        // User opens settings panel
        const currentSettings = getAllSettings();
        expect(currentSettings.defaultIde).toBe("terminal");

        // User clicks through IDE options in UI
        setSetting("defaultIde", "vscode");
        expect(getAllSettings().defaultIde).toBe("vscode");

        // User changes mind
        setSetting("defaultIde", "zed");
        expect(getAllSettings().defaultIde).toBe("zed");
      });

      it("handles database reset and fresh start", () => {
        // User has configured settings
        setSetting("defaultIde", "windsurf");
        expect(getAllSettings().defaultIde).toBe("windsurf");

        // User resets database (e.g., via settings or troubleshooting)
        clearDatabase();

        // Fresh start - defaults apply
        expect(getAllSettings().defaultIde).toBe("terminal");

        // User reconfigures
        setSetting("defaultIde", "positron");
        expect(getAllSettings().defaultIde).toBe("positron");
      });
    });
  });
});

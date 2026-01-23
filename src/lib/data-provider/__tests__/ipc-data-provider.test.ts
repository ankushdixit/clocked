/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { createIpcDataProvider, ipcDataProvider } from "../ipc-data-provider";
import type { Project, Session } from "../../../../types/electron";

// Mock projects data
const mockProjects: Project[] = [
  {
    path: "/Users/test/project1",
    name: "project1",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
  {
    path: "/Users/test/project2",
    name: "project2",
    firstActivity: "2024-01-05T10:00:00Z",
    lastActivity: "2024-01-20T15:30:00Z",
    sessionCount: 10,
    messageCount: 200,
    totalTime: 7200000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
];

// Mock sessions data
const mockSessions: Session[] = [
  {
    id: "session1",
    projectPath: "/Users/test/project1",
    created: "2024-01-10T10:00:00Z",
    modified: "2024-01-10T11:00:00Z",
    duration: 3600000,
    messageCount: 10,
    summary: "Test session 1",
    firstPrompt: "Hello",
    gitBranch: "main",
  },
  {
    id: "session2",
    projectPath: "/Users/test/project1",
    created: "2024-01-11T10:00:00Z",
    modified: "2024-01-11T12:00:00Z",
    duration: 7200000,
    messageCount: 20,
    summary: "Test session 2",
    firstPrompt: "Hi there",
    gitBranch: "feature",
  },
  {
    id: "session3",
    projectPath: "/Users/test/project2",
    created: "2024-01-15T10:00:00Z",
    modified: "2024-01-15T14:00:00Z",
    duration: 14400000,
    messageCount: 30,
    summary: "Test session 3",
    firstPrompt: "Hey",
    gitBranch: "main",
  },
];

describe("ipc-data-provider", () => {
  beforeEach(() => {
    // Reset window.electron mock
    delete (window as { electron?: unknown }).electron;
  });

  describe("when not in Electron environment", () => {
    it("getList returns empty array for projects", async () => {
      const result = await ipcDataProvider.getList({ resource: "projects" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("getList returns empty array for sessions", async () => {
      const result = await ipcDataProvider.getList({ resource: "sessions" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("getOne returns null for projects", async () => {
      await expect(
        ipcDataProvider.getOne({ resource: "projects", id: "/test/path", meta: {} })
      ).rejects.toThrow('Project with path "/test/path" not found');
    });

    it("getMany returns empty array for projects", async () => {
      const result = await ipcDataProvider.getMany!({
        resource: "projects",
        ids: ["/test/path"],
        meta: {},
      });
      expect(result.data).toEqual([]);
    });

    it("getApiUrl returns ipc://electron", () => {
      expect(ipcDataProvider.getApiUrl()).toBe("ipc://electron");
    });
  });

  describe("when in Electron environment", () => {
    beforeEach(() => {
      // Mock window.electron
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest
            .fn()
            .mockImplementation((path) =>
              Promise.resolve({ project: mockProjects.find((p) => p.path === path) || null })
            ),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
          getByProject: jest.fn().mockImplementation((projectPath, limit, offset) => {
            const filtered = mockSessions.filter((s) => s.projectPath === projectPath);
            const paginated = filtered.slice(
              offset || 0,
              limit ? (offset || 0) + limit : undefined
            );
            return Promise.resolve({ sessions: paginated, total: filtered.length });
          }),
          getByDateRange: jest.fn().mockImplementation((startDate, endDate) => {
            const filtered = mockSessions.filter(
              (s) => s.created >= startDate && s.created <= endDate
            );
            return Promise.resolve({ sessions: filtered });
          }),
        },
      };
    });

    describe("getList", () => {
      it("returns all projects with pagination", async () => {
        const result = await ipcDataProvider.getList({
          resource: "projects",
          pagination: { currentPage: 1, pageSize: 10 },
        });
        expect(result.data).toEqual(mockProjects);
        expect(result.total).toBe(2);
      });

      it("paginates projects correctly", async () => {
        const result = await ipcDataProvider.getList({
          resource: "projects",
          pagination: { currentPage: 1, pageSize: 1 },
        });
        expect(result.data).toHaveLength(1);
        expect(result.total).toBe(2);
      });

      it("returns all sessions", async () => {
        const result = await ipcDataProvider.getList({
          resource: "sessions",
        });
        expect(result.data).toEqual(mockSessions);
        expect(result.total).toBe(3);
      });

      it("filters sessions by project path", async () => {
        const result = await ipcDataProvider.getList({
          resource: "sessions",
          filters: [{ field: "projectPath", operator: "eq", value: "/Users/test/project1" }],
          pagination: { currentPage: 1, pageSize: 10 },
        });
        expect(result.data).toHaveLength(2);
        expect(result.total).toBe(2);
      });

      it("filters sessions by date range", async () => {
        const result = await ipcDataProvider.getList({
          resource: "sessions",
          filters: [
            { field: "startDate", operator: "eq", value: "2024-01-10T00:00:00Z" },
            { field: "endDate", operator: "eq", value: "2024-01-12T00:00:00Z" },
          ],
        });
        expect(result.data).toHaveLength(2);
      });

      it("throws error for unsupported resource", async () => {
        await expect(ipcDataProvider.getList({ resource: "unsupported" })).rejects.toThrow(
          'Resource "unsupported" not supported'
        );
      });
    });

    describe("getOne", () => {
      it("returns project by path", async () => {
        const result = await ipcDataProvider.getOne({
          resource: "projects",
          id: "/Users/test/project1",
          meta: {},
        });
        expect(result.data).toEqual(mockProjects[0]);
      });

      it("throws error for non-existent project", async () => {
        await expect(
          ipcDataProvider.getOne({
            resource: "projects",
            id: "/non/existent",
            meta: {},
          })
        ).rejects.toThrow('Project with path "/non/existent" not found');
      });

      it("returns session by id", async () => {
        const result = await ipcDataProvider.getOne({
          resource: "sessions",
          id: "session1",
          meta: {},
        });
        expect(result.data).toEqual(mockSessions[0]);
      });

      it("throws error for non-existent session", async () => {
        await expect(
          ipcDataProvider.getOne({
            resource: "sessions",
            id: "non-existent",
            meta: {},
          })
        ).rejects.toThrow('Session with id "non-existent" not found');
      });

      it("throws error for unsupported resource", async () => {
        await expect(
          ipcDataProvider.getOne({
            resource: "unsupported",
            id: "test",
            meta: {},
          })
        ).rejects.toThrow('Resource "unsupported" not supported');
      });
    });

    describe("getMany", () => {
      it("returns multiple projects by paths", async () => {
        const result = await ipcDataProvider.getMany!({
          resource: "projects",
          ids: ["/Users/test/project1", "/Users/test/project2"],
          meta: {},
        });
        expect(result.data).toEqual(mockProjects);
      });

      it("returns only matching projects", async () => {
        const result = await ipcDataProvider.getMany!({
          resource: "projects",
          ids: ["/Users/test/project1"],
          meta: {},
        });
        expect(result.data).toHaveLength(1);
        expect((result.data[0] as Project).path).toBe("/Users/test/project1");
      });

      it("returns multiple sessions by ids", async () => {
        const result = await ipcDataProvider.getMany!({
          resource: "sessions",
          ids: ["session1", "session2"],
          meta: {},
        });
        expect(result.data).toHaveLength(2);
      });

      it("throws error for unsupported resource", async () => {
        await expect(
          ipcDataProvider.getMany!({
            resource: "unsupported",
            ids: ["test"],
            meta: {},
          })
        ).rejects.toThrow('Resource "unsupported" not supported');
      });
    });

    describe("unsupported operations", () => {
      it("create throws error for unsupported resource", async () => {
        await expect(
          ipcDataProvider.create({
            resource: "projects",
            variables: {},
            meta: {},
          })
        ).rejects.toThrow('Create operation not supported for resource "projects"');
      });

      it("update throws error for unsupported resource", async () => {
        await expect(
          ipcDataProvider.update({
            resource: "sessions",
            id: "test",
            variables: {},
            meta: {},
          })
        ).rejects.toThrow('Update operation not supported for resource "sessions"');
      });

      it("deleteOne throws error for unsupported resource", async () => {
        await expect(
          ipcDataProvider.deleteOne({
            resource: "projects",
            id: "test",
            meta: {},
          })
        ).rejects.toThrow('Delete operation not supported for resource "projects"');
      });
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ error: "Test error" }),
          getByPath: jest.fn().mockResolvedValue({ error: "Test error" }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ error: "Test error" }),
          getByProject: jest.fn().mockResolvedValue({ error: "Test error" }),
          getByDateRange: jest.fn().mockResolvedValue({ error: "Test error" }),
        },
      };
    });

    it("throws error from getProjects", async () => {
      await expect(ipcDataProvider.getList({ resource: "projects" })).rejects.toThrow("Test error");
    });

    it("throws error from getProjectByPath", async () => {
      await expect(
        ipcDataProvider.getOne({ resource: "projects", id: "/test", meta: {} })
      ).rejects.toThrow("Test error");
    });

    it("throws error from getSessions", async () => {
      await expect(ipcDataProvider.getList({ resource: "sessions" })).rejects.toThrow("Test error");
    });
  });

  describe("createIpcDataProvider", () => {
    it("creates a new data provider instance", () => {
      const provider = createIpcDataProvider();
      expect(provider).toBeDefined();
      expect(provider.getList).toBeDefined();
      expect(provider.getOne).toBeDefined();
      expect(provider.getMany).toBeDefined();
      expect(provider.create).toBeDefined();
      expect(provider.update).toBeDefined();
      expect(provider.deleteOne).toBeDefined();
      expect(provider.getApiUrl).toBeDefined();
    });
  });

  describe("groups resource", () => {
    const mockGroups: import("../../../../types/electron").ProjectGroup[] = [
      {
        id: "group1",
        name: "Work Projects",
        color: "#FF5733",
        createdAt: "2024-01-01T10:00:00Z",
        sortOrder: 0,
      },
      {
        id: "group2",
        name: "Personal Projects",
        color: "#33FF57",
        createdAt: "2024-01-05T10:00:00Z",
        sortOrder: 1,
      },
    ];

    beforeEach(() => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest
            .fn()
            .mockImplementation((path) =>
              Promise.resolve({ project: mockProjects.find((p) => p.path === path) || null })
            ),
          setHidden: jest.fn().mockResolvedValue({ success: true }),
          setGroup: jest.fn().mockResolvedValue({ success: true }),
          merge: jest.fn().mockResolvedValue({ success: true }),
          unmerge: jest.fn().mockResolvedValue({ success: true }),
          getMergedProjects: jest.fn().mockResolvedValue({ projects: [] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: mockGroups }),
          create: jest.fn().mockImplementation((name, color) =>
            Promise.resolve({
              group: {
                id: "new-group-id",
                name,
                color: color || null,
                createdAt: "2024-01-20T10:00:00Z",
                sortOrder: 2,
              },
            })
          ),
          update: jest.fn().mockImplementation((id, updates) => {
            const group = mockGroups.find((g) => g.id === id);
            if (!group) {
              return Promise.resolve({ group: null });
            }
            return Promise.resolve({
              group: { ...group, ...updates },
            });
          }),
          delete: jest.fn().mockResolvedValue({ success: true }),
        },
      };
    });

    describe("getList for groups", () => {
      it("returns all groups", async () => {
        const result = await ipcDataProvider.getList({ resource: "groups" });
        expect(result.data).toEqual(mockGroups);
        expect(result.total).toBe(2);
      });
    });

    describe("getOne for groups", () => {
      it("returns a group by id", async () => {
        const result = await ipcDataProvider.getOne({
          resource: "groups",
          id: "group1",
          meta: {},
        });
        expect(result.data).toEqual(mockGroups[0]);
      });

      it("throws error for non-existent group", async () => {
        await expect(
          ipcDataProvider.getOne({
            resource: "groups",
            id: "non-existent",
            meta: {},
          })
        ).rejects.toThrow('Group with id "non-existent" not found');
      });
    });

    describe("getMany for groups", () => {
      it("returns multiple groups by ids", async () => {
        const result = await ipcDataProvider.getMany!({
          resource: "groups",
          ids: ["group1", "group2"],
          meta: {},
        });
        expect(result.data).toEqual(mockGroups);
      });

      it("returns only matching groups", async () => {
        const result = await ipcDataProvider.getMany!({
          resource: "groups",
          ids: ["group1"],
          meta: {},
        });
        expect(result.data).toHaveLength(1);
        expect((result.data[0] as import("../../../../types/electron").ProjectGroup).id).toBe(
          "group1"
        );
      });
    });

    describe("create for groups", () => {
      it("creates a new group with name only", async () => {
        const result = await ipcDataProvider.create({
          resource: "groups",
          variables: { name: "New Group" },
          meta: {},
        });
        expect(window.electron.groups.create).toHaveBeenCalledWith("New Group", undefined);
        expect(result.data).toMatchObject({
          id: "new-group-id",
          name: "New Group",
          color: null,
        });
      });

      it("creates a new group with name and color", async () => {
        const result = await ipcDataProvider.create({
          resource: "groups",
          variables: { name: "Colored Group", color: "#FF0000" },
          meta: {},
        });
        expect(window.electron.groups.create).toHaveBeenCalledWith("Colored Group", "#FF0000");
        expect(result.data).toMatchObject({
          id: "new-group-id",
          name: "Colored Group",
          color: "#FF0000",
        });
      });

      it("creates a group with null color", async () => {
        const result = await ipcDataProvider.create({
          resource: "groups",
          variables: { name: "No Color Group", color: null },
          meta: {},
        });
        expect(window.electron.groups.create).toHaveBeenCalledWith("No Color Group", null);
        expect(result.data).toMatchObject({
          name: "No Color Group",
          color: null,
        });
      });
    });

    describe("update for groups", () => {
      it("updates group name", async () => {
        const result = await ipcDataProvider.update({
          resource: "groups",
          id: "group1",
          variables: { name: "Updated Name" },
          meta: {},
        });
        expect(window.electron.groups.update).toHaveBeenCalledWith("group1", {
          name: "Updated Name",
        });
        expect(result.data).toMatchObject({
          id: "group1",
          name: "Updated Name",
        });
      });

      it("updates group color", async () => {
        const result = await ipcDataProvider.update({
          resource: "groups",
          id: "group1",
          variables: { color: "#0000FF" },
          meta: {},
        });
        expect(window.electron.groups.update).toHaveBeenCalledWith("group1", {
          color: "#0000FF",
        });
        expect(result.data).toMatchObject({
          id: "group1",
          color: "#0000FF",
        });
      });

      it("updates group sortOrder", async () => {
        const result = await ipcDataProvider.update({
          resource: "groups",
          id: "group1",
          variables: { sortOrder: 5 },
          meta: {},
        });
        expect(window.electron.groups.update).toHaveBeenCalledWith("group1", {
          sortOrder: 5,
        });
        expect(result.data).toMatchObject({
          id: "group1",
          sortOrder: 5,
        });
      });

      it("throws error when updating non-existent group", async () => {
        await expect(
          ipcDataProvider.update({
            resource: "groups",
            id: "non-existent",
            variables: { name: "Test" },
            meta: {},
          })
        ).rejects.toThrow('Group with id "non-existent" not found');
      });
    });

    describe("deleteOne for groups", () => {
      it("deletes a group by id", async () => {
        const result = await ipcDataProvider.deleteOne({
          resource: "groups",
          id: "group1",
          meta: {},
        });
        expect(window.electron.groups.delete).toHaveBeenCalledWith("group1");
        expect(result.data).toEqual({ id: "group1" });
      });

      it("deletes another group by id", async () => {
        const result = await ipcDataProvider.deleteOne({
          resource: "groups",
          id: "group2",
          meta: {},
        });
        expect(window.electron.groups.delete).toHaveBeenCalledWith("group2");
        expect(result.data).toEqual({ id: "group2" });
      });
    });
  });

  describe("update for projects", () => {
    beforeEach(() => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest
            .fn()
            .mockImplementation((path) =>
              Promise.resolve({ project: mockProjects.find((p) => p.path === path) || null })
            ),
          setHidden: jest.fn().mockResolvedValue({ success: true }),
          setGroup: jest.fn().mockResolvedValue({ success: true }),
          merge: jest.fn().mockResolvedValue({ success: true }),
          unmerge: jest.fn().mockResolvedValue({ success: true }),
          getMergedProjects: jest.fn().mockResolvedValue({ projects: [] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };
    });

    it("sets project as hidden", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { isHidden: true },
        meta: {},
      });
      expect(window.electron.projects.setHidden).toHaveBeenCalledWith("/Users/test/project1", true);
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("sets project as visible", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { isHidden: false },
        meta: {},
      });
      expect(window.electron.projects.setHidden).toHaveBeenCalledWith(
        "/Users/test/project1",
        false
      );
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("assigns project to a group", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { groupId: "group1" },
        meta: {},
      });
      expect(window.electron.projects.setGroup).toHaveBeenCalledWith(
        "/Users/test/project1",
        "group1"
      );
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("removes project from group by setting groupId to null", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { groupId: null },
        meta: {},
      });
      expect(window.electron.projects.setGroup).toHaveBeenCalledWith("/Users/test/project1", null);
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("unmerges a project by setting mergedInto to null", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { mergedInto: null },
        meta: {},
      });
      expect(window.electron.projects.unmerge).toHaveBeenCalledWith("/Users/test/project1");
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("merges projects by setting mergeSources", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { mergeSources: ["/Users/test/project2"] },
        meta: {},
      });
      expect(window.electron.projects.merge).toHaveBeenCalledWith(
        ["/Users/test/project2"],
        "/Users/test/project1"
      );
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("handles multiple project updates at once", async () => {
      const result = await ipcDataProvider.update({
        resource: "projects",
        id: "/Users/test/project1",
        variables: { isHidden: true, groupId: "group1" },
        meta: {},
      });
      expect(window.electron.projects.setHidden).toHaveBeenCalledWith("/Users/test/project1", true);
      expect(window.electron.projects.setGroup).toHaveBeenCalledWith(
        "/Users/test/project1",
        "group1"
      );
      expect(result.data).toMatchObject({ path: "/Users/test/project1" });
    });

    it("throws error when updating non-existent project", async () => {
      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/non/existent/path",
          variables: { isHidden: true },
          meta: {},
        })
      ).rejects.toThrow('Project with path "/non/existent/path" not found');
    });
  });

  describe("error handling for groups", () => {
    beforeEach(() => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: null }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ error: "Database error" }),
          create: jest.fn().mockResolvedValue({ error: "Failed to create group" }),
          update: jest.fn().mockResolvedValue({ error: "Failed to update group" }),
          delete: jest.fn().mockResolvedValue({ error: "Failed to delete group" }),
        },
      };
    });

    it("throws error from getGroups", async () => {
      await expect(ipcDataProvider.getList({ resource: "groups" })).rejects.toThrow(
        "Database error"
      );
    });

    it("throws error from createGroup", async () => {
      await expect(
        ipcDataProvider.create({
          resource: "groups",
          variables: { name: "Test" },
          meta: {},
        })
      ).rejects.toThrow("Failed to create group");
    });

    it("throws error from updateGroup", async () => {
      await expect(
        ipcDataProvider.update({
          resource: "groups",
          id: "group1",
          variables: { name: "Test" },
          meta: {},
        })
      ).rejects.toThrow("Failed to update group");
    });

    it("throws error from deleteGroup", async () => {
      await expect(
        ipcDataProvider.deleteOne({
          resource: "groups",
          id: "group1",
          meta: {},
        })
      ).rejects.toThrow("Failed to delete group");
    });
  });

  describe("error handling for project updates", () => {
    it("throws error when setHidden fails", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
          setHidden: jest.fn().mockResolvedValue({ error: "Failed to hide project" }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/Users/test/project1",
          variables: { isHidden: true },
          meta: {},
        })
      ).rejects.toThrow("Failed to hide project");
    });

    it("throws error when setGroup fails", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
          setHidden: jest.fn().mockResolvedValue({ success: true }),
          setGroup: jest.fn().mockResolvedValue({ error: "Failed to set group" }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/Users/test/project1",
          variables: { groupId: "group1" },
          meta: {},
        })
      ).rejects.toThrow("Failed to set group");
    });

    it("throws error when unmerge fails", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
          setHidden: jest.fn().mockResolvedValue({ success: true }),
          setGroup: jest.fn().mockResolvedValue({ success: true }),
          merge: jest.fn().mockResolvedValue({ success: true }),
          unmerge: jest.fn().mockResolvedValue({ error: "Failed to unmerge" }),
          getMergedProjects: jest.fn().mockResolvedValue({ projects: [] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/Users/test/project1",
          variables: { mergedInto: null },
          meta: {},
        })
      ).rejects.toThrow("Failed to unmerge");
    });

    it("throws error when merge fails", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
          setHidden: jest.fn().mockResolvedValue({ success: true }),
          setGroup: jest.fn().mockResolvedValue({ success: true }),
          merge: jest.fn().mockResolvedValue({ error: "Failed to merge" }),
          unmerge: jest.fn().mockResolvedValue({ success: true }),
          getMergedProjects: jest.fn().mockResolvedValue({ projects: [] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/Users/test/project1",
          variables: { mergeSources: ["/Users/test/project2"] },
          meta: {},
        })
      ).rejects.toThrow("Failed to merge");
    });
  });

  describe("createGroup when not in Electron environment", () => {
    beforeEach(() => {
      delete (window as { electron?: unknown }).electron;
    });

    it("throws error when creating group outside Electron", async () => {
      await expect(
        ipcDataProvider.create({
          resource: "groups",
          variables: { name: "Test Group" },
          meta: {},
        })
      ).rejects.toThrow("Not running in Electron environment");
    });
  });

  describe("createGroup when group response is null", () => {
    it("throws error when group creation returns null", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
          create: jest.fn().mockResolvedValue({ group: null }),
        },
      };

      await expect(
        ipcDataProvider.create({
          resource: "groups",
          variables: { name: "Test Group" },
          meta: {},
        })
      ).rejects.toThrow("Failed to create group");
    });
  });

  describe("groups operations when not in Electron environment", () => {
    beforeEach(() => {
      delete (window as { electron?: unknown }).electron;
    });

    it("getList returns empty array for groups", async () => {
      const result = await ipcDataProvider.getList({ resource: "groups" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("getOne throws error for groups when not found", async () => {
      await expect(
        ipcDataProvider.getOne({
          resource: "groups",
          id: "group1",
          meta: {},
        })
      ).rejects.toThrow('Group with id "group1" not found');
    });

    it("getMany returns empty array for groups", async () => {
      const result = await ipcDataProvider.getMany!({
        resource: "groups",
        ids: ["group1"],
        meta: {},
      });
      expect(result.data).toEqual([]);
    });

    it("update returns null for groups when not in Electron", async () => {
      await expect(
        ipcDataProvider.update({
          resource: "groups",
          id: "group1",
          variables: { name: "Test" },
          meta: {},
        })
      ).rejects.toThrow('Group with id "group1" not found');
    });

    it("deleteOne does nothing when not in Electron", async () => {
      const result = await ipcDataProvider.deleteOne({
        resource: "groups",
        id: "group1",
        meta: {},
      });
      expect(result.data).toEqual({ id: "group1" });
    });
  });

  describe("project update when not in Electron environment", () => {
    beforeEach(() => {
      delete (window as { electron?: unknown }).electron;
    });

    it("returns null when updating project outside Electron", async () => {
      await expect(
        ipcDataProvider.update({
          resource: "projects",
          id: "/Users/test/project1",
          variables: { isHidden: true },
          meta: {},
        })
      ).rejects.toThrow('Project with path "/Users/test/project1" not found');
    });
  });

  describe("sessions filtering when not in Electron environment", () => {
    beforeEach(() => {
      delete (window as { electron?: unknown }).electron;
    });

    it("getSessionsByProject returns empty when filtering by project outside Electron", async () => {
      const result = await ipcDataProvider.getList({
        resource: "sessions",
        filters: [{ field: "projectPath", operator: "eq", value: "/Users/test/project1" }],
        pagination: { currentPage: 1, pageSize: 10 },
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("getSessionsByDateRange returns empty when filtering by date outside Electron", async () => {
      const result = await ipcDataProvider.getList({
        resource: "sessions",
        filters: [
          { field: "startDate", operator: "eq", value: "2024-01-10T00:00:00Z" },
          { field: "endDate", operator: "eq", value: "2024-01-12T00:00:00Z" },
        ],
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("handling undefined/null API responses", () => {
    it("handles undefined projects array from API", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({}), // No projects field
          getByPath: jest.fn().mockResolvedValue({ project: null }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      const result = await ipcDataProvider.getList({ resource: "projects" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("handles undefined sessions array from API", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({}), // No sessions field
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      const result = await ipcDataProvider.getList({ resource: "sessions" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("handles undefined sessions array from getByProject API", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
        },
        sessions: {
          getByProject: jest.fn().mockResolvedValue({}), // No sessions or total field
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      const result = await ipcDataProvider.getList({
        resource: "sessions",
        filters: [{ field: "projectPath", operator: "eq", value: "/Users/test/project1" }],
        pagination: { currentPage: 1, pageSize: 10 },
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("handles undefined sessions array from getByDateRange API", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
        },
        sessions: {
          getByDateRange: jest.fn().mockResolvedValue({}), // No sessions field
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      const result = await ipcDataProvider.getList({
        resource: "sessions",
        filters: [
          { field: "startDate", operator: "eq", value: "2024-01-10T00:00:00Z" },
          { field: "endDate", operator: "eq", value: "2024-01-12T00:00:00Z" },
        ],
      });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });

    it("handles undefined groups array from API", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({}), // No groups field
        },
      };

      const result = await ipcDataProvider.getList({ resource: "groups" });
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("error handling for getSessionsByProject and getSessionsByDateRange", () => {
    it("throws error from getSessionsByProject", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
          getByProject: jest.fn().mockResolvedValue({ error: "Failed to get sessions by project" }),
          getByDateRange: jest.fn().mockResolvedValue({ sessions: mockSessions }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.getList({
          resource: "sessions",
          filters: [{ field: "projectPath", operator: "eq", value: "/Users/test/project1" }],
          pagination: { currentPage: 1, pageSize: 10 },
        })
      ).rejects.toThrow("Failed to get sessions by project");
    });

    it("throws error from getSessionsByDateRange", async () => {
      (window as { electron: unknown }).electron = {
        projects: {
          getAll: jest.fn().mockResolvedValue({ projects: mockProjects }),
          getByPath: jest.fn().mockResolvedValue({ project: mockProjects[0] }),
        },
        sessions: {
          getAll: jest.fn().mockResolvedValue({ sessions: mockSessions }),
          getByProject: jest.fn().mockResolvedValue({ sessions: mockSessions }),
          getByDateRange: jest
            .fn()
            .mockResolvedValue({ error: "Failed to get sessions by date range" }),
        },
        groups: {
          getAll: jest.fn().mockResolvedValue({ groups: [] }),
        },
      };

      await expect(
        ipcDataProvider.getList({
          resource: "sessions",
          filters: [
            { field: "startDate", operator: "eq", value: "2024-01-10T00:00:00Z" },
            { field: "endDate", operator: "eq", value: "2024-01-12T00:00:00Z" },
          ],
        })
      ).rejects.toThrow("Failed to get sessions by date range");
    });
  });
});

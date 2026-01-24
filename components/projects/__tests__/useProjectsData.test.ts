/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { renderHook } from "@testing-library/react";
import { useProjectsData } from "../useProjectsData";
import type { Project, ProjectGroup } from "@/types/electron";

const createProject = (overrides: Partial<Project> = {}): Project => ({
  path: "/Users/test/project",
  name: "test-project",
  firstActivity: "2024-01-01T10:00:00Z",
  lastActivity: "2024-01-15T15:30:00Z",
  sessionCount: 5,
  messageCount: 100,
  totalTime: 3600000,
  isHidden: false,
  groupId: null,
  mergedInto: null,
  ...overrides,
});

const createGroup = (overrides: Partial<ProjectGroup> = {}): ProjectGroup => ({
  id: "group-1",
  name: "Test Group",
  color: "#3b82f6",
  createdAt: "2024-01-01T00:00:00Z",
  sortOrder: 0,
  ...overrides,
});

describe("useProjectsData", () => {
  const defaultProps = {
    projects: [] as Project[],
    groups: [] as ProjectGroup[],
    sortField: "lastActivity" as const,
    sortOrder: "desc" as const,
    showHidden: false,
  };

  describe("mergedByPrimary", () => {
    it("returns empty map when no projects are merged", () => {
      const projects = [
        createProject({ path: "/project-a", name: "project-a" }),
        createProject({ path: "/project-b", name: "project-b" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.mergedByPrimary.size).toBe(0);
    });

    it("groups merged projects by their primary project path", () => {
      const projects = [
        createProject({ path: "/primary", name: "primary", mergedInto: null }),
        createProject({ path: "/merged-1", name: "merged-1", mergedInto: "/primary" }),
        createProject({ path: "/merged-2", name: "merged-2", mergedInto: "/primary" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.mergedByPrimary.size).toBe(1);
      expect(result.current.mergedByPrimary.get("/primary")).toHaveLength(2);
      expect(result.current.mergedByPrimary.get("/primary")?.map((p) => p.path)).toEqual([
        "/merged-1",
        "/merged-2",
      ]);
    });

    it("handles multiple primary projects with separate merged projects", () => {
      const projects = [
        createProject({ path: "/primary-a", name: "primary-a", mergedInto: null }),
        createProject({ path: "/primary-b", name: "primary-b", mergedInto: null }),
        createProject({ path: "/merged-1", name: "merged-1", mergedInto: "/primary-a" }),
        createProject({ path: "/merged-2", name: "merged-2", mergedInto: "/primary-b" }),
        createProject({ path: "/merged-3", name: "merged-3", mergedInto: "/primary-a" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.mergedByPrimary.size).toBe(2);
      expect(result.current.mergedByPrimary.get("/primary-a")).toHaveLength(2);
      expect(result.current.mergedByPrimary.get("/primary-b")).toHaveLength(1);
    });
  });

  describe("filteredProjects", () => {
    it("excludes projects that are merged into another project", () => {
      const projects = [
        createProject({ path: "/primary", name: "primary", mergedInto: null }),
        createProject({ path: "/merged", name: "merged", mergedInto: "/primary" }),
        createProject({ path: "/standalone", name: "standalone", mergedInto: null }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.filteredProjects).toHaveLength(2);
      expect(result.current.filteredProjects.map((p) => p.path)).toEqual([
        "/primary",
        "/standalone",
      ]);
    });

    it("excludes hidden projects when showHidden is false", () => {
      const projects = [
        createProject({ path: "/visible", name: "visible", isHidden: false }),
        createProject({ path: "/hidden", name: "hidden", isHidden: true }),
      ];

      const { result } = renderHook(() =>
        useProjectsData({ ...defaultProps, projects, showHidden: false })
      );

      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].path).toBe("/visible");
    });

    it("includes hidden projects when showHidden is true", () => {
      const projects = [
        createProject({ path: "/visible", name: "visible", isHidden: false }),
        createProject({ path: "/hidden", name: "hidden", isHidden: true }),
      ];

      const { result } = renderHook(() =>
        useProjectsData({ ...defaultProps, projects, showHidden: true })
      );

      expect(result.current.filteredProjects).toHaveLength(2);
    });

    it("applies both filters together - excludes merged AND hidden projects", () => {
      const projects = [
        createProject({ path: "/visible", name: "visible", isHidden: false, mergedInto: null }),
        createProject({ path: "/hidden", name: "hidden", isHidden: true, mergedInto: null }),
        createProject({ path: "/merged", name: "merged", isHidden: false, mergedInto: "/visible" }),
        createProject({
          path: "/hidden-merged",
          name: "hidden-merged",
          isHidden: true,
          mergedInto: "/visible",
        }),
      ];

      const { result } = renderHook(() =>
        useProjectsData({ ...defaultProps, projects, showHidden: false })
      );

      // Only visible, non-merged project should show
      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].path).toBe("/visible");
    });
  });

  describe("getAggregatedProject", () => {
    it("returns original project when it has no merged projects", () => {
      const project = createProject({
        path: "/standalone",
        sessionCount: 5,
        totalTime: 3600000,
        messageCount: 100,
      });
      const projects = [project];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      const aggregated = result.current.getAggregatedProject(project);
      expect(aggregated.sessionCount).toBe(5);
      expect(aggregated.totalTime).toBe(3600000);
      expect(aggregated.messageCount).toBe(100);
    });

    it("aggregates stats from all merged projects", () => {
      const primary = createProject({
        path: "/primary",
        name: "primary",
        sessionCount: 5,
        totalTime: 3600000,
        messageCount: 100,
        mergedInto: null,
      });
      const merged1 = createProject({
        path: "/merged-1",
        name: "merged-1",
        sessionCount: 3,
        totalTime: 1800000,
        messageCount: 50,
        mergedInto: "/primary",
      });
      const merged2 = createProject({
        path: "/merged-2",
        name: "merged-2",
        sessionCount: 2,
        totalTime: 900000,
        messageCount: 25,
        mergedInto: "/primary",
      });
      const projects = [primary, merged1, merged2];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      const aggregated = result.current.getAggregatedProject(primary);
      expect(aggregated.sessionCount).toBe(10); // 5 + 3 + 2
      expect(aggregated.totalTime).toBe(6300000); // 3600000 + 1800000 + 900000
      expect(aggregated.messageCount).toBe(175); // 100 + 50 + 25
    });

    it("preserves original project properties while aggregating stats", () => {
      const primary = createProject({
        path: "/primary",
        name: "primary-name",
        sessionCount: 5,
        totalTime: 3600000,
        messageCount: 100,
        isHidden: false,
        groupId: "group-1",
        mergedInto: null,
      });
      const merged = createProject({
        path: "/merged",
        name: "merged-name",
        sessionCount: 3,
        totalTime: 1800000,
        messageCount: 50,
        isHidden: true,
        groupId: "group-2",
        mergedInto: "/primary",
      });
      const projects = [primary, merged];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      const aggregated = result.current.getAggregatedProject(primary);
      // Stats are aggregated
      expect(aggregated.sessionCount).toBe(8);
      // Other properties come from primary
      expect(aggregated.name).toBe("primary-name");
      expect(aggregated.path).toBe("/primary");
      expect(aggregated.isHidden).toBe(false);
      expect(aggregated.groupId).toBe("group-1");
    });
  });

  describe("sorting", () => {
    const projectsForSorting = [
      createProject({
        path: "/project-alpha",
        name: "alpha",
        sessionCount: 5,
        totalTime: 1000000,
        lastActivity: "2024-01-15T10:00:00Z",
      }),
      createProject({
        path: "/project-beta",
        name: "beta",
        sessionCount: 10,
        totalTime: 500000,
        lastActivity: "2024-01-20T10:00:00Z",
      }),
      createProject({
        path: "/project-gamma",
        name: "gamma",
        sessionCount: 3,
        totalTime: 2000000,
        lastActivity: "2024-01-10T10:00:00Z",
      }),
    ];

    describe("by name", () => {
      it("sorts alphabetically ascending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "name",
            sortOrder: "asc",
          })
        );

        const names = result.current.sortedProjects.map((p) => p.name);
        expect(names).toEqual(["alpha", "beta", "gamma"]);
      });

      it("sorts alphabetically descending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "name",
            sortOrder: "desc",
          })
        );

        const names = result.current.sortedProjects.map((p) => p.name);
        expect(names).toEqual(["gamma", "beta", "alpha"]);
      });
    });

    describe("by sessionCount", () => {
      it("sorts by session count ascending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "sessionCount",
            sortOrder: "asc",
          })
        );

        const counts = result.current.sortedProjects.map((p) => p.sessionCount);
        expect(counts).toEqual([3, 5, 10]);
      });

      it("sorts by session count descending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "sessionCount",
            sortOrder: "desc",
          })
        );

        const counts = result.current.sortedProjects.map((p) => p.sessionCount);
        expect(counts).toEqual([10, 5, 3]);
      });
    });

    describe("by totalTime", () => {
      it("sorts by total time ascending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "totalTime",
            sortOrder: "asc",
          })
        );

        const times = result.current.sortedProjects.map((p) => p.totalTime);
        expect(times).toEqual([500000, 1000000, 2000000]);
      });

      it("sorts by total time descending", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "totalTime",
            sortOrder: "desc",
          })
        );

        const times = result.current.sortedProjects.map((p) => p.totalTime);
        expect(times).toEqual([2000000, 1000000, 500000]);
      });
    });

    describe("by lastActivity", () => {
      it("sorts by last activity ascending (oldest first)", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "lastActivity",
            sortOrder: "asc",
          })
        );

        const names = result.current.sortedProjects.map((p) => p.name);
        expect(names).toEqual(["gamma", "alpha", "beta"]);
      });

      it("sorts by last activity descending (newest first)", () => {
        const { result } = renderHook(() =>
          useProjectsData({
            ...defaultProps,
            projects: projectsForSorting,
            sortField: "lastActivity",
            sortOrder: "desc",
          })
        );

        const names = result.current.sortedProjects.map((p) => p.name);
        expect(names).toEqual(["beta", "alpha", "gamma"]);
      });
    });
  });

  describe("groupedProjects", () => {
    it("puts all projects in ungrouped section when no groups exist", () => {
      const projects = [
        createProject({ path: "/project-a", name: "project-a", groupId: null }),
        createProject({ path: "/project-b", name: "project-b", groupId: null }),
      ];

      const { result } = renderHook(() =>
        useProjectsData({ ...defaultProps, projects, groups: [] })
      );

      expect(result.current.groupedProjects).toHaveLength(1);
      expect(result.current.groupedProjects[0].group).toBeNull();
      expect(result.current.groupedProjects[0].projects).toHaveLength(2);
    });

    it("organizes projects into their respective groups", () => {
      const groups = [
        createGroup({ id: "work", name: "Work", sortOrder: 0 }),
        createGroup({ id: "personal", name: "Personal", sortOrder: 1 }),
      ];
      const projects = [
        createProject({ path: "/work-1", name: "work-1", groupId: "work" }),
        createProject({ path: "/work-2", name: "work-2", groupId: "work" }),
        createProject({ path: "/personal-1", name: "personal-1", groupId: "personal" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects, groups }));

      // Should have Work and Personal groups (no ungrouped since all are grouped)
      expect(result.current.groupedProjects).toHaveLength(2);

      const workGroup = result.current.groupedProjects.find((g) => g.group?.id === "work");
      const personalGroup = result.current.groupedProjects.find((g) => g.group?.id === "personal");

      expect(workGroup?.projects).toHaveLength(2);
      expect(personalGroup?.projects).toHaveLength(1);
    });

    it("maintains input order of groups (preserves forEach iteration order)", () => {
      // Groups are iterated in the order they are provided, not by sortOrder
      // The sortOrder field is expected to be pre-sorted by the caller
      const groups = [
        createGroup({ id: "a-group", name: "A Group", sortOrder: 0 }),
        createGroup({ id: "m-group", name: "M Group", sortOrder: 1 }),
        createGroup({ id: "z-group", name: "Z Group", sortOrder: 2 }),
      ];
      const projects = [
        createProject({ path: "/z", name: "z", groupId: "z-group" }),
        createProject({ path: "/a", name: "a", groupId: "a-group" }),
        createProject({ path: "/m", name: "m", groupId: "m-group" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects, groups }));

      const groupNames = result.current.groupedProjects.map((g) => g.group?.name);
      expect(groupNames).toEqual(["A Group", "M Group", "Z Group"]);
    });

    it("puts ungrouped projects at the end", () => {
      const groups = [createGroup({ id: "work", name: "Work", sortOrder: 0 })];
      const projects = [
        createProject({ path: "/work-1", name: "work-1", groupId: "work" }),
        createProject({ path: "/ungrouped", name: "ungrouped", groupId: null }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects, groups }));

      expect(result.current.groupedProjects).toHaveLength(2);
      expect(result.current.groupedProjects[0].group?.id).toBe("work");
      expect(result.current.groupedProjects[1].group).toBeNull();
    });

    it("handles project with invalid groupId by placing in ungrouped", () => {
      const groups = [createGroup({ id: "valid-group", name: "Valid Group", sortOrder: 0 })];
      const projects = [
        createProject({ path: "/valid", name: "valid", groupId: "valid-group" }),
        createProject({ path: "/invalid", name: "invalid", groupId: "non-existent-group" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects, groups }));

      expect(result.current.groupedProjects).toHaveLength(2);

      const validGroup = result.current.groupedProjects.find((g) => g.group?.id === "valid-group");
      const ungrouped = result.current.groupedProjects.find((g) => g.group === null);

      expect(validGroup?.projects).toHaveLength(1);
      expect(ungrouped?.projects).toHaveLength(1);
      expect(ungrouped?.projects[0].path).toBe("/invalid");
    });

    it("shows empty ungrouped section when no ungrouped projects exist but no groups have projects", () => {
      // Edge case: groups exist but no projects at all
      const groups = [createGroup({ id: "empty", name: "Empty Group", sortOrder: 0 })];

      const { result } = renderHook(() =>
        useProjectsData({ ...defaultProps, projects: [], groups })
      );

      // Should show ungrouped section even when empty if there are no grouped projects
      expect(result.current.groupedProjects).toHaveLength(1);
      expect(result.current.groupedProjects[0].group).toBeNull();
      expect(result.current.groupedProjects[0].projects).toHaveLength(0);
    });

    it("excludes empty groups from result", () => {
      const groups = [
        createGroup({ id: "has-projects", name: "Has Projects", sortOrder: 0 }),
        createGroup({ id: "empty", name: "Empty", sortOrder: 1 }),
      ];
      const projects = [
        createProject({ path: "/project", name: "project", groupId: "has-projects" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects, groups }));

      // Only "Has Projects" group should appear, "Empty" should be excluded
      expect(result.current.groupedProjects).toHaveLength(1);
      expect(result.current.groupedProjects[0].group?.id).toBe("has-projects");
    });
  });

  describe("hiddenCount", () => {
    it("returns 0 when no projects are hidden", () => {
      const projects = [
        createProject({ path: "/a", isHidden: false }),
        createProject({ path: "/b", isHidden: false }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.hiddenCount).toBe(0);
    });

    it("counts hidden projects correctly", () => {
      const projects = [
        createProject({ path: "/visible-1", isHidden: false }),
        createProject({ path: "/hidden-1", isHidden: true }),
        createProject({ path: "/hidden-2", isHidden: true }),
        createProject({ path: "/visible-2", isHidden: false }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      expect(result.current.hiddenCount).toBe(2);
    });

    it("excludes merged projects from hidden count", () => {
      const projects = [
        createProject({ path: "/primary", isHidden: false, mergedInto: null }),
        createProject({ path: "/hidden-primary", isHidden: true, mergedInto: null }),
        createProject({ path: "/hidden-merged", isHidden: true, mergedInto: "/primary" }),
      ];

      const { result } = renderHook(() => useProjectsData({ ...defaultProps, projects }));

      // Only the hidden primary should count, not the hidden merged project
      expect(result.current.hiddenCount).toBe(1);
    });
  });

  describe("memoization", () => {
    it("returns same references when inputs do not change", () => {
      const projects = [createProject({ path: "/project" })];
      const groups = [createGroup({ id: "group" })];

      const { result, rerender } = renderHook(() =>
        useProjectsData({
          projects,
          groups,
          sortField: "name",
          sortOrder: "asc",
          showHidden: false,
        })
      );

      const firstMergedByPrimary = result.current.mergedByPrimary;
      const firstFilteredProjects = result.current.filteredProjects;
      const firstGroupedProjects = result.current.groupedProjects;

      rerender();

      // References should be the same since inputs haven't changed
      expect(result.current.mergedByPrimary).toBe(firstMergedByPrimary);
      expect(result.current.filteredProjects).toBe(firstFilteredProjects);
      expect(result.current.groupedProjects).toBe(firstGroupedProjects);
    });
  });
});

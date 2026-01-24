/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useProjectsListState } from "../useProjectsListState";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

describe("useProjectsListState", () => {
  const mockOnMerge = jest.fn();

  beforeEach(() => {
    mockPush.mockClear();
    mockOnMerge.mockClear();
  });

  const defaultProps = {
    projects: [] as Project[],
    groups: [] as ProjectGroup[],
    onMerge: mockOnMerge,
  };

  describe("initial state", () => {
    it("starts with lastActivity as default sort field", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.sortField).toBe("lastActivity");
    });

    it("starts with descending sort order", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.sortOrder).toBe("desc");
    });

    it("starts with hidden projects not shown", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.showHidden).toBe(false);
    });

    it("starts with no collapsed groups", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.collapsedGroups.size).toBe(0);
    });

    it("starts not in select mode", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.isSelectMode).toBe(false);
    });

    it("starts with no selected projects", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.selectedProjects.size).toBe(0);
    });

    it("starts with merge dialog closed", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.showMergeDialog).toBe(false);
    });

    it("starts with no primary selected for merge", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));
      expect(result.current.selectedPrimary).toBeNull();
    });
  });

  describe("handleSort", () => {
    it("changes sort field when clicking different field", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sortField).toBe("name");
      expect(result.current.sortOrder).toBe("desc"); // Default for new field
    });

    it("toggles sort order when clicking same field", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      // Initial: lastActivity, desc
      act(() => {
        result.current.handleSort("lastActivity");
      });

      expect(result.current.sortField).toBe("lastActivity");
      expect(result.current.sortOrder).toBe("asc"); // Toggled from desc
    });

    it("toggles back to desc after toggling to asc", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      act(() => {
        result.current.handleSort("lastActivity"); // desc -> asc
      });

      act(() => {
        result.current.handleSort("lastActivity"); // asc -> desc
      });

      expect(result.current.sortOrder).toBe("desc");
    });

    it("resets to desc when switching to new sort field", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      // Toggle to asc
      act(() => {
        result.current.handleSort("lastActivity");
      });
      expect(result.current.sortOrder).toBe("asc");

      // Switch field - should reset to desc
      act(() => {
        result.current.handleSort("totalTime");
      });
      expect(result.current.sortField).toBe("totalTime");
      expect(result.current.sortOrder).toBe("desc");
    });

    it("supports sorting by sessionCount", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      act(() => {
        result.current.handleSort("sessionCount");
      });

      expect(result.current.sortField).toBe("sessionCount");
    });

    it("supports sorting by totalTime", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      act(() => {
        result.current.handleSort("totalTime");
      });

      expect(result.current.sortField).toBe("totalTime");
    });
  });

  describe("hidden projects toggle", () => {
    it("toggles showHidden state", () => {
      const { result } = renderHook(() => useProjectsListState(defaultProps));

      expect(result.current.showHidden).toBe(false);

      act(() => {
        result.current.setShowHidden(true);
      });

      expect(result.current.showHidden).toBe(true);
    });

    it("exposes hiddenCount from useProjectsData", () => {
      const projects = [
        createProject({ path: "/visible", isHidden: false }),
        createProject({ path: "/hidden-1", isHidden: true }),
        createProject({ path: "/hidden-2", isHidden: true }),
      ];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      expect(result.current.hiddenCount).toBe(2);
    });
  });

  describe("group collapse state", () => {
    it("collapses a group when toggled", () => {
      const groups = [createGroup({ id: "group-1", name: "Group 1" })];
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, groups }));

      act(() => {
        result.current.toggleGroupCollapse("group-1");
      });

      expect(result.current.collapsedGroups.has("group-1")).toBe(true);
    });

    it("expands a collapsed group when toggled again", () => {
      const groups = [createGroup({ id: "group-1", name: "Group 1" })];
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, groups }));

      // Collapse
      act(() => {
        result.current.toggleGroupCollapse("group-1");
      });
      expect(result.current.collapsedGroups.has("group-1")).toBe(true);

      // Expand
      act(() => {
        result.current.toggleGroupCollapse("group-1");
      });
      expect(result.current.collapsedGroups.has("group-1")).toBe(false);
    });

    it("maintains independent collapse state for multiple groups", () => {
      const groups = [
        createGroup({ id: "group-1", name: "Group 1", sortOrder: 0 }),
        createGroup({ id: "group-2", name: "Group 2", sortOrder: 1 }),
        createGroup({ id: "group-3", name: "Group 3", sortOrder: 2 }),
      ];
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, groups }));

      // Collapse first and third
      act(() => {
        result.current.toggleGroupCollapse("group-1");
        result.current.toggleGroupCollapse("group-3");
      });

      expect(result.current.collapsedGroups.has("group-1")).toBe(true);
      expect(result.current.collapsedGroups.has("group-2")).toBe(false);
      expect(result.current.collapsedGroups.has("group-3")).toBe(true);

      // Expand first
      act(() => {
        result.current.toggleGroupCollapse("group-1");
      });

      expect(result.current.collapsedGroups.has("group-1")).toBe(false);
      expect(result.current.collapsedGroups.has("group-3")).toBe(true);
    });
  });

  describe("select mode for merging", () => {
    const projects = [
      createProject({ path: "/project-a", name: "project-a" }),
      createProject({ path: "/project-b", name: "project-b" }),
      createProject({ path: "/project-c", name: "project-c" }),
    ];

    it("enters select mode", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
      });

      expect(result.current.isSelectMode).toBe(true);
    });

    it("exits select mode and clears selection on cancel", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      // Enter select mode and select some projects
      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
      });

      expect(result.current.selectedProjects.size).toBe(2);

      // Cancel
      act(() => {
        result.current.cancelSelectMode();
      });

      expect(result.current.isSelectMode).toBe(false);
      expect(result.current.selectedProjects.size).toBe(0);
    });

    it("toggles project selection on", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
      });

      expect(result.current.selectedProjects.has("/project-a")).toBe(true);
    });

    it("toggles project selection off", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
      });
      expect(result.current.selectedProjects.has("/project-a")).toBe(true);

      act(() => {
        result.current.toggleProjectSelection("/project-a");
      });
      expect(result.current.selectedProjects.has("/project-a")).toBe(false);
    });

    it("allows selecting multiple projects", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
        result.current.toggleProjectSelection("/project-c");
      });

      expect(result.current.selectedProjects.size).toBe(3);
      expect(result.current.selectedProjects.has("/project-a")).toBe(true);
      expect(result.current.selectedProjects.has("/project-b")).toBe(true);
      expect(result.current.selectedProjects.has("/project-c")).toBe(true);
    });
  });

  describe("merge dialog", () => {
    const projects = [
      createProject({ path: "/project-a", name: "project-a" }),
      createProject({ path: "/project-b", name: "project-b" }),
      createProject({ path: "/project-c", name: "project-c" }),
    ];

    it("does not open merge dialog with fewer than 2 projects selected", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
      });

      act(() => {
        result.current.handleMergeClick();
      });

      expect(result.current.showMergeDialog).toBe(false);
    });

    it("opens merge dialog when 2+ projects selected", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
      });

      act(() => {
        result.current.handleMergeClick();
      });

      expect(result.current.showMergeDialog).toBe(true);
    });

    it("resets selectedPrimary when opening merge dialog", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
        result.current.setSelectedPrimary("/project-a");
      });

      act(() => {
        result.current.handleMergeClick();
      });

      expect(result.current.selectedPrimary).toBeNull();
    });

    it("allows setting selected primary", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
      });

      act(() => {
        result.current.handleMergeClick();
      });

      act(() => {
        result.current.setSelectedPrimary("/project-a");
      });

      expect(result.current.selectedPrimary).toBe("/project-a");
    });

    it("allows closing merge dialog via setShowMergeDialog", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      // First select projects
      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
      });

      // Then open dialog in separate act to ensure state is updated
      act(() => {
        result.current.handleMergeClick();
      });

      expect(result.current.showMergeDialog).toBe(true);

      act(() => {
        result.current.setShowMergeDialog(false);
      });

      expect(result.current.showMergeDialog).toBe(false);
    });
  });

  describe("handleMergeConfirm", () => {
    const projects = [
      createProject({ path: "/project-a", name: "project-a" }),
      createProject({ path: "/project-b", name: "project-b" }),
      createProject({ path: "/project-c", name: "project-c" }),
    ];

    it("does not call onMerge without selected primary", () => {
      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, onMerge: mockOnMerge })
      );

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
        result.current.handleMergeClick();
      });

      act(() => {
        result.current.handleMergeConfirm();
      });

      expect(mockOnMerge).not.toHaveBeenCalled();
    });

    it("does not call onMerge with fewer than 2 projects", () => {
      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, onMerge: mockOnMerge })
      );

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.setSelectedPrimary("/project-a");
      });

      act(() => {
        result.current.handleMergeConfirm();
      });

      expect(mockOnMerge).not.toHaveBeenCalled();
    });

    it("calls onMerge with source paths (non-primary) and target path (primary)", () => {
      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, onMerge: mockOnMerge })
      );

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
        result.current.toggleProjectSelection("/project-c");
        result.current.handleMergeClick();
        result.current.setSelectedPrimary("/project-a");
      });

      act(() => {
        result.current.handleMergeConfirm();
      });

      expect(mockOnMerge).toHaveBeenCalledTimes(1);
      expect(mockOnMerge).toHaveBeenCalledWith(
        expect.arrayContaining(["/project-b", "/project-c"]),
        "/project-a"
      );
      // Verify primary is not in source paths
      const [sourcePaths] = mockOnMerge.mock.calls[0];
      expect(sourcePaths).not.toContain("/project-a");
    });

    it("resets all merge state after successful merge", () => {
      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, onMerge: mockOnMerge })
      );

      act(() => {
        result.current.enterSelectMode();
        result.current.toggleProjectSelection("/project-a");
        result.current.toggleProjectSelection("/project-b");
        result.current.handleMergeClick();
        result.current.setSelectedPrimary("/project-a");
      });

      act(() => {
        result.current.handleMergeConfirm();
      });

      expect(result.current.selectedProjects.size).toBe(0);
      expect(result.current.showMergeDialog).toBe(false);
      expect(result.current.selectedPrimary).toBeNull();
      expect(result.current.isSelectMode).toBe(false);
    });
  });

  describe("handleRowClick", () => {
    const projects = [
      createProject({ path: "/project-a", name: "project-a" }),
      createProject({ path: "/project-b", name: "project-b" }),
    ];

    it("navigates to project detail page when not in select mode", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.handleRowClick(projects[0]);
      });

      expect(mockPush).toHaveBeenCalledWith(`/projects/${encodeURIComponent("/project-a")}`);
    });

    it("toggles selection when in select mode", () => {
      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      act(() => {
        result.current.enterSelectMode();
      });

      act(() => {
        result.current.handleRowClick(projects[0]);
      });

      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.selectedProjects.has("/project-a")).toBe(true);
    });

    it("encodes project path properly in URL", () => {
      const projectWithSpecialChars = createProject({
        path: "/Users/test/my project/v2",
        name: "my project",
      });
      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects: [projectWithSpecialChars] })
      );

      act(() => {
        result.current.handleRowClick(projectWithSpecialChars);
      });

      expect(mockPush).toHaveBeenCalledWith(
        `/projects/${encodeURIComponent("/Users/test/my project/v2")}`
      );
    });
  });

  describe("data from useProjectsData", () => {
    it("exposes mergedByPrimary from useProjectsData", () => {
      const projects = [
        createProject({ path: "/primary", mergedInto: null }),
        createProject({ path: "/merged", mergedInto: "/primary" }),
      ];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      expect(result.current.mergedByPrimary.get("/primary")).toBeDefined();
      expect(result.current.mergedByPrimary.get("/primary")?.[0].path).toBe("/merged");
    });

    it("exposes filteredProjects from useProjectsData", () => {
      const projects = [
        createProject({ path: "/visible", isHidden: false, mergedInto: null }),
        createProject({ path: "/hidden", isHidden: true, mergedInto: null }),
        createProject({ path: "/merged", isHidden: false, mergedInto: "/visible" }),
      ];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      expect(result.current.filteredProjects).toHaveLength(1);
      expect(result.current.filteredProjects[0].path).toBe("/visible");
    });

    it("exposes groupedProjects from useProjectsData", () => {
      const groups = [createGroup({ id: "work", name: "Work" })];
      const projects = [
        createProject({ path: "/work-project", groupId: "work" }),
        createProject({ path: "/ungrouped", groupId: null }),
      ];

      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, groups })
      );

      expect(result.current.groupedProjects).toHaveLength(2);
    });

    it("exposes getAggregatedProject from useProjectsData", () => {
      const primary = createProject({
        path: "/primary",
        sessionCount: 5,
        totalTime: 1000000,
        messageCount: 50,
        mergedInto: null,
      });
      const merged = createProject({
        path: "/merged",
        sessionCount: 3,
        totalTime: 500000,
        messageCount: 25,
        mergedInto: "/primary",
      });
      const projects = [primary, merged];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      const aggregated = result.current.getAggregatedProject(primary);
      expect(aggregated.sessionCount).toBe(8);
      expect(aggregated.totalTime).toBe(1500000);
      expect(aggregated.messageCount).toBe(75);
    });
  });

  describe("integration with sorting and filtering", () => {
    it("sorted results update when sort field changes", () => {
      const projects = [
        createProject({ path: "/a", name: "a-project", sessionCount: 10 }),
        createProject({ path: "/b", name: "b-project", sessionCount: 5 }),
        createProject({ path: "/c", name: "c-project", sessionCount: 20 }),
      ];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      // Change to sort by name
      act(() => {
        result.current.handleSort("name");
      });

      expect(result.current.sortField).toBe("name");
      expect(result.current.filteredProjects).toBeDefined();
    });

    it("filtered results update when showHidden changes", () => {
      const projects = [
        createProject({ path: "/visible", isHidden: false }),
        createProject({ path: "/hidden", isHidden: true }),
      ];

      const { result } = renderHook(() => useProjectsListState({ ...defaultProps, projects }));

      expect(result.current.filteredProjects).toHaveLength(1);

      act(() => {
        result.current.setShowHidden(true);
      });

      expect(result.current.filteredProjects).toHaveLength(2);
    });
  });

  describe("complete merge workflow", () => {
    it("handles full merge workflow: enter select mode -> select projects -> open dialog -> select primary -> confirm", () => {
      const projects = [
        createProject({ path: "/project-a", name: "project-a" }),
        createProject({ path: "/project-b", name: "project-b" }),
        createProject({ path: "/project-c", name: "project-c" }),
      ];

      const { result } = renderHook(() =>
        useProjectsListState({ ...defaultProps, projects, onMerge: mockOnMerge })
      );

      // Step 1: Enter select mode
      act(() => {
        result.current.enterSelectMode();
      });
      expect(result.current.isSelectMode).toBe(true);

      // Step 2: Select projects using row clicks
      act(() => {
        result.current.handleRowClick(projects[0]);
        result.current.handleRowClick(projects[1]);
      });
      expect(result.current.selectedProjects.size).toBe(2);

      // Step 3: Open merge dialog
      act(() => {
        result.current.handleMergeClick();
      });
      expect(result.current.showMergeDialog).toBe(true);

      // Step 4: Select primary project
      act(() => {
        result.current.setSelectedPrimary("/project-a");
      });
      expect(result.current.selectedPrimary).toBe("/project-a");

      // Step 5: Confirm merge
      act(() => {
        result.current.handleMergeConfirm();
      });

      // Verify merge was called correctly
      expect(mockOnMerge).toHaveBeenCalledWith(["/project-b"], "/project-a");

      // Verify all state is reset
      expect(result.current.isSelectMode).toBe(false);
      expect(result.current.selectedProjects.size).toBe(0);
      expect(result.current.showMergeDialog).toBe(false);
      expect(result.current.selectedPrimary).toBeNull();
    });
  });
});

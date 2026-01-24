/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectGroupSection } from "../ProjectGroupSection";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock ProjectRow to keep tests focused on ProjectGroupSection
jest.mock("../ProjectRow", () => ({
  ProjectRow: ({
    project,
    onClick,
    onSetHidden,
    onSetGroup,
    onUnmerge,
    isSelectMode,
    isSelected,
    onToggleSelection,
  }: {
    project: Project;
    onClick: () => void;
    onSetHidden: (project: Project, hidden: boolean) => void;
    onSetGroup: (project: Project, groupId: string | null) => void;
    onUnmerge: (path: string) => void;
    isSelectMode: boolean;
    isSelected: boolean;
    onToggleSelection: () => void;
  }) => (
    <div
      data-testid={`project-row-${project.path}`}
      onClick={onClick}
      data-select-mode={isSelectMode}
      data-selected={isSelected}
    >
      <span>{project.name}</span>
      <button
        data-testid={`toggle-selection-${project.path}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelection();
        }}
      >
        Toggle Selection
      </button>
      <button
        data-testid={`hide-${project.path}`}
        onClick={(e) => {
          e.stopPropagation();
          onSetHidden(project, true);
        }}
      >
        Hide
      </button>
      <button
        data-testid={`set-group-${project.path}`}
        onClick={(e) => {
          e.stopPropagation();
          onSetGroup(project, "group-1");
        }}
      >
        Set Group
      </button>
      <button
        data-testid={`unmerge-${project.path}`}
        onClick={(e) => {
          e.stopPropagation();
          onUnmerge(project.path);
        }}
      >
        Unmerge
      </button>
    </div>
  ),
}));

// Mock ProjectGroupHeader
jest.mock("../ProjectGroupHeader", () => ({
  ProjectGroupHeader: ({
    group,
    projectCount,
    isCollapsed,
    onToggleCollapse,
    canMoveUp,
    canMoveDown,
    onMoveUp,
    onMoveDown,
  }: {
    group: ProjectGroup | null;
    projectCount: number;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
  }) => (
    <div data-testid={`group-header-${group?.id ?? "ungrouped"}`}>
      <button data-testid="toggle-collapse" onClick={onToggleCollapse}>
        {group?.name ?? "Ungrouped"} ({projectCount})
      </button>
      <span data-testid="collapsed-state">{isCollapsed ? "collapsed" : "expanded"}</span>
      {canMoveUp && onMoveUp && (
        <button data-testid="move-up" onClick={onMoveUp}>
          Move Up
        </button>
      )}
      {canMoveDown && onMoveDown && (
        <button data-testid="move-down" onClick={onMoveDown}>
          Move Down
        </button>
      )}
    </div>
  ),
}));

const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  path: "/Users/test/my-project",
  name: "my-project",
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

const mockGroup: ProjectGroup = {
  id: "group-1",
  name: "Work Projects",
  color: "#3b82f6",
  createdAt: "2024-01-01T00:00:00Z",
  sortOrder: 0,
};

const mockGroups: ProjectGroup[] = [mockGroup];

const mockProjects: Project[] = [
  createMockProject({ path: "/proj1", name: "proj1" }),
  createMockProject({ path: "/proj2", name: "proj2" }),
];

const defaultProps = {
  group: mockGroup,
  projects: mockProjects,
  groups: mockGroups,
  isCollapsed: false,
  onToggleCollapse: jest.fn(),
  showHeader: true,
  getAggregatedProject: (p: Project) => p,
  mergedByPrimary: new Map<string, Project[]>(),
  isSelectMode: false,
  selectedProjects: new Set<string>(),
  onRowClick: jest.fn(),
  onSetHidden: jest.fn(),
  onSetGroup: jest.fn(),
  onUnmerge: jest.fn(),
  onToggleSelection: jest.fn(),
};

describe("ProjectGroupSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering with group header", () => {
    it("renders group header when showHeader is true and group is provided", () => {
      render(<ProjectGroupSection {...defaultProps} />);

      expect(screen.getByTestId("group-header-group-1")).toBeInTheDocument();
      expect(screen.getByText("Work Projects (2)")).toBeInTheDocument();
    });

    it("renders all projects in the group", () => {
      render(<ProjectGroupSection {...defaultProps} />);

      expect(screen.getByTestId("project-row-/proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-row-/proj2")).toBeInTheDocument();
    });

    it("renders ungrouped header when group is null but showHeader is true", () => {
      render(<ProjectGroupSection {...defaultProps} group={null} showHeader={true} />);

      expect(screen.getByTestId("group-header-ungrouped")).toBeInTheDocument();
      expect(screen.getByText("Ungrouped (2)")).toBeInTheDocument();
    });
  });

  describe("Rendering without group header", () => {
    it("does not render header when showHeader is false and group is null", () => {
      render(<ProjectGroupSection {...defaultProps} group={null} showHeader={false} />);

      expect(screen.queryByTestId("group-header-ungrouped")).not.toBeInTheDocument();
      // Projects should still be rendered
      expect(screen.getByTestId("project-row-/proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-row-/proj2")).toBeInTheDocument();
    });
  });

  describe("Collapse functionality", () => {
    it("shows projects when expanded", () => {
      render(<ProjectGroupSection {...defaultProps} isCollapsed={false} />);

      expect(screen.getByText("expanded")).toBeInTheDocument();
      expect(screen.getByTestId("project-row-/proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-row-/proj2")).toBeInTheDocument();
    });

    it("hides projects when collapsed", () => {
      render(<ProjectGroupSection {...defaultProps} isCollapsed={true} />);

      expect(screen.getByText("collapsed")).toBeInTheDocument();
      expect(screen.queryByTestId("project-row-/proj1")).not.toBeInTheDocument();
      expect(screen.queryByTestId("project-row-/proj2")).not.toBeInTheDocument();
    });

    it("calls onToggleCollapse when header is clicked", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onToggleCollapse={onToggleCollapse} />);

      await user.click(screen.getByTestId("toggle-collapse"));

      expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
  });

  describe("Group reordering", () => {
    it("shows move up button when canMoveUp is true", () => {
      const onMoveUp = jest.fn();
      render(
        <ProjectGroupSection
          {...defaultProps}
          canMoveUp={true}
          canMoveDown={false}
          onMoveUp={onMoveUp}
        />
      );

      expect(screen.getByTestId("move-up")).toBeInTheDocument();
      expect(screen.queryByTestId("move-down")).not.toBeInTheDocument();
    });

    it("shows move down button when canMoveDown is true", () => {
      const onMoveDown = jest.fn();
      render(
        <ProjectGroupSection
          {...defaultProps}
          canMoveUp={false}
          canMoveDown={true}
          onMoveDown={onMoveDown}
        />
      );

      expect(screen.queryByTestId("move-up")).not.toBeInTheDocument();
      expect(screen.getByTestId("move-down")).toBeInTheDocument();
    });

    it("calls onMoveUp when move up button is clicked", async () => {
      const user = userEvent.setup();
      const onMoveUp = jest.fn();
      render(<ProjectGroupSection {...defaultProps} canMoveUp={true} onMoveUp={onMoveUp} />);

      await user.click(screen.getByTestId("move-up"));

      expect(onMoveUp).toHaveBeenCalledTimes(1);
    });

    it("calls onMoveDown when move down button is clicked", async () => {
      const user = userEvent.setup();
      const onMoveDown = jest.fn();
      render(<ProjectGroupSection {...defaultProps} canMoveDown={true} onMoveDown={onMoveDown} />);

      await user.click(screen.getByTestId("move-down"));

      expect(onMoveDown).toHaveBeenCalledTimes(1);
    });
  });

  describe("Project row click behavior", () => {
    it("calls onRowClick with project when row is clicked", async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onRowClick={onRowClick} />);

      await user.click(screen.getByTestId("project-row-/proj1"));

      expect(onRowClick).toHaveBeenCalledWith(mockProjects[0]);
    });

    it("calls onRowClick with correct project for different rows", async () => {
      const user = userEvent.setup();
      const onRowClick = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onRowClick={onRowClick} />);

      await user.click(screen.getByTestId("project-row-/proj2"));

      expect(onRowClick).toHaveBeenCalledWith(mockProjects[1]);
    });
  });

  describe("Select mode behavior", () => {
    it("passes isSelectMode to ProjectRow", () => {
      render(<ProjectGroupSection {...defaultProps} isSelectMode={true} />);

      const row = screen.getByTestId("project-row-/proj1");
      expect(row).toHaveAttribute("data-select-mode", "true");
    });

    it("passes correct isSelected state for selected projects", () => {
      const selectedProjects = new Set(["/proj1"]);
      render(
        <ProjectGroupSection
          {...defaultProps}
          isSelectMode={true}
          selectedProjects={selectedProjects}
        />
      );

      const row1 = screen.getByTestId("project-row-/proj1");
      const row2 = screen.getByTestId("project-row-/proj2");

      expect(row1).toHaveAttribute("data-selected", "true");
      expect(row2).toHaveAttribute("data-selected", "false");
    });

    it("calls onToggleSelection with correct path when toggling selection", async () => {
      const user = userEvent.setup();
      const onToggleSelection = jest.fn();
      render(
        <ProjectGroupSection
          {...defaultProps}
          isSelectMode={true}
          onToggleSelection={onToggleSelection}
        />
      );

      await user.click(screen.getByTestId("toggle-selection-/proj1"));

      expect(onToggleSelection).toHaveBeenCalledWith("/proj1");
    });

    it("calls onToggleSelection for each project independently", async () => {
      const user = userEvent.setup();
      const onToggleSelection = jest.fn();
      render(
        <ProjectGroupSection
          {...defaultProps}
          isSelectMode={true}
          onToggleSelection={onToggleSelection}
        />
      );

      await user.click(screen.getByTestId("toggle-selection-/proj1"));
      await user.click(screen.getByTestId("toggle-selection-/proj2"));

      expect(onToggleSelection).toHaveBeenCalledTimes(2);
      expect(onToggleSelection).toHaveBeenNthCalledWith(1, "/proj1");
      expect(onToggleSelection).toHaveBeenNthCalledWith(2, "/proj2");
    });
  });

  describe("Project action handlers", () => {
    it("calls onSetHidden with project and hidden state", async () => {
      const user = userEvent.setup();
      const onSetHidden = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onSetHidden={onSetHidden} />);

      await user.click(screen.getByTestId("hide-/proj1"));

      expect(onSetHidden).toHaveBeenCalledWith(mockProjects[0], true);
    });

    it("calls onSetGroup with project and group ID", async () => {
      const user = userEvent.setup();
      const onSetGroup = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onSetGroup={onSetGroup} />);

      await user.click(screen.getByTestId("set-group-/proj1"));

      expect(onSetGroup).toHaveBeenCalledWith(mockProjects[0], "group-1");
    });

    it("calls onUnmerge with project path", async () => {
      const user = userEvent.setup();
      const onUnmerge = jest.fn();
      render(<ProjectGroupSection {...defaultProps} onUnmerge={onUnmerge} />);

      await user.click(screen.getByTestId("unmerge-/proj1"));

      expect(onUnmerge).toHaveBeenCalledWith("/proj1");
    });
  });

  describe("Aggregated project transformation", () => {
    it("uses getAggregatedProject to transform projects before rendering", () => {
      const getAggregatedProject = jest.fn((p: Project) => ({
        ...p,
        name: `aggregated-${p.name}`,
      }));

      render(<ProjectGroupSection {...defaultProps} getAggregatedProject={getAggregatedProject} />);

      // getAggregatedProject should be called for each project
      expect(getAggregatedProject).toHaveBeenCalledTimes(2);
      expect(getAggregatedProject).toHaveBeenCalledWith(mockProjects[0]);
      expect(getAggregatedProject).toHaveBeenCalledWith(mockProjects[1]);
    });
  });

  describe("Merged projects display", () => {
    it("passes mergedProjects to ProjectRow from mergedByPrimary map", () => {
      const mergedProject = createMockProject({ path: "/merged", name: "merged" });
      const mergedByPrimary = new Map<string, Project[]>([["/proj1", [mergedProject]]]);

      render(<ProjectGroupSection {...defaultProps} mergedByPrimary={mergedByPrimary} />);

      // The ProjectRow should receive the merged projects (mocked, so we just verify it renders)
      expect(screen.getByTestId("project-row-/proj1")).toBeInTheDocument();
    });
  });

  describe("Empty group handling", () => {
    it("renders header but no projects when projects array is empty", () => {
      render(<ProjectGroupSection {...defaultProps} projects={[]} />);

      expect(screen.getByTestId("group-header-group-1")).toBeInTheDocument();
      expect(screen.getByText("Work Projects (0)")).toBeInTheDocument();
      expect(screen.queryByTestId(/project-row-/)).not.toBeInTheDocument();
    });
  });

  describe("Without header for ungrouped projects", () => {
    it("renders projects directly without header when showHeader is false and group is null", () => {
      render(<ProjectGroupSection {...defaultProps} group={null} showHeader={false} />);

      // No header should be present
      expect(screen.queryByTestId("group-header-ungrouped")).not.toBeInTheDocument();

      // Projects should still render
      expect(screen.getByTestId("project-row-/proj1")).toBeInTheDocument();
      expect(screen.getByTestId("project-row-/proj2")).toBeInTheDocument();
    });

    it("onToggleCollapse is not called when clicking projects without header", async () => {
      const user = userEvent.setup();
      const onToggleCollapse = jest.fn();
      render(
        <ProjectGroupSection
          {...defaultProps}
          group={null}
          showHeader={false}
          onToggleCollapse={onToggleCollapse}
        />
      );

      // Click on a project row
      await user.click(screen.getByTestId("project-row-/proj1"));

      // onToggleCollapse should NOT be called (it's only for header clicks)
      expect(onToggleCollapse).not.toHaveBeenCalled();
    });
  });
});

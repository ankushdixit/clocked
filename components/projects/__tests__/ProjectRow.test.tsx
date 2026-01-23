/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { ProjectRow } from "../ProjectRow";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock child components to keep tests focused on ProjectRow
jest.mock("../ProjectRowStats", () => ({
  ProjectRowStats: ({ project }: { project: Project }) => (
    <div data-testid="project-row-stats">{project.name} stats</div>
  ),
}));

jest.mock("../ProjectRowActionMenu", () => ({
  ProjectRowActionMenu: () => <div data-testid="project-row-action-menu">Action Menu</div>,
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

const mockGroups: ProjectGroup[] = [];

const defaultProps = {
  project: createMockProject(),
  groups: mockGroups,
  onClick: jest.fn(),
  onSetHidden: jest.fn(),
  onSetGroup: jest.fn(),
  onUnmerge: jest.fn(),
  isSelectMode: false,
  isSelected: false,
  onToggleSelection: jest.fn(),
};

describe("ProjectRow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering project information", () => {
    it("displays the project name", () => {
      render(<ProjectRow {...defaultProps} />);

      expect(screen.getByText("my-project")).toBeInTheDocument();
    });

    it("displays the project path", () => {
      render(<ProjectRow {...defaultProps} />);

      expect(screen.getByText("/Users/test/my-project")).toBeInTheDocument();
    });

    it("renders the stats component", () => {
      render(<ProjectRow {...defaultProps} />);

      expect(screen.getByTestId("project-row-stats")).toBeInTheDocument();
    });

    it("renders the action menu", () => {
      render(<ProjectRow {...defaultProps} />);

      expect(screen.getByTestId("project-row-action-menu")).toBeInTheDocument();
    });

    it("sets the correct data-testid based on project path", () => {
      render(<ProjectRow {...defaultProps} />);

      expect(screen.getByTestId("project-row-/Users/test/my-project")).toBeInTheDocument();
    });
  });

  describe("Selection checkbox behavior", () => {
    it("does not show checkbox when select mode is disabled", () => {
      render(<ProjectRow {...defaultProps} isSelectMode={false} />);

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("shows checkbox when select mode is enabled", () => {
      render(<ProjectRow {...defaultProps} isSelectMode={true} />);

      expect(screen.getByRole("checkbox")).toBeInTheDocument();
    });

    it("checkbox has correct aria-label for accessibility", () => {
      const project = createMockProject({ name: "test-project" });
      render(<ProjectRow {...defaultProps} project={project} isSelectMode={true} />);

      expect(screen.getByRole("checkbox")).toHaveAttribute("aria-label", "Select test-project");
    });

    it("checkbox is unchecked when project is not selected", () => {
      render(<ProjectRow {...defaultProps} isSelectMode={true} isSelected={false} />);

      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("checkbox is checked when project is selected", () => {
      render(<ProjectRow {...defaultProps} isSelectMode={true} isSelected={true} />);

      expect(screen.getByRole("checkbox")).toBeChecked();
    });

    it("calls onToggleSelection when checkbox container is clicked", () => {
      const onToggleSelection = jest.fn();
      render(
        <ProjectRow {...defaultProps} isSelectMode={true} onToggleSelection={onToggleSelection} />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox.parentElement!);

      expect(onToggleSelection).toHaveBeenCalledTimes(1);
    });

    it("clicking checkbox does not trigger row onClick", () => {
      const onClick = jest.fn();
      const onToggleSelection = jest.fn();
      render(
        <ProjectRow
          {...defaultProps}
          onClick={onClick}
          isSelectMode={true}
          onToggleSelection={onToggleSelection}
        />
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox.parentElement!);

      expect(onToggleSelection).toHaveBeenCalled();
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Click behavior", () => {
    it("calls onClick when the row is clicked", () => {
      const onClick = jest.fn();
      render(<ProjectRow {...defaultProps} onClick={onClick} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      fireEvent.click(row);

      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe("Merged projects badge", () => {
    it("does not show merged badge when project has no merged projects", () => {
      render(<ProjectRow {...defaultProps} mergedProjects={undefined} />);

      expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
    });

    it("does not show merged badge when mergedProjects is empty array", () => {
      render(<ProjectRow {...defaultProps} mergedProjects={[]} />);

      // The badge shows a number, so we check there's no number badge displayed
      const row = screen.getByTestId("project-row-/Users/test/my-project");
      const badges = row.querySelectorAll(".inline-flex.items-center.gap-1");
      expect(badges).toHaveLength(0);
    });

    it("shows merged badge with count when project has merged projects", () => {
      const mergedProjects: Project[] = [
        createMockProject({ path: "/Users/test/merged-1", name: "merged-1" }),
        createMockProject({ path: "/Users/test/merged-2", name: "merged-2" }),
      ];
      render(<ProjectRow {...defaultProps} mergedProjects={mergedProjects} />);

      expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("shows merged badge with single count when one project is merged", () => {
      const mergedProjects: Project[] = [
        createMockProject({ path: "/Users/test/merged-1", name: "merged-1" }),
      ];
      render(<ProjectRow {...defaultProps} mergedProjects={mergedProjects} />);

      expect(screen.getByText("1")).toBeInTheDocument();
    });
  });

  describe("Hidden project styling", () => {
    it("applies reduced opacity when project is hidden", () => {
      const project = createMockProject({ isHidden: true });
      render(<ProjectRow {...defaultProps} project={project} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("opacity-60");
    });

    it("does not apply reduced opacity when project is visible", () => {
      const project = createMockProject({ isHidden: false });
      render(<ProjectRow {...defaultProps} project={project} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).not.toHaveClass("opacity-60");
    });
  });

  describe("Selected state styling", () => {
    it("applies default selected styling when selected without accent color", () => {
      render(<ProjectRow {...defaultProps} isSelected={true} accentColor={undefined} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("bg-primary/5");
      expect(row).toHaveClass("ring-1");
      expect(row).toHaveClass("ring-primary");
    });

    it("does not apply selected styling when not selected", () => {
      render(<ProjectRow {...defaultProps} isSelected={false} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).not.toHaveClass("bg-primary/5");
      expect(row).not.toHaveClass("ring-1");
      expect(row).not.toHaveClass("ring-primary");
    });
  });

  describe("Accent color styling", () => {
    it("applies custom background and box-shadow when selected with accent color", () => {
      const accentColor = "#ff5733";
      render(<ProjectRow {...defaultProps} isSelected={true} accentColor={accentColor} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveStyle({
        backgroundColor: "#ff573310",
        boxShadow: "inset 0 0 0 1px #ff5733",
      });
    });

    it("does not apply custom styling when selected but accent color is null", () => {
      render(<ProjectRow {...defaultProps} isSelected={true} accentColor={null} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("bg-primary/5");
    });

    it("does not apply custom accent styling when not selected", () => {
      const accentColor = "#ff5733";
      render(<ProjectRow {...defaultProps} isSelected={false} accentColor={accentColor} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).not.toHaveStyle({
        backgroundColor: "#ff573310",
      });
    });

    it("applies accent color border on hover indicator", () => {
      const accentColor = "#3b82f6";
      render(<ProjectRow {...defaultProps} accentColor={accentColor} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      const hoverIndicator = row.querySelector(".absolute.left-0");
      expect(hoverIndicator).toHaveStyle({ backgroundColor: "#3b82f6" });
    });

    it("uses default primary color for hover indicator when no accent color", () => {
      render(<ProjectRow {...defaultProps} accentColor={undefined} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      const hoverIndicator = row.querySelector(".absolute.left-0");
      expect(hoverIndicator).toHaveStyle({ backgroundColor: "var(--color-primary)" });
    });

    it("applies accent color to checkbox when in select mode with accent color", () => {
      const accentColor = "#ff5733";
      render(<ProjectRow {...defaultProps} isSelectMode={true} accentColor={accentColor} />);

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toHaveStyle({ color: "#ff5733", borderColor: "#ff5733" });
    });
  });

  describe("Row styling and interaction", () => {
    it("has cursor-pointer class for click interaction", () => {
      render(<ProjectRow {...defaultProps} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("cursor-pointer");
    });

    it("has group class for hover interactions", () => {
      render(<ProjectRow {...defaultProps} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("group");
    });

    it("has transition classes for smooth hover effects", () => {
      render(<ProjectRow {...defaultProps} />);

      const row = screen.getByTestId("project-row-/Users/test/my-project");
      expect(row).toHaveClass("transition-all");
    });
  });
});

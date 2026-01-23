/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectRowActionMenu } from "../ProjectRowActionMenu";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock ResizeObserver for Radix UI components
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock scrollIntoView for Radix UI dropdown positioning
Element.prototype.scrollIntoView = jest.fn();

const createProject = (overrides: Partial<Project> = {}): Project => ({
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

const createGroup = (overrides: Partial<ProjectGroup> = {}): ProjectGroup => ({
  id: "group-1",
  name: "Work Projects",
  color: "#3b82f6",
  createdAt: "2024-01-01T00:00:00Z",
  sortOrder: 0,
  ...overrides,
});

const defaultHandlers = {
  onSetHidden: jest.fn(),
  onSetGroup: jest.fn(),
  onUnmerge: jest.fn(),
};

const renderMenu = (
  project: Project = createProject(),
  groups: ProjectGroup[] = [],
  mergedProjects?: Project[],
  handlers = defaultHandlers
) => {
  return render(
    <ProjectRowActionMenu
      project={project}
      groups={groups}
      mergedProjects={mergedProjects}
      onSetHidden={handlers.onSetHidden}
      onSetGroup={handlers.onSetGroup}
      onUnmerge={handlers.onUnmerge}
    />
  );
};

describe("ProjectRowActionMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Menu button rendering", () => {
    it("renders the menu trigger button", () => {
      renderMenu();

      const button = screen.getByRole("button", { name: /open menu/i });
      expect(button).toBeInTheDocument();
    });

    it("has MoreHorizontal icon inside the button", () => {
      renderMenu();

      const button = screen.getByRole("button", { name: /open menu/i });
      expect(button.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Opening the dropdown menu", () => {
    it("shows menu options when clicking the trigger button", async () => {
      const user = userEvent.setup();
      renderMenu();

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
        expect(screen.getByText("Hide project")).toBeInTheDocument();
      });
    });
  });

  describe("Hide/Show project option", () => {
    it("shows 'Hide project' option when project is not hidden", async () => {
      const user = userEvent.setup();
      const project = createProject({ isHidden: false });
      renderMenu(project);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Hide project")).toBeInTheDocument();
      });
      expect(screen.queryByText("Show project")).not.toBeInTheDocument();
    });

    it("shows 'Show project' option when project is hidden", async () => {
      const user = userEvent.setup();
      const project = createProject({ isHidden: true });
      renderMenu(project);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Show project")).toBeInTheDocument();
      });
      expect(screen.queryByText("Hide project")).not.toBeInTheDocument();
    });

    it("calls onSetHidden with project and true when clicking 'Hide project'", async () => {
      const user = userEvent.setup();
      const project = createProject({ isHidden: false });
      const handlers = {
        onSetHidden: jest.fn(),
        onSetGroup: jest.fn(),
        onUnmerge: jest.fn(),
      };
      renderMenu(project, [], undefined, handlers);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Hide project")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Hide project"));

      expect(handlers.onSetHidden).toHaveBeenCalledWith(project, true);
      expect(handlers.onSetHidden).toHaveBeenCalledTimes(1);
    });

    it("calls onSetHidden with project and false when clicking 'Show project'", async () => {
      const user = userEvent.setup();
      const project = createProject({ isHidden: true });
      const handlers = {
        onSetHidden: jest.fn(),
        onSetGroup: jest.fn(),
        onUnmerge: jest.fn(),
      };
      renderMenu(project, [], undefined, handlers);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Show project")).toBeInTheDocument();
      });

      await user.click(screen.getByText("Show project"));

      expect(handlers.onSetHidden).toHaveBeenCalledWith(project, false);
      expect(handlers.onSetHidden).toHaveBeenCalledTimes(1);
    });
  });

  describe("Move to group submenu", () => {
    it("shows 'Move to group' submenu trigger", async () => {
      const user = userEvent.setup();
      renderMenu();

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });
    });

    it("shows available groups when hovering 'Move to group'", async () => {
      const user = userEvent.setup();
      const groups = [
        createGroup({ id: "group-1", name: "Work Projects", color: "#3b82f6" }),
        createGroup({ id: "group-2", name: "Personal Projects", color: "#10b981" }),
      ];
      renderMenu(createProject(), groups);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      // Hover over the submenu trigger to open it
      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        expect(screen.getByText("Work Projects")).toBeInTheDocument();
        expect(screen.getByText("Personal Projects")).toBeInTheDocument();
      });
    });

    it("shows 'No groups available' when there are no groups", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), []);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        expect(screen.getByText("No groups available")).toBeInTheDocument();
      });
    });

    it("calls onSetGroup with project and groupId when selecting a group", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const project = createProject();
      const groups = [createGroup({ id: "group-1", name: "Work Projects" })];
      const handlers = {
        onSetHidden: jest.fn(),
        onSetGroup: jest.fn(),
        onUnmerge: jest.fn(),
      };
      renderMenu(project, groups, undefined, handlers);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      // Open the submenu by clicking on the trigger
      const moveToGroupTrigger = screen.getByText("Move to group");
      await user.click(moveToGroupTrigger);

      await waitFor(() => {
        expect(screen.getByText("Work Projects")).toBeInTheDocument();
      });

      // Use pointer instead of click for Radix menu items
      const groupItem = screen.getByText("Work Projects");
      await user.pointer({ keys: "[MouseLeft]", target: groupItem });

      await waitFor(() => {
        expect(handlers.onSetGroup).toHaveBeenCalledWith(project, "group-1");
      });
      expect(handlers.onSetGroup).toHaveBeenCalledTimes(1);
    });

    it("disables the current group in the group list", async () => {
      const user = userEvent.setup();
      const project = createProject({ groupId: "group-1" });
      const groups = [
        createGroup({ id: "group-1", name: "Current Group" }),
        createGroup({ id: "group-2", name: "Other Group" }),
      ];
      renderMenu(project, groups);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        expect(screen.getByText("Current Group")).toBeInTheDocument();
      });

      // The current group should be disabled
      const currentGroupItem = screen.getByText("Current Group").closest('[role="menuitem"]');
      expect(currentGroupItem).toHaveAttribute("data-disabled");
    });

    it("displays group color indicator when group has a color", async () => {
      const user = userEvent.setup();
      const groups = [createGroup({ id: "group-1", name: "Colored Group", color: "#ff0000" })];
      renderMenu(createProject(), groups);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        const groupItem = screen.getByText("Colored Group").closest('[role="menuitem"]');
        expect(groupItem).toBeInTheDocument();
        const colorIndicator = groupItem?.querySelector('div[style*="background-color"]');
        expect(colorIndicator).toBeInTheDocument();
      });
    });
  });

  describe("Remove from group option", () => {
    it("shows 'Remove from group' option when project has a group", async () => {
      const user = userEvent.setup();
      const project = createProject({ groupId: "group-1" });
      const groups = [createGroup({ id: "group-1", name: "Work Projects" })];
      renderMenu(project, groups);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        expect(screen.getByText("Remove from group")).toBeInTheDocument();
      });
    });

    it("does not show 'Remove from group' option when project has no group", async () => {
      const user = userEvent.setup();
      const project = createProject({ groupId: null });
      const groups = [createGroup()];
      renderMenu(project, groups);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      await user.hover(screen.getByText("Move to group"));

      await waitFor(() => {
        // Wait for submenu to open
        expect(screen.getByText("Work Projects")).toBeInTheDocument();
      });

      expect(screen.queryByText("Remove from group")).not.toBeInTheDocument();
    });

    it("calls onSetGroup with project and null when clicking 'Remove from group'", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const project = createProject({ groupId: "group-1" });
      const groups = [createGroup({ id: "group-1", name: "Work Projects" })];
      const handlers = {
        onSetHidden: jest.fn(),
        onSetGroup: jest.fn(),
        onUnmerge: jest.fn(),
      };
      renderMenu(project, groups, undefined, handlers);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      // Click the submenu trigger to open it
      await user.click(screen.getByText("Move to group"));

      await waitFor(() => {
        expect(screen.getByText("Remove from group")).toBeInTheDocument();
      });

      // Use pointer for Radix menu items
      const removeItem = screen.getByText("Remove from group");
      await user.pointer({ keys: "[MouseLeft]", target: removeItem });

      await waitFor(() => {
        expect(handlers.onSetGroup).toHaveBeenCalledWith(project, null);
      });
      expect(handlers.onSetGroup).toHaveBeenCalledTimes(1);
    });
  });

  describe("Merged directories submenu", () => {
    const mergedProjects = [
      createProject({
        path: "/Users/test/merged-1",
        name: "merged-project-1",
        mergedInto: "/Users/test/my-project",
      }),
      createProject({
        path: "/Users/test/merged-2",
        name: "merged-project-2",
        mergedInto: "/Users/test/my-project",
      }),
    ];

    it("shows 'Merged directories' submenu when project has merged projects", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), [], mergedProjects);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Merged directories/)).toBeInTheDocument();
        expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
      });
    });

    it("does not show 'Merged directories' submenu when project has no merged projects", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), [], undefined);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Merged directories/)).not.toBeInTheDocument();
    });

    it("does not show 'Merged directories' submenu when mergedProjects array is empty", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), [], []);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText("Move to group")).toBeInTheDocument();
      });

      expect(screen.queryByText(/Merged directories/)).not.toBeInTheDocument();
    });

    it("shows merged project names when hovering 'Merged directories'", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), [], mergedProjects);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Merged directories/)).toBeInTheDocument();
      });

      await user.hover(screen.getByText(/Merged directories/));

      await waitFor(() => {
        expect(screen.getByText("merged-project-1")).toBeInTheDocument();
        expect(screen.getByText("merged-project-2")).toBeInTheDocument();
      });
    });

    it("calls onUnmerge with correct path when clicking on a merged project", async () => {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      const handlers = {
        onSetHidden: jest.fn(),
        onSetGroup: jest.fn(),
        onUnmerge: jest.fn(),
      };
      renderMenu(createProject(), [], mergedProjects, handlers);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Merged directories/)).toBeInTheDocument();
      });

      // Click the submenu trigger to open it
      await user.click(screen.getByText(/Merged directories/));

      await waitFor(() => {
        expect(screen.getByText("merged-project-1")).toBeInTheDocument();
      });

      // Use pointer for Radix menu items
      const mergedItem = screen.getByText("merged-project-1");
      await user.pointer({ keys: "[MouseLeft]", target: mergedItem });

      await waitFor(() => {
        expect(handlers.onUnmerge).toHaveBeenCalledWith("/Users/test/merged-1");
      });
      expect(handlers.onUnmerge).toHaveBeenCalledTimes(1);
    });

    it("shows unlink icon next to merged project names", async () => {
      const user = userEvent.setup();
      renderMenu(createProject(), [], mergedProjects);

      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/Merged directories/)).toBeInTheDocument();
      });

      await user.hover(screen.getByText(/Merged directories/));

      await waitFor(() => {
        const mergedItem = screen.getByText("merged-project-1").closest('[role="menuitem"]');
        expect(mergedItem).toBeInTheDocument();
        // Should have an SVG icon (Unlink)
        expect(mergedItem?.querySelector("svg")).toBeInTheDocument();
      });
    });
  });

  describe("Event propagation", () => {
    it("stops click propagation on the container", async () => {
      const user = userEvent.setup();
      const parentClickHandler = jest.fn();
      render(
        <div onClick={parentClickHandler} data-testid="parent">
          <ProjectRowActionMenu
            project={createProject()}
            groups={[]}
            onSetHidden={jest.fn()}
            onSetGroup={jest.fn()}
            onUnmerge={jest.fn()}
          />
        </div>
      );

      // Click on the menu trigger button - this should not propagate to the parent
      const button = screen.getByRole("button", { name: /open menu/i });
      await user.click(button);

      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });
});

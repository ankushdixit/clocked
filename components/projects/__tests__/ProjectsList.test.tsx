/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectsList } from "../ProjectsList";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockProjects: Project[] = [
  {
    path: "/Users/test/project-a",
    name: "project-a",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-10T15:30:00Z",
    sessionCount: 3,
    messageCount: 50,
    totalTime: 1800000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
  {
    path: "/Users/test/project-b",
    name: "project-b",
    firstActivity: "2024-01-05T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 10,
    messageCount: 200,
    totalTime: 7200000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
  {
    path: "/Users/test/project-c",
    name: "project-c",
    firstActivity: "2024-01-08T10:00:00Z",
    lastActivity: "2024-01-12T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  },
];

const mockGroups: ProjectGroup[] = [];

const mockHandlers = {
  onSetHidden: jest.fn(),
  onSetGroup: jest.fn(),
  onMerge: jest.fn(),
  onUnmerge: jest.fn(),
};

const renderProjectsList = (
  projects: Project[] = mockProjects,
  groups: ProjectGroup[] = mockGroups
) => {
  return render(
    <ProjectsList
      projects={projects}
      groups={groups}
      onSetHidden={mockHandlers.onSetHidden}
      onSetGroup={mockHandlers.onSetGroup}
      onMerge={mockHandlers.onMerge}
      onUnmerge={mockHandlers.onUnmerge}
    />
  );
};

describe("ProjectsList", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockHandlers.onSetHidden.mockClear();
    mockHandlers.onSetGroup.mockClear();
    mockHandlers.onMerge.mockClear();
    mockHandlers.onUnmerge.mockClear();
  });

  it("renders all projects", () => {
    renderProjectsList();

    expect(screen.getByText("project-a")).toBeInTheDocument();
    expect(screen.getByText("project-b")).toBeInTheDocument();
    expect(screen.getByText("project-c")).toBeInTheDocument();
  });

  it("renders project cards with stats", () => {
    renderProjectsList();

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("has sort dropdown", () => {
    renderProjectsList();

    expect(screen.getByRole("button", { name: /sort by/i })).toBeInTheDocument();
  });

  it("has merge projects button", () => {
    renderProjectsList();

    expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
  });

  it("navigates to project detail page when clicking project card", () => {
    renderProjectsList();

    const projectCard = screen.getByText("project-a").closest("[data-testid]");
    fireEvent.click(projectCard!);

    const expectedPath = "/projects/" + encodeURIComponent("/Users/test/project-a");
    expect(mockPush).toHaveBeenCalledWith(expectedPath);
  });

  it("shows empty state when no projects", () => {
    renderProjectsList([]);

    expect(screen.getByText("No projects found")).toBeInTheDocument();
  });

  it("filters hidden projects by default", () => {
    const projectsWithHidden = [
      ...mockProjects,
      {
        path: "/Users/test/hidden-project",
        name: "hidden-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-20T15:30:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 600000,
        isHidden: true,
        groupId: null,
        mergedInto: null,
      },
    ];

    renderProjectsList(projectsWithHidden);

    expect(screen.queryByText("hidden-project")).not.toBeInTheDocument();
  });

  it("shows toggle for hidden projects when some exist", () => {
    const projectsWithHidden = [
      ...mockProjects,
      {
        path: "/Users/test/hidden-project",
        name: "hidden-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-20T15:30:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 600000,
        isHidden: true,
        groupId: null,
        mergedInto: null,
      },
    ];

    renderProjectsList(projectsWithHidden);

    expect(screen.getByText(/Show hidden/)).toBeInTheDocument();
  });

  it("shows hidden projects when toggle is enabled", () => {
    const projectsWithHidden = [
      ...mockProjects,
      {
        path: "/Users/test/hidden-project",
        name: "hidden-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-20T15:30:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 600000,
        isHidden: true,
        groupId: null,
        mergedInto: null,
      },
    ];

    renderProjectsList(projectsWithHidden);

    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    expect(screen.getByText("hidden-project")).toBeInTheDocument();
  });

  describe("Select mode for merging", () => {
    it("enters select mode when clicking Merge Projects button", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      const mergeButton = screen.getByRole("button", { name: /merge projects/i });
      await user.click(mergeButton);

      expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
      expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    });

    it("shows checkboxes only in select mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

      const mergeButton = screen.getByRole("button", { name: /merge projects/i });
      await user.click(mergeButton);

      const checkboxes = screen.getAllByRole("checkbox");
      expect(checkboxes.length).toBe(3);
    });

    it("cancels select mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByRole("button", { name: /cancel/i }));

      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("updates selected count when clicking cards in select mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      const projectCard = screen.getByTestId("project-row-/Users/test/project-a");
      await user.click(projectCard);

      expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    });

    it("enables merge button when 2+ projects selected", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      const mergeButton = screen.getByRole("button", { name: /^merge$/i });
      expect(mergeButton).toBeDisabled();

      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));

      expect(mergeButton).toBeEnabled();
    });
  });

  describe("Group display", () => {
    const mockGroupsWithProjects: ProjectGroup[] = [
      {
        id: "group-1",
        name: "Work Projects",
        color: "#3b82f6",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
    ];

    const projectsWithGroups: Project[] = [
      {
        path: "/Users/test/work-project",
        name: "work-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 10,
        messageCount: 200,
        totalTime: 7200000,
        isHidden: false,
        groupId: "group-1",
        mergedInto: null,
      },
      {
        path: "/Users/test/ungrouped-project",
        name: "ungrouped-project",
        firstActivity: "2024-01-04T10:00:00Z",
        lastActivity: "2024-01-12T15:30:00Z",
        sessionCount: 2,
        messageCount: 30,
        totalTime: 1200000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    it("displays group headers with names and project counts", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      expect(screen.getByText("Work Projects")).toBeInTheDocument();
      // Check that project count is shown (count without parentheses in new design)
      expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    });

    it("displays ungrouped section when there are both grouped and ungrouped projects", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      expect(screen.getByText("Ungrouped")).toBeInTheDocument();
    });

    it("collapses group when clicking group header", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      const workGroupHeader = screen.getByText("Work Projects");
      fireEvent.click(workGroupHeader);

      expect(screen.queryByText("work-project")).not.toBeInTheDocument();
      expect(screen.getByText("ungrouped-project")).toBeInTheDocument();
    });

    it("expands group when clicking collapsed group header", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      const workGroupHeader = screen.getByText("Work Projects");
      fireEvent.click(workGroupHeader);

      expect(screen.queryByText("work-project")).not.toBeInTheDocument();

      fireEvent.click(workGroupHeader);

      expect(screen.getByText("work-project")).toBeInTheDocument();
    });
  });

  describe("Merged projects", () => {
    it("filters out merged projects from the list", () => {
      const projectsWithMerged: Project[] = [
        ...mockProjects,
        {
          path: "/Users/test/merged-project",
          name: "merged-project",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-10T15:30:00Z",
          sessionCount: 2,
          messageCount: 20,
          totalTime: 600000,
          isHidden: false,
          groupId: null,
          mergedInto: "/Users/test/project-a",
        },
      ];

      renderProjectsList(projectsWithMerged);

      expect(screen.queryByText("merged-project")).not.toBeInTheDocument();
      expect(screen.getByText("project-a")).toBeInTheDocument();
    });

    it("aggregates stats from merged projects", () => {
      const projectsWithMerged: Project[] = [
        {
          path: "/Users/test/primary",
          name: "primary",
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
          path: "/Users/test/merged",
          name: "merged",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-10T15:30:00Z",
          sessionCount: 3,
          messageCount: 50,
          totalTime: 1800000,
          isHidden: false,
          groupId: null,
          mergedInto: "/Users/test/primary",
        },
      ];

      renderProjectsList(projectsWithMerged);

      expect(screen.getByText("8")).toBeInTheDocument();
      expect(screen.getByText("1h 30m")).toBeInTheDocument();
    });
  });

  describe("Empty states", () => {
    it("shows No projects found when there are no projects at all", () => {
      renderProjectsList([]);

      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });

    it("shows All projects are hidden when all projects are hidden and toggle is off", () => {
      const allHiddenProjects: Project[] = [
        {
          path: "/Users/test/hidden-1",
          name: "hidden-1",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-15T15:30:00Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
          isHidden: true,
          groupId: null,
          mergedInto: null,
        },
      ];

      renderProjectsList(allHiddenProjects);

      expect(screen.getByText("All projects are hidden")).toBeInTheDocument();
    });
  });

  describe("Sorting functionality", () => {
    it("sorts by last activity by default (most recent first)", () => {
      renderProjectsList();

      const projectRows = screen.getAllByTestId(/project-row-/);
      // project-b has the most recent lastActivity (2024-01-15)
      expect(projectRows[0]).toHaveAttribute("data-testid", "project-row-/Users/test/project-b");
    });

    it("opens sort dropdown when clicking sort button", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      expect(screen.getByText("Name")).toBeInTheDocument();
      expect(screen.getByText("Sessions")).toBeInTheDocument();
      expect(screen.getByText("Total Time")).toBeInTheDocument();
      expect(screen.getByText("Last Activity")).toBeInTheDocument();
    });

    it("sorts by name when selecting Name option", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const nameOption = screen.getByText("Name");
      await user.click(nameOption);

      const projectRows = screen.getAllByTestId(/project-row-/);
      // Sorted alphabetically descending by default
      expect(projectRows[0]).toHaveAttribute("data-testid", "project-row-/Users/test/project-c");
    });

    it("sorts by sessions when selecting Sessions option", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const sessionsOption = screen.getByText("Sessions");
      await user.click(sessionsOption);

      const projectRows = screen.getAllByTestId(/project-row-/);
      // project-b has 10 sessions, highest
      expect(projectRows[0]).toHaveAttribute("data-testid", "project-row-/Users/test/project-b");
    });

    it("toggles sort order when clicking the same sort field twice", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      // Click sort by name
      let sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);
      await user.click(screen.getByText("Name"));

      // Click sort by name again to toggle order
      sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);
      await user.click(screen.getByText("Name"));

      const projectRows = screen.getAllByTestId(/project-row-/);
      // Now sorted alphabetically ascending
      expect(projectRows[0]).toHaveAttribute("data-testid", "project-row-/Users/test/project-a");
    });

    it("sorts by total time when selecting Total Time option", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      const sortButton = screen.getByRole("button", { name: /sort by/i });
      await user.click(sortButton);

      const totalTimeOption = screen.getByText("Total Time");
      await user.click(totalTimeOption);

      const projectRows = screen.getAllByTestId(/project-row-/);
      // project-b has highest total time (7200000ms)
      expect(projectRows[0]).toHaveAttribute("data-testid", "project-row-/Users/test/project-b");
    });
  });

  describe("Merge dialog flow", () => {
    it("opens merge dialog when clicking merge after selecting 2 projects", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      // Enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Select 2 projects
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));

      // Click merge button
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Merge dialog should be open
      expect(screen.getByText("Merge Projects")).toBeInTheDocument();
      expect(screen.getByText(/Select which project should be the primary/)).toBeInTheDocument();
    });

    it("shows selected projects in merge dialog", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Both selected projects should appear in dialog
      expect(screen.getAllByText("project-a").length).toBeGreaterThan(0);
      expect(screen.getAllByText("project-b").length).toBeGreaterThan(0);
    });

    it("calls onMerge with correct arguments when confirming merge", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Select primary project in dialog by clicking on the radio button
      const radioButtons = screen.getAllByRole("radio");
      const projectARadio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-a"
      );
      await user.click(projectARadio!);

      // Confirm merge - get the button inside the dialog (DialogFooter)
      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      await user.click(dialogMergeButton!);

      expect(mockHandlers.onMerge).toHaveBeenCalledWith(
        ["/Users/test/project-b"],
        "/Users/test/project-a"
      );
    });

    it("closes dialog and exits select mode after successful merge", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Select primary project using radio button
      const radioButtons = screen.getAllByRole("radio");
      const projectARadio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-a"
      );
      await user.click(projectARadio!);

      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      await user.click(dialogMergeButton!);

      // Should exit select mode
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("cancels merge dialog and keeps selection when clicking cancel", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Cancel the dialog
      const cancelButton = screen.getByRole("button", { name: /cancel/i });
      await user.click(cancelButton);

      // Dialog should be closed
      expect(screen.queryByText("Merge Projects")).not.toBeInTheDocument();

      // Still in select mode with selections intact
      expect(screen.getByText(/2 selected/)).toBeInTheDocument();
    });

    it("disables merge dialog confirm button until primary is selected", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // The merge button in dialog should be disabled
      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      expect(dialogMergeButton).toBeDisabled();

      // Select a primary using radio button
      const radioButtons = screen.getAllByRole("radio");
      const projectARadio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-a"
      );
      await user.click(projectARadio!);

      // Now should be enabled
      expect(dialogMergeButton).toBeEnabled();
    });
  });

  describe("Group reordering", () => {
    const mockGroupsForReorder: ProjectGroup[] = [
      {
        id: "group-1",
        name: "First Group",
        color: "#ff0000",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
      {
        id: "group-2",
        name: "Second Group",
        color: "#00ff00",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 1,
      },
      {
        id: "group-3",
        name: "Third Group",
        color: "#0000ff",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 2,
      },
    ];

    const projectsInGroups: Project[] = [
      {
        path: "/proj1",
        name: "proj1",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: "group-1",
        mergedInto: null,
      },
      {
        path: "/proj2",
        name: "proj2",
        firstActivity: "2024-01-05T10:00:00Z",
        lastActivity: "2024-01-12T15:30:00Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
        isHidden: false,
        groupId: "group-2",
        mergedInto: null,
      },
      {
        path: "/proj3",
        name: "proj3",
        firstActivity: "2024-01-08T10:00:00Z",
        lastActivity: "2024-01-10T15:30:00Z",
        sessionCount: 2,
        messageCount: 30,
        totalTime: 1200000,
        isHidden: false,
        groupId: "group-3",
        mergedInto: null,
      },
    ];

    it("shows move up and move down buttons for groups", () => {
      const onReorderGroup = jest.fn();
      render(
        <ProjectsList
          projects={projectsInGroups}
          groups={mockGroupsForReorder}
          onSetHidden={mockHandlers.onSetHidden}
          onSetGroup={mockHandlers.onSetGroup}
          onMerge={mockHandlers.onMerge}
          onUnmerge={mockHandlers.onUnmerge}
          onReorderGroup={onReorderGroup}
        />
      );

      // Move buttons should be present
      expect(screen.getAllByRole("button", { name: /move group up/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /move group down/i }).length).toBeGreaterThan(0);
    });

    it("calls onReorderGroup with up direction when clicking move up", async () => {
      const user = userEvent.setup();
      const onReorderGroup = jest.fn();
      render(
        <ProjectsList
          projects={projectsInGroups}
          groups={mockGroupsForReorder}
          onSetHidden={mockHandlers.onSetHidden}
          onSetGroup={mockHandlers.onSetGroup}
          onMerge={mockHandlers.onMerge}
          onUnmerge={mockHandlers.onUnmerge}
          onReorderGroup={onReorderGroup}
        />
      );

      // Find the second group's move up button (first group can't move up)
      const moveUpButtons = screen.getAllByRole("button", { name: /move group up/i });
      // Click the first enabled move up button (should be for group-2)
      const enabledMoveUpButton = moveUpButtons.find((btn) => !btn.hasAttribute("disabled"));
      if (enabledMoveUpButton) {
        await user.click(enabledMoveUpButton);
        expect(onReorderGroup).toHaveBeenCalledWith("group-2", "up");
      }
    });

    it("calls onReorderGroup with down direction when clicking move down", async () => {
      const user = userEvent.setup();
      const onReorderGroup = jest.fn();
      render(
        <ProjectsList
          projects={projectsInGroups}
          groups={mockGroupsForReorder}
          onSetHidden={mockHandlers.onSetHidden}
          onSetGroup={mockHandlers.onSetGroup}
          onMerge={mockHandlers.onMerge}
          onUnmerge={mockHandlers.onUnmerge}
          onReorderGroup={onReorderGroup}
        />
      );

      // Find the first group's move down button
      const moveDownButtons = screen.getAllByRole("button", { name: /move group down/i });
      const enabledMoveDownButton = moveDownButtons.find((btn) => !btn.hasAttribute("disabled"));
      if (enabledMoveDownButton) {
        await user.click(enabledMoveDownButton);
        expect(onReorderGroup).toHaveBeenCalledWith("group-1", "down");
      }
    });

    it("disables move up button for the first group", () => {
      render(
        <ProjectsList
          projects={projectsInGroups}
          groups={mockGroupsForReorder}
          onSetHidden={mockHandlers.onSetHidden}
          onSetGroup={mockHandlers.onSetGroup}
          onMerge={mockHandlers.onMerge}
          onUnmerge={mockHandlers.onUnmerge}
          onReorderGroup={jest.fn()}
        />
      );

      // The first group (First Group) should have a disabled move up button
      const moveUpButtons = screen.getAllByRole("button", { name: /move group up/i });
      expect(moveUpButtons[0]).toBeDisabled();
    });

    it("disables move down button for the last group", () => {
      render(
        <ProjectsList
          projects={projectsInGroups}
          groups={mockGroupsForReorder}
          onSetHidden={mockHandlers.onSetHidden}
          onSetGroup={mockHandlers.onSetGroup}
          onMerge={mockHandlers.onMerge}
          onUnmerge={mockHandlers.onUnmerge}
          onReorderGroup={jest.fn()}
        />
      );

      // The last group (Third Group) should have a disabled move down button
      const moveDownButtons = screen.getAllByRole("button", { name: /move group down/i });
      expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
    });
  });

  describe("Selection toggling behavior", () => {
    it("toggles project selection on and off", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Select a project
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      expect(screen.getByText(/1 selected/)).toBeInTheDocument();

      // Deselect the same project
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    });

    it("clears selection when canceling select mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      expect(screen.getByText(/2 selected/)).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: /cancel/i }));

      // Re-enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Selection should be cleared
      expect(screen.getByText(/0 selected/)).toBeInTheDocument();
    });

    it("allows selecting more than 2 projects for merge", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-b"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-c"));

      expect(screen.getByText(/3 selected/)).toBeInTheDocument();

      // Merge button should still be enabled
      expect(screen.getByRole("button", { name: /^merge$/i })).toBeEnabled();
    });
  });

  describe("Navigation behavior in select mode vs normal mode", () => {
    it("does not navigate when clicking project in select mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByRole("button", { name: /merge projects/i }));
      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));

      // Should not navigate
      expect(mockPush).not.toHaveBeenCalled();

      // But should update selection
      expect(screen.getByText(/1 selected/)).toBeInTheDocument();
    });

    it("navigates when clicking project in normal mode", async () => {
      const user = userEvent.setup();
      renderProjectsList();

      await user.click(screen.getByTestId("project-row-/Users/test/project-a"));

      expect(mockPush).toHaveBeenCalledWith(
        "/projects/" + encodeURIComponent("/Users/test/project-a")
      );
    });
  });
});

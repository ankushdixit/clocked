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
      // Check that project count is shown somewhere (may have multiple instances)
      expect(screen.getAllByText("(1)").length).toBeGreaterThan(0);
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
});

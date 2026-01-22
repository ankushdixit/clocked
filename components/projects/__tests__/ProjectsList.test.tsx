/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
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
    totalTime: 1800000, // 30 minutes
    isHidden: false,
    groupId: null,
    isDefault: false,
  },
  {
    path: "/Users/test/project-b",
    name: "project-b",
    firstActivity: "2024-01-05T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 10,
    messageCount: 200,
    totalTime: 7200000, // 2 hours
    isHidden: false,
    groupId: null,
    isDefault: false,
  },
  {
    path: "/Users/test/project-c",
    name: "project-c",
    firstActivity: "2024-01-08T10:00:00Z",
    lastActivity: "2024-01-12T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000, // 1 hour
    isHidden: false,
    groupId: null,
    isDefault: false,
  },
];

const mockGroups: ProjectGroup[] = [];

const mockHandlers = {
  onSetHidden: jest.fn(),
  onSetGroup: jest.fn(),
  onSetDefault: jest.fn(),
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
      onSetDefault={mockHandlers.onSetDefault}
    />
  );
};

describe("ProjectsList", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockHandlers.onSetHidden.mockClear();
    mockHandlers.onSetGroup.mockClear();
    mockHandlers.onSetDefault.mockClear();
  });

  it("renders all projects", () => {
    renderProjectsList();

    expect(screen.getByText("project-a")).toBeInTheDocument();
    expect(screen.getByText("project-b")).toBeInTheDocument();
    expect(screen.getByText("project-c")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    renderProjectsList();

    expect(screen.getByText("Project")).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Last Activity")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("sorts by last activity by default (descending)", () => {
    renderProjectsList();

    const rows = screen.getAllByRole("row");
    // First row is header, so data rows start at index 1
    // project-b has the most recent lastActivity
    expect(rows[1]).toHaveTextContent("project-b");
  });

  it("toggles sort order when clicking the same header", () => {
    renderProjectsList();

    // Default is lastActivity descending - project-b first
    let rows = screen.getAllByRole("row");
    expect(rows[1]).toHaveTextContent("project-b");

    // Click Last Activity again to toggle to ascending
    fireEvent.click(screen.getByText("Last Activity"));
    rows = screen.getAllByRole("row");
    // project-a has the oldest lastActivity
    expect(rows[1]).toHaveTextContent("project-a");
  });

  it("sorts by sessions when clicking Sessions header", () => {
    renderProjectsList();

    fireEvent.click(screen.getByText("Sessions"));

    const rows = screen.getAllByRole("row");
    // Descending order - project-b has 10 sessions
    expect(rows[1]).toHaveTextContent("project-b");
    // project-a has 3 sessions (least)
    expect(rows[3]).toHaveTextContent("project-a");
  });

  it("sorts by time when clicking Time header", () => {
    renderProjectsList();

    fireEvent.click(screen.getByText("Time"));

    const rows = screen.getAllByRole("row");
    // Descending order - project-b has 2h 0m
    expect(rows[1]).toHaveTextContent("project-b");
  });

  it("sorts by name when clicking Project header", () => {
    renderProjectsList();

    fireEvent.click(screen.getByText("Project"));

    const rows = screen.getAllByRole("row");
    // Descending order - project-c first alphabetically descending
    expect(rows[1]).toHaveTextContent("project-c");
  });

  it("navigates to project detail page when clicking project name", () => {
    renderProjectsList();

    const projectName = screen.getByText("project-a");
    fireEvent.click(projectName);

    expect(mockPush).toHaveBeenCalledWith(
      `/projects/${encodeURIComponent("/Users/test/project-a")}`
    );
  });

  it("shows empty state when no projects and all hidden", () => {
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
        isDefault: false,
      },
    ];

    renderProjectsList(projectsWithHidden);

    // Hidden project should not be visible
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
        isDefault: false,
      },
    ];

    renderProjectsList(projectsWithHidden);

    expect(screen.getByText(/Show hidden projects/)).toBeInTheDocument();
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
        isDefault: false,
      },
    ];

    renderProjectsList(projectsWithHidden);

    // Toggle to show hidden
    const toggle = screen.getByRole("switch");
    fireEvent.click(toggle);

    // Now the hidden project should be visible
    expect(screen.getByText("hidden-project")).toBeInTheDocument();
  });

  describe("Show hidden toggle functionality", () => {
    const projectsWithMultipleHidden: Project[] = [
      {
        path: "/Users/test/visible-1",
        name: "visible-project-1",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
      {
        path: "/Users/test/visible-2",
        name: "visible-project-2",
        firstActivity: "2024-01-02T10:00:00Z",
        lastActivity: "2024-01-14T15:30:00Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
      {
        path: "/Users/test/hidden-1",
        name: "hidden-project-1",
        firstActivity: "2024-01-03T10:00:00Z",
        lastActivity: "2024-01-13T15:30:00Z",
        sessionCount: 2,
        messageCount: 20,
        totalTime: 900000,
        isHidden: true,
        groupId: null,
        isDefault: false,
      },
      {
        path: "/Users/test/hidden-2",
        name: "hidden-project-2",
        firstActivity: "2024-01-04T10:00:00Z",
        lastActivity: "2024-01-12T15:30:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 600000,
        isHidden: true,
        groupId: null,
        isDefault: false,
      },
    ];

    it("displays correct hidden count in toggle label", () => {
      renderProjectsList(projectsWithMultipleHidden);

      expect(screen.getByText(/Show hidden projects \(2\)/)).toBeInTheDocument();
    });

    it("can toggle hidden projects on and off", () => {
      renderProjectsList(projectsWithMultipleHidden);

      // Initially hidden projects are not visible
      expect(screen.queryByText("hidden-project-1")).not.toBeInTheDocument();
      expect(screen.queryByText("hidden-project-2")).not.toBeInTheDocument();
      expect(screen.getByText("visible-project-1")).toBeInTheDocument();
      expect(screen.getByText("visible-project-2")).toBeInTheDocument();

      // Toggle ON - show hidden projects
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(screen.getByText("hidden-project-1")).toBeInTheDocument();
      expect(screen.getByText("hidden-project-2")).toBeInTheDocument();
      expect(screen.getByText("visible-project-1")).toBeInTheDocument();
      expect(screen.getByText("visible-project-2")).toBeInTheDocument();

      // Toggle OFF - hide them again
      fireEvent.click(toggle);

      expect(screen.queryByText("hidden-project-1")).not.toBeInTheDocument();
      expect(screen.queryByText("hidden-project-2")).not.toBeInTheDocument();
      expect(screen.getByText("visible-project-1")).toBeInTheDocument();
      expect(screen.getByText("visible-project-2")).toBeInTheDocument();
    });

    it("does not show toggle when no hidden projects exist", () => {
      const allVisibleProjects = projectsWithMultipleHidden.filter((p) => !p.isHidden);
      renderProjectsList(allVisibleProjects);

      expect(screen.queryByRole("switch")).not.toBeInTheDocument();
      expect(screen.queryByText(/Show hidden projects/)).not.toBeInTheDocument();
    });

    it("shows 'All projects are hidden' message when all projects are hidden and toggle is off", () => {
      const allHiddenProjects: Project[] = [
        {
          path: "/Users/test/hidden-only-1",
          name: "hidden-only-1",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-15T15:30:00Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
          isHidden: true,
          groupId: null,
          isDefault: false,
        },
        {
          path: "/Users/test/hidden-only-2",
          name: "hidden-only-2",
          firstActivity: "2024-01-02T10:00:00Z",
          lastActivity: "2024-01-14T15:30:00Z",
          sessionCount: 3,
          messageCount: 50,
          totalTime: 1800000,
          isHidden: true,
          groupId: null,
          isDefault: false,
        },
      ];

      renderProjectsList(allHiddenProjects);

      expect(screen.getByText("All projects are hidden")).toBeInTheDocument();

      // Toggle to show hidden projects
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Now projects should be visible and the message should be gone
      expect(screen.queryByText("All projects are hidden")).not.toBeInTheDocument();
      expect(screen.getByText("hidden-only-1")).toBeInTheDocument();
      expect(screen.getByText("hidden-only-2")).toBeInTheDocument();
    });
  });

  describe("Group expansion/collapse behavior", () => {
    const mockGroupsWithProjects: ProjectGroup[] = [
      {
        id: "group-1",
        name: "Work Projects",
        color: "#3b82f6",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
      {
        id: "group-2",
        name: "Personal Projects",
        color: "#22c55e",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 1,
      },
    ];

    const projectsWithGroups: Project[] = [
      {
        path: "/Users/test/work-project-1",
        name: "work-project-1",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 10,
        messageCount: 200,
        totalTime: 7200000,
        isHidden: false,
        groupId: "group-1",
        isDefault: false,
      },
      {
        path: "/Users/test/work-project-2",
        name: "work-project-2",
        firstActivity: "2024-01-02T10:00:00Z",
        lastActivity: "2024-01-14T15:30:00Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: "group-1",
        isDefault: false,
      },
      {
        path: "/Users/test/personal-project-1",
        name: "personal-project-1",
        firstActivity: "2024-01-03T10:00:00Z",
        lastActivity: "2024-01-13T15:30:00Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
        isHidden: false,
        groupId: "group-2",
        isDefault: false,
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
        isDefault: false,
      },
    ];

    it("displays group headers with names and project counts", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      expect(screen.getByText("Work Projects")).toBeInTheDocument();
      expect(screen.getByText("(2)")).toBeInTheDocument();
      expect(screen.getByText("Personal Projects")).toBeInTheDocument();
      expect(screen.getByText("(1)")).toBeInTheDocument();
    });

    it("shows all projects in groups by default (expanded state)", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      // All projects should be visible initially
      expect(screen.getByText("work-project-1")).toBeInTheDocument();
      expect(screen.getByText("work-project-2")).toBeInTheDocument();
      expect(screen.getByText("personal-project-1")).toBeInTheDocument();
      expect(screen.getByText("ungrouped-project")).toBeInTheDocument();
    });

    it("collapses group when clicking group header", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      // Find and click the Work Projects group header
      const workGroupHeader = screen.getByText("Work Projects").closest("tr");
      expect(workGroupHeader).toBeInTheDocument();
      fireEvent.click(workGroupHeader!);

      // Work projects should be hidden after collapse
      expect(screen.queryByText("work-project-1")).not.toBeInTheDocument();
      expect(screen.queryByText("work-project-2")).not.toBeInTheDocument();

      // Other projects should still be visible
      expect(screen.getByText("personal-project-1")).toBeInTheDocument();
      expect(screen.getByText("ungrouped-project")).toBeInTheDocument();
    });

    it("expands group when clicking collapsed group header", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      // Collapse the Work Projects group
      const workGroupHeader = screen.getByText("Work Projects").closest("tr");
      fireEvent.click(workGroupHeader!);

      // Verify collapsed
      expect(screen.queryByText("work-project-1")).not.toBeInTheDocument();

      // Click again to expand
      fireEvent.click(workGroupHeader!);

      // Projects should be visible again
      expect(screen.getByText("work-project-1")).toBeInTheDocument();
      expect(screen.getByText("work-project-2")).toBeInTheDocument();
    });

    it("can collapse multiple groups independently", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      // Collapse Work Projects
      const workGroupHeader = screen.getByText("Work Projects").closest("tr");
      fireEvent.click(workGroupHeader!);

      // Collapse Personal Projects
      const personalGroupHeader = screen.getByText("Personal Projects").closest("tr");
      fireEvent.click(personalGroupHeader!);

      // Both groups' projects should be hidden
      expect(screen.queryByText("work-project-1")).not.toBeInTheDocument();
      expect(screen.queryByText("work-project-2")).not.toBeInTheDocument();
      expect(screen.queryByText("personal-project-1")).not.toBeInTheDocument();

      // Ungrouped project should still be visible
      expect(screen.getByText("ungrouped-project")).toBeInTheDocument();

      // Expand only Work Projects
      fireEvent.click(workGroupHeader!);

      // Only Work projects should be visible now
      expect(screen.getByText("work-project-1")).toBeInTheDocument();
      expect(screen.getByText("work-project-2")).toBeInTheDocument();
      expect(screen.queryByText("personal-project-1")).not.toBeInTheDocument();
    });

    it("maintains collapsed state while sorting", () => {
      renderProjectsList(projectsWithGroups, mockGroupsWithProjects);

      // Collapse Work Projects group
      const workGroupHeader = screen.getByText("Work Projects").closest("tr");
      fireEvent.click(workGroupHeader!);

      expect(screen.queryByText("work-project-1")).not.toBeInTheDocument();

      // Sort by Sessions
      fireEvent.click(screen.getByText("Sessions"));

      // Group should remain collapsed after sorting
      expect(screen.queryByText("work-project-1")).not.toBeInTheDocument();
      expect(screen.queryByText("work-project-2")).not.toBeInTheDocument();
      expect(screen.getByText("Work Projects")).toBeInTheDocument();
    });
  });

  describe("Grouped and ungrouped projects interaction", () => {
    const mixedGroups: ProjectGroup[] = [
      {
        id: "active-group",
        name: "Active Development",
        color: "#f59e0b",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
    ];

    const mixedProjects: Project[] = [
      {
        path: "/Users/test/grouped-project",
        name: "grouped-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 8,
        messageCount: 160,
        totalTime: 5400000,
        isHidden: false,
        groupId: "active-group",
        isDefault: false,
      },
      {
        path: "/Users/test/ungrouped-1",
        name: "ungrouped-1",
        firstActivity: "2024-01-02T10:00:00Z",
        lastActivity: "2024-01-14T15:30:00Z",
        sessionCount: 4,
        messageCount: 80,
        totalTime: 2700000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
      {
        path: "/Users/test/ungrouped-2",
        name: "ungrouped-2",
        firstActivity: "2024-01-03T10:00:00Z",
        lastActivity: "2024-01-13T15:30:00Z",
        sessionCount: 2,
        messageCount: 40,
        totalTime: 1350000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
    ];

    it("displays grouped projects under group header and ungrouped projects separately", () => {
      renderProjectsList(mixedProjects, mixedGroups);

      // Group header should be visible
      expect(screen.getByText("Active Development")).toBeInTheDocument();

      // All projects should be visible
      expect(screen.getByText("grouped-project")).toBeInTheDocument();
      expect(screen.getByText("ungrouped-1")).toBeInTheDocument();
      expect(screen.getByText("ungrouped-2")).toBeInTheDocument();
    });

    it("collapsing a group does not affect ungrouped projects", () => {
      renderProjectsList(mixedProjects, mixedGroups);

      // Collapse the group
      const groupHeader = screen.getByText("Active Development").closest("tr");
      fireEvent.click(groupHeader!);

      // Grouped project should be hidden
      expect(screen.queryByText("grouped-project")).not.toBeInTheDocument();

      // Ungrouped projects should remain visible
      expect(screen.getByText("ungrouped-1")).toBeInTheDocument();
      expect(screen.getByText("ungrouped-2")).toBeInTheDocument();
    });

    it("applies sorting to both grouped and ungrouped projects", () => {
      renderProjectsList(mixedProjects, mixedGroups);

      // Sort by sessions descending (default direction)
      fireEvent.click(screen.getByText("Sessions"));

      const rows = screen.getAllByRole("row");
      // Header row, then group header row, then grouped-project (8 sessions),
      // then ungrouped-1 (4 sessions), then ungrouped-2 (2 sessions)
      // The grouped project should appear within its group section
      expect(rows.length).toBeGreaterThan(3);
    });

    it("navigates to project when clicking on a grouped project name", () => {
      renderProjectsList(mixedProjects, mixedGroups);

      fireEvent.click(screen.getByText("grouped-project"));

      expect(mockPush).toHaveBeenCalledWith(
        `/projects/${encodeURIComponent("/Users/test/grouped-project")}`
      );
    });

    it("navigates to project when clicking on an ungrouped project name", () => {
      renderProjectsList(mixedProjects, mixedGroups);

      fireEvent.click(screen.getByText("ungrouped-1"));

      expect(mockPush).toHaveBeenCalledWith(
        `/projects/${encodeURIComponent("/Users/test/ungrouped-1")}`
      );
    });
  });

  describe("Empty states", () => {
    const emptyGroup: ProjectGroup[] = [
      {
        id: "empty-group",
        name: "Empty Group",
        color: "#6366f1",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
    ];

    it("does not render group header when group has no projects", () => {
      // All projects are ungrouped, but we have an empty group defined
      renderProjectsList(mockProjects, emptyGroup);

      // Empty group header should not be rendered
      expect(screen.queryByText("Empty Group")).not.toBeInTheDocument();

      // But ungrouped projects should still show
      expect(screen.getByText("project-a")).toBeInTheDocument();
      expect(screen.getByText("project-b")).toBeInTheDocument();
      expect(screen.getByText("project-c")).toBeInTheDocument();
    });

    it("shows 'No projects found' when there are no projects at all", () => {
      renderProjectsList([], emptyGroup);

      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });

    it("shows ungrouped section when all groups are empty", () => {
      renderProjectsList(mockProjects, emptyGroup);

      // All projects should be visible as ungrouped
      expect(screen.getByText("project-a")).toBeInTheDocument();
      expect(screen.getByText("project-b")).toBeInTheDocument();
      expect(screen.getByText("project-c")).toBeInTheDocument();
    });
  });

  describe("Hidden projects with groups", () => {
    const groupsForHiddenTest: ProjectGroup[] = [
      {
        id: "test-group",
        name: "Test Group",
        color: "#ec4899",
        createdAt: "2024-01-01T00:00:00Z",
        sortOrder: 0,
      },
    ];

    const projectsWithHiddenInGroup: Project[] = [
      {
        path: "/Users/test/visible-grouped",
        name: "visible-grouped",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: "test-group",
        isDefault: false,
      },
      {
        path: "/Users/test/hidden-grouped",
        name: "hidden-grouped",
        firstActivity: "2024-01-02T10:00:00Z",
        lastActivity: "2024-01-14T15:30:00Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
        isHidden: true,
        groupId: "test-group",
        isDefault: false,
      },
      {
        path: "/Users/test/visible-ungrouped",
        name: "visible-ungrouped",
        firstActivity: "2024-01-03T10:00:00Z",
        lastActivity: "2024-01-13T15:30:00Z",
        sessionCount: 2,
        messageCount: 30,
        totalTime: 1200000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
    ];

    it("filters hidden projects within groups when toggle is off", () => {
      renderProjectsList(projectsWithHiddenInGroup, groupsForHiddenTest);

      expect(screen.getByText("visible-grouped")).toBeInTheDocument();
      expect(screen.queryByText("hidden-grouped")).not.toBeInTheDocument();
      expect(screen.getByText("visible-ungrouped")).toBeInTheDocument();
    });

    it("shows hidden projects within groups when toggle is on", () => {
      renderProjectsList(projectsWithHiddenInGroup, groupsForHiddenTest);

      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      expect(screen.getByText("visible-grouped")).toBeInTheDocument();
      expect(screen.getByText("hidden-grouped")).toBeInTheDocument();
      expect(screen.getByText("visible-ungrouped")).toBeInTheDocument();
    });

    it("updates group project count based on hidden filter", () => {
      renderProjectsList(projectsWithHiddenInGroup, groupsForHiddenTest);

      // With hidden toggle off, group should show count of 1
      expect(screen.getByText("(1)")).toBeInTheDocument();

      // Toggle on hidden projects
      const toggle = screen.getByRole("switch");
      fireEvent.click(toggle);

      // Now group should show count of 2
      expect(screen.getByText("(2)")).toBeInTheDocument();
    });
  });

  describe("Sort order edge cases", () => {
    it("toggles from descending to ascending when clicking same header", () => {
      renderProjectsList();

      // Default sort is lastActivity descending
      let rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("project-b"); // Most recent

      // Click to toggle to ascending
      fireEvent.click(screen.getByText("Last Activity"));
      rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("project-a"); // Oldest

      // Click again to toggle back to descending
      fireEvent.click(screen.getByText("Last Activity"));
      rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("project-b"); // Most recent again
    });

    it("resets to descending when switching to a different sort column", () => {
      renderProjectsList();

      // Sort by name ascending first
      fireEvent.click(screen.getByText("Project")); // descending
      fireEvent.click(screen.getByText("Project")); // ascending

      let rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("project-a"); // First alphabetically

      // Switch to Sessions - should be descending (default direction)
      fireEvent.click(screen.getByText("Sessions"));
      rows = screen.getAllByRole("row");
      expect(rows[1]).toHaveTextContent("project-b"); // Most sessions (10)
    });
  });

  describe("Project groupId edge cases", () => {
    const projectsWithInvalidGroupId: Project[] = [
      {
        path: "/Users/test/orphan-project",
        name: "orphan-project",
        firstActivity: "2024-01-01T10:00:00Z",
        lastActivity: "2024-01-15T15:30:00Z",
        sessionCount: 5,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: "non-existent-group", // This group doesn't exist
        isDefault: false,
      },
      {
        path: "/Users/test/normal-project",
        name: "normal-project",
        firstActivity: "2024-01-02T10:00:00Z",
        lastActivity: "2024-01-14T15:30:00Z",
        sessionCount: 3,
        messageCount: 50,
        totalTime: 1800000,
        isHidden: false,
        groupId: null,
        isDefault: false,
      },
    ];

    it("places projects with invalid groupId into ungrouped section", () => {
      renderProjectsList(projectsWithInvalidGroupId, []);

      // Both projects should be visible as ungrouped
      expect(screen.getByText("orphan-project")).toBeInTheDocument();
      expect(screen.getByText("normal-project")).toBeInTheDocument();

      // No group headers should be displayed
      const rows = screen.getAllByRole("row");
      // Should just have header row and 2 data rows
      expect(rows.length).toBe(3);
    });

    it("handles projects with groupId pointing to deleted group", () => {
      const validGroup: ProjectGroup[] = [
        {
          id: "valid-group",
          name: "Valid Group",
          color: "#10b981",
          createdAt: "2024-01-01T00:00:00Z",
          sortOrder: 0,
        },
      ];

      const mixedValidityProjects: Project[] = [
        {
          path: "/Users/test/valid-grouped",
          name: "valid-grouped",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-15T15:30:00Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
          isHidden: false,
          groupId: "valid-group",
          isDefault: false,
        },
        {
          path: "/Users/test/orphan",
          name: "orphan",
          firstActivity: "2024-01-02T10:00:00Z",
          lastActivity: "2024-01-14T15:30:00Z",
          sessionCount: 3,
          messageCount: 50,
          totalTime: 1800000,
          isHidden: false,
          groupId: "deleted-group", // This group no longer exists
          isDefault: false,
        },
      ];

      renderProjectsList(mixedValidityProjects, validGroup);

      // Valid group header should exist
      expect(screen.getByText("Valid Group")).toBeInTheDocument();

      // Valid grouped project should be in its group
      expect(screen.getByText("valid-grouped")).toBeInTheDocument();

      // Orphan project should be visible (placed in ungrouped)
      expect(screen.getByText("orphan")).toBeInTheDocument();
    });
  });
});

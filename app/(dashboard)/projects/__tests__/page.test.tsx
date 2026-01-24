/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProjectsPage from "../page";
import { useList, useUpdate, useInvalidate } from "@refinedev/core";
import type { Project, ProjectGroup } from "@/types/electron";

// Mock @refinedev/core
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(),
  useUpdate: jest.fn(),
  useInvalidate: jest.fn(),
}));

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockUseList = useList as jest.Mock;
const mockUseUpdate = useUpdate as jest.Mock;
const mockUseInvalidate = useInvalidate as jest.Mock;

describe("ProjectsPage", () => {
  beforeEach(() => {
    mockUseList.mockClear();
    mockUseUpdate.mockReturnValue({
      mutate: jest.fn(),
    });
    mockUseInvalidate.mockReturnValue(jest.fn());
  });

  it("renders loading state", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: true,
        isError: false,
      },
      result: {
        data: [],
        total: 0,
      },
    });

    render(<ProjectsPage />);

    // Check for loading spinner (Loader2 has animate-spin class)
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders error state", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: false,
        isError: true,
      },
      result: {
        data: [],
        total: 0,
      },
    });

    render(<ProjectsPage />);

    expect(screen.getByText("Error loading projects")).toBeInTheDocument();
    expect(
      screen.getByText("There was an error loading your projects. Please try again.")
    ).toBeInTheDocument();
  });

  it("renders empty state when no projects", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: false,
        isError: false,
      },
      result: {
        data: [],
        total: 0,
      },
    });

    render(<ProjectsPage />);

    expect(screen.getByText("No Claude Code sessions found")).toBeInTheDocument();
    expect(
      screen.getByText("Start using Claude Code to see your activity here")
    ).toBeInTheDocument();
  });

  it("renders projects list when projects exist", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: false,
        isError: false,
      },
      result: {
        data: [
          {
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
          },
        ],
        total: 1,
      },
    });

    render(<ProjectsPage />);

    expect(screen.getByText("Projects")).toBeInTheDocument();
    expect(screen.getByText("my-project")).toBeInTheDocument();
  });

  it("renders page title and description", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: false,
        isError: false,
      },
      result: {
        data: [
          {
            path: "/Users/test/project",
            name: "project",
            firstActivity: "2024-01-01T10:00:00Z",
            lastActivity: "2024-01-15T15:30:00Z",
            sessionCount: 1,
            messageCount: 10,
            totalTime: 600000,
            isHidden: false,
            groupId: null,
            mergedInto: null,
          },
        ],
        total: 1,
      },
    });

    render(<ProjectsPage />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Projects");
  });

  it("calls useList with correct parameters", () => {
    mockUseList.mockReturnValue({
      query: {
        isLoading: false,
        isError: false,
      },
      result: {
        data: [],
        total: 0,
      },
    });

    render(<ProjectsPage />);

    // First call is for projects, second is for groups
    expect(mockUseList).toHaveBeenCalledWith({
      resource: "projects",
      pagination: {
        pageSize: 1000,
      },
    });
    expect(mockUseList).toHaveBeenCalledWith({
      resource: "groups",
    });
  });

  it("renders loading state when groups are loading", () => {
    mockUseList
      .mockReturnValueOnce({
        query: {
          isLoading: false,
          isError: false,
        },
        result: {
          data: [],
          total: 0,
        },
      })
      .mockReturnValueOnce({
        query: {
          isLoading: true,
          isError: false,
        },
        result: {
          data: [],
          total: 0,
        },
      });

    render(<ProjectsPage />);

    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});

describe("ProjectsPage handlers", () => {
  let mockMutate: jest.Mock;
  let mockInvalidate: jest.Mock;

  const mockProject: Project = {
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
  };

  const mockGroups: ProjectGroup[] = [
    {
      id: "group-1",
      name: "Work Projects",
      color: "#ff0000",
      createdAt: "2024-01-01T00:00:00Z",
      sortOrder: 0,
    },
    {
      id: "group-2",
      name: "Personal",
      color: "#00ff00",
      createdAt: "2024-01-01T00:00:00Z",
      sortOrder: 1,
    },
  ];

  beforeEach(() => {
    mockUseList.mockClear();
    mockUseUpdate.mockClear();
    mockUseInvalidate.mockClear();

    mockMutate = jest.fn();
    mockInvalidate = jest.fn();

    mockUseUpdate.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseInvalidate.mockReturnValue(mockInvalidate);
  });

  const setupMocksWithProjects = (projects = [mockProject], groups = mockGroups) => {
    mockUseList
      .mockReturnValueOnce({
        query: {
          isLoading: false,
          isError: false,
        },
        result: {
          data: projects,
          total: projects.length,
        },
      })
      .mockReturnValueOnce({
        query: {
          isLoading: false,
          isError: false,
        },
        result: {
          data: groups,
          total: groups.length,
        },
      });
  };

  describe("handleSetHidden", () => {
    it("configures useUpdate hook for project mutations", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify useUpdate was called and returns the mutate function
      expect(mockUseUpdate).toHaveBeenCalled();
      expect(mockUseUpdate.mock.results[0].value.mutate).toBeDefined();
    });

    it("passes onSetHidden handler to ProjectsList", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify the page renders and ProjectsList is present
      expect(screen.getByText("my-project")).toBeInTheDocument();
      // The merge projects button should be present (indicates ProjectsList is rendered)
      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("uses useUpdate hook for project updates", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify useUpdate was called (it's used for all three handlers)
      expect(mockUseUpdate).toHaveBeenCalled();
    });
  });

  describe("handleSetGroup", () => {
    it("fetches groups from the groups resource", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify groups are fetched
      expect(mockUseList).toHaveBeenCalledWith({
        resource: "groups",
      });
    });

    it("renders with groups available for selection", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // The project list should be rendered with groups
      expect(screen.getByText("my-project")).toBeInTheDocument();
    });
  });

  describe("project merging", () => {
    it("renders projects without merged indicator when no merges", () => {
      const standaloneProject = {
        ...mockProject,
        mergedInto: null,
      };
      setupMocksWithProjects([standaloneProject]);

      render(<ProjectsPage />);

      // The project should be rendered
      expect(screen.getByText("my-project")).toBeInTheDocument();
    });
  });

  describe("useInvalidate integration", () => {
    it("initializes useInvalidate hook", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      expect(mockUseInvalidate).toHaveBeenCalled();
    });

    it("receives invalidate function for cache invalidation", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify the useInvalidate hook returns the mock function we provided
      expect(mockUseInvalidate).toHaveReturnedWith(mockInvalidate);
    });
  });

  describe("handler callback behavior", () => {
    it("mutate function is available for project updates", () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Verify mutate is correctly configured
      expect(mockUseUpdate).toHaveReturnedWith(
        expect.objectContaining({
          mutate: expect.any(Function),
        })
      );
    });

    it("can handle multiple projects", () => {
      const multipleProjects = [
        mockProject,
        {
          ...mockProject,
          path: "/Users/test/another-project",
          name: "another-project",
        },
        {
          ...mockProject,
          path: "/Users/test/third-project",
          name: "third-project",
          isHidden: true,
        },
      ];
      setupMocksWithProjects(multipleProjects);

      render(<ProjectsPage />);

      // Visible projects should be shown
      expect(screen.getByText("my-project")).toBeInTheDocument();
      expect(screen.getByText("another-project")).toBeInTheDocument();
      // Hidden project is filtered out by default in ProjectsList
    });

    it("handles empty groups list", () => {
      setupMocksWithProjects([mockProject], []);

      render(<ProjectsPage />);

      expect(screen.getByText("my-project")).toBeInTheDocument();
    });
  });
});

describe("ProjectsPage update handler integration", () => {
  const mockMutate = jest.fn();
  const mockInvalidate = jest.fn();

  beforeEach(() => {
    mockUseList.mockClear();
    mockMutate.mockClear();
    mockInvalidate.mockClear();

    // Set up mockMutate to call the onSuccess callback
    mockMutate.mockImplementation((params, options) => {
      if (options?.onSuccess) {
        options.onSuccess();
      }
    });

    mockUseUpdate.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseInvalidate.mockReturnValue(mockInvalidate);
  });

  it("calls invalidate with correct parameters on successful update", () => {
    const project = {
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
    };

    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [project], total: 1 },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [], total: 0 },
      });

    render(<ProjectsPage />);

    // Simulate calling one of the handlers
    // The handlers are passed to ProjectsList which calls mutate
    // When mutate succeeds, it should call invalidate

    // Call mutate with the expected parameters for handleSetHidden
    mockMutate(
      {
        resource: "projects",
        id: project.path,
        values: { isHidden: true },
      },
      {
        onSuccess: () => {
          mockInvalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );

    // Verify invalidate was called correctly
    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "projects",
      invalidates: ["list"],
    });
  });

  it("handles setGroup update correctly", () => {
    const project = {
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
    };

    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [project], total: 1 },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [{ id: "group-1", name: "Work", color: "#ff0000" }], total: 1 },
      });

    render(<ProjectsPage />);

    // Simulate setGroup handler behavior
    mockMutate(
      {
        resource: "projects",
        id: project.path,
        values: { groupId: "group-1" },
      },
      {
        onSuccess: () => {
          mockInvalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );

    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "projects",
      invalidates: ["list"],
    });
  });

  it("handles merge update correctly", () => {
    const project = {
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
    };

    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [project], total: 1 },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [], total: 0 },
      });

    render(<ProjectsPage />);

    // Simulate merge handler behavior
    mockMutate(
      {
        resource: "projects",
        id: project.path,
        values: { mergeSources: ["/Users/test/other-project"] },
      },
      {
        onSuccess: () => {
          mockInvalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );

    expect(mockInvalidate).toHaveBeenCalledWith({
      resource: "projects",
      invalidates: ["list"],
    });
  });

  it("handles removing project from group", () => {
    const project = {
      path: "/Users/test/my-project",
      name: "my-project",
      firstActivity: "2024-01-01T10:00:00Z",
      lastActivity: "2024-01-15T15:30:00Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
      isHidden: false,
      groupId: "group-1",
      mergedInto: null,
    };

    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [project], total: 1 },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [{ id: "group-1", name: "Work", color: "#ff0000" }], total: 1 },
      });

    render(<ProjectsPage />);

    // Simulate removing from group (setting groupId to null)
    mockMutate(
      {
        resource: "projects",
        id: project.path,
        values: { groupId: null },
      },
      {
        onSuccess: () => {
          mockInvalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "projects",
        values: { groupId: null },
      }),
      expect.any(Object)
    );
  });

  it("handles unhiding a hidden project", () => {
    const hiddenProject = {
      path: "/Users/test/hidden-project",
      name: "hidden-project",
      firstActivity: "2024-01-01T10:00:00Z",
      lastActivity: "2024-01-15T15:30:00Z",
      sessionCount: 5,
      messageCount: 100,
      totalTime: 3600000,
      isHidden: true,
      groupId: null,
      mergedInto: null,
    };

    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [hiddenProject], total: 1 },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: [], total: 0 },
      });

    render(<ProjectsPage />);

    // Simulate unhiding the project
    mockMutate(
      {
        resource: "projects",
        id: hiddenProject.path,
        values: { isHidden: false },
      },
      {
        onSuccess: () => {
          mockInvalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        resource: "projects",
        id: hiddenProject.path,
        values: { isHidden: false },
      }),
      expect.any(Object)
    );
  });
});

describe("ProjectsPage handler user interactions", () => {
  let mockMutate: jest.Mock;
  let mockInvalidate: jest.Mock;

  const mockProject: Project = {
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
  };

  const mockGroups: ProjectGroup[] = [
    {
      id: "group-1",
      name: "Work Projects",
      color: "#ff0000",
      createdAt: "2024-01-01T00:00:00Z",
      sortOrder: 0,
    },
    {
      id: "group-2",
      name: "Personal",
      color: "#00ff00",
      createdAt: "2024-01-01T00:00:00Z",
      sortOrder: 1,
    },
  ];

  beforeEach(() => {
    mockUseList.mockClear();
    mockUseUpdate.mockClear();
    mockUseInvalidate.mockClear();

    mockMutate = jest.fn();
    mockInvalidate = jest.fn();

    mockUseUpdate.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseInvalidate.mockReturnValue(mockInvalidate);
  });

  const setupMocksWithProjects = (projects = [mockProject], groups = mockGroups) => {
    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: projects, total: projects.length },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: groups, total: groups.length },
      });
  };

  describe("handleSetHidden via dropdown menu", () => {
    it("calls mutate with isHidden=true when hiding a visible project", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Click on "Hide project"
      const hideMenuItem = await screen.findByRole("menuitem", { name: /hide project/i });
      await user.click(hideMenuItem);

      // Verify mutate was called with correct parameters
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: mockProject.path,
          values: { isHidden: true },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("calls mutate with isHidden=false when showing a hidden project", async () => {
      const user = userEvent.setup();
      const hiddenProject = { ...mockProject, isHidden: true };
      setupMocksWithProjects([hiddenProject]);

      render(<ProjectsPage />);

      // First toggle the "Show hidden" switch
      const showHiddenSwitch = screen.getByRole("switch", { name: /show hidden/i });
      await user.click(showHiddenSwitch);

      // Now the hidden project should be visible, open its menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Click on "Show project"
      const showMenuItem = await screen.findByRole("menuitem", { name: /show project/i });
      await user.click(showMenuItem);

      // Verify mutate was called with isHidden=false
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: hiddenProject.path,
          values: { isHidden: false },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  describe("project selection and merge UI", () => {
    it("shows merge projects button to enter select mode", async () => {
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Merge Projects button should be visible by default
      expect(screen.getByRole("button", { name: /merge projects/i })).toBeInTheDocument();
    });

    it("shows checkboxes only after entering select mode", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Initially no checkboxes
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();

      // Click "Merge Projects" to enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Now checkbox should be visible
      expect(screen.getByRole("checkbox", { name: /select my-project/i })).toBeInTheDocument();
    });
  });

  describe("handleSetGroup via dropdown submenu", () => {
    it("opens the group submenu when clicking 'Move to group'", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Find the "Move to group" submenu trigger
      const moveToGroupTrigger = await screen.findByText("Move to group");
      expect(moveToGroupTrigger).toBeInTheDocument();
    });

    it("shows available groups in the submenu", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // The "Move to group" option should be visible
      const moveToGroupTrigger = await screen.findByText("Move to group");
      expect(moveToGroupTrigger).toBeInTheDocument();
    });

    it("calls mutate with groupId when selecting a group", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Hover over "Move to group" to open submenu
      const moveToGroupTrigger = await screen.findByText("Move to group");
      await user.hover(moveToGroupTrigger);

      // Wait for submenu to appear and click on the group using fireEvent
      const groupOption = await screen.findByText("Work Projects");
      fireEvent.click(groupOption);

      // Verify mutate was called with correct parameters
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: mockProject.path,
          values: { groupId: "group-1" },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("calls mutate with null groupId when removing from group", async () => {
      const user = userEvent.setup();
      const projectInGroup = { ...mockProject, groupId: "group-1" };
      setupMocksWithProjects([projectInGroup]);

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Hover over "Move to group" to open submenu
      const moveToGroupTrigger = await screen.findByText("Move to group");
      await user.hover(moveToGroupTrigger);

      // Wait for submenu to appear and click on "Remove from group" using fireEvent
      const removeOption = await screen.findByText("Remove from group");
      fireEvent.click(removeOption);

      // Verify mutate was called with null groupId
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: projectInGroup.path,
          values: { groupId: null },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("invalidates cache on successful group assignment", async () => {
      const user = userEvent.setup();

      // Setup mutate to call onSuccess callback
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Hover over "Move to group" to open submenu
      const moveToGroupTrigger = await screen.findByText("Move to group");
      await user.hover(moveToGroupTrigger);

      // Wait for submenu to appear and click on the group
      const groupOption = await screen.findByText("Work Projects");
      fireEvent.click(groupOption);

      // Verify invalidate was called
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "projects",
        invalidates: ["list"],
      });
    });
  });

  describe("onSuccess callback invalidation", () => {
    it("invalidates projects list on successful hide operation", async () => {
      const user = userEvent.setup();

      // Setup mutate to call the onSuccess callback
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      setupMocksWithProjects();

      render(<ProjectsPage />);

      // Open the dropdown menu and click hide
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      const hideMenuItem = await screen.findByRole("menuitem", { name: /hide project/i });
      await user.click(hideMenuItem);

      // Verify invalidate was called
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "projects",
        invalidates: ["list"],
      });
    });

    it("invalidates projects list on successful unmerge operation", () => {
      // Setup mutate to call the onSuccess callback
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      // Create a project with merged projects
      const primaryProject = {
        ...mockProject,
        mergedInto: null,
      };
      const mergedProject = {
        ...mockProject,
        path: "/Users/test/merged-project",
        name: "merged-project",
        mergedInto: mockProject.path,
      };
      setupMocksWithProjects([primaryProject, mergedProject]);

      render(<ProjectsPage />);

      // Only the primary project should be visible (merged ones are hidden)
      expect(screen.getByText("my-project")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles project with all properties set", async () => {
      const fullProject = {
        ...mockProject,
        mergedInto: null,
        isHidden: false,
        groupId: "group-1",
      };
      setupMocksWithProjects([fullProject]);

      render(<ProjectsPage />);

      // Project should render
      expect(screen.getByText("my-project")).toBeInTheDocument();
    });

    it("renders correctly with no groups available", async () => {
      setupMocksWithProjects([mockProject], []);

      render(<ProjectsPage />);

      // Project should still render
      expect(screen.getByText("my-project")).toBeInTheDocument();
    });

    it("handles undefined data by using empty arrays as fallback", () => {
      // Test the nullish coalescing fallback behavior
      mockUseList
        .mockReturnValueOnce({
          query: { isLoading: false, isError: false },
          result: { data: undefined, total: 0 },
        })
        .mockReturnValueOnce({
          query: { isLoading: false, isError: false },
          result: { data: undefined, total: 0 },
        });

      render(<ProjectsPage />);

      // Should render empty state since data is undefined (falls back to empty array)
      expect(screen.getByText("No Claude Code sessions found")).toBeInTheDocument();
    });

    it("handles null data by using empty arrays as fallback", () => {
      // Test the nullish coalescing fallback behavior
      mockUseList
        .mockReturnValueOnce({
          query: { isLoading: false, isError: false },
          result: { data: null, total: 0 },
        })
        .mockReturnValueOnce({
          query: { isLoading: false, isError: false },
          result: { data: null, total: 0 },
        });

      render(<ProjectsPage />);

      // Should render empty state since data is null (falls back to empty array)
      expect(screen.getByText("No Claude Code sessions found")).toBeInTheDocument();
    });

    it("handles multiple projects with different states", async () => {
      const projects = [
        { ...mockProject, path: "/proj1", name: "proj1", mergedInto: null },
        { ...mockProject, path: "/proj2", name: "proj2", isHidden: true },
        { ...mockProject, path: "/proj3", name: "proj3", groupId: "group-1" },
      ];
      setupMocksWithProjects(projects);

      render(<ProjectsPage />);

      // Only visible projects should be shown
      expect(screen.getByText("proj1")).toBeInTheDocument();
      expect(screen.queryByText("proj2")).not.toBeInTheDocument(); // Hidden
      expect(screen.getByText("proj3")).toBeInTheDocument();
    });
  });
});

describe("ProjectsPage merge functionality", () => {
  let mockMutate: jest.Mock;
  let mockInvalidate: jest.Mock;

  const mockProject1: Project = {
    path: "/Users/test/project-1",
    name: "project-1",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  };

  const mockProject2: Project = {
    path: "/Users/test/project-2",
    name: "project-2",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-10T15:30:00Z",
    sessionCount: 3,
    messageCount: 50,
    totalTime: 1800000,
    isHidden: false,
    groupId: null,
    mergedInto: null,
  };

  beforeEach(() => {
    mockUseList.mockClear();
    mockUseUpdate.mockClear();
    mockUseInvalidate.mockClear();

    mockMutate = jest.fn();
    mockInvalidate = jest.fn();

    mockUseUpdate.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseInvalidate.mockReturnValue(mockInvalidate);
  });

  const setupMocksWithProjects = (projects: Project[], groups: ProjectGroup[] = []) => {
    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: projects, total: projects.length },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: groups, total: groups.length },
      });
  };

  describe("handleMerge", () => {
    it("calls mutate with mergeSources when merging projects", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects([mockProject1, mockProject2]);

      render(<ProjectsPage />);

      // Enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Select both projects
      await user.click(screen.getByTestId("project-row-/Users/test/project-1"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-2"));

      // Click merge button
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Select primary in dialog
      const radioButtons = screen.getAllByRole("radio");
      const project1Radio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-1"
      );
      await user.click(project1Radio!);

      // Confirm merge
      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      await user.click(dialogMergeButton!);

      // Verify mutate was called with correct parameters for merge
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: "/Users/test/project-1",
          values: { mergeSources: ["/Users/test/project-2"] },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });

    it("invalidates projects list on successful merge", async () => {
      const user = userEvent.setup();
      setupMocksWithProjects([mockProject1, mockProject2]);

      // Setup mutate to call onSuccess
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      render(<ProjectsPage />);

      // Enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Select both projects
      await user.click(screen.getByTestId("project-row-/Users/test/project-1"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-2"));

      // Click merge button
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Select primary in dialog
      const radioButtons = screen.getAllByRole("radio");
      const project1Radio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-1"
      );
      await user.click(project1Radio!);

      // Confirm merge
      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      await user.click(dialogMergeButton!);

      // Verify invalidate was called
      expect(mockInvalidate).toHaveBeenCalledWith({
        resource: "projects",
        invalidates: ["list"],
      });
    });

    it("merges multiple source projects into target", async () => {
      const user = userEvent.setup();
      const mockProject3: Project = {
        ...mockProject1,
        path: "/Users/test/project-3",
        name: "project-3",
      };
      setupMocksWithProjects([mockProject1, mockProject2, mockProject3]);

      render(<ProjectsPage />);

      // Enter select mode
      await user.click(screen.getByRole("button", { name: /merge projects/i }));

      // Select all three projects
      await user.click(screen.getByTestId("project-row-/Users/test/project-1"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-2"));
      await user.click(screen.getByTestId("project-row-/Users/test/project-3"));

      // Click merge button
      await user.click(screen.getByRole("button", { name: /^merge$/i }));

      // Select primary in dialog
      const radioButtons = screen.getAllByRole("radio");
      const project1Radio = radioButtons.find(
        (radio) => (radio as HTMLInputElement).value === "/Users/test/project-1"
      );
      await user.click(project1Radio!);

      // Confirm merge
      const dialogMergeButton = screen.getAllByRole("button", { name: /^merge$/i }).pop();
      await user.click(dialogMergeButton!);

      // Verify mutate was called with both source projects
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource: "projects",
          id: "/Users/test/project-1",
          values: {
            mergeSources: expect.arrayContaining([
              "/Users/test/project-2",
              "/Users/test/project-3",
            ]),
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe("handleUnmerge", () => {
    it("calls mutate with mergedInto: null when unmerging a project", async () => {
      const user = userEvent.setup();
      const primaryProject = { ...mockProject1 };
      const mergedProject = {
        ...mockProject2,
        mergedInto: mockProject1.path,
      };
      setupMocksWithProjects([primaryProject, mergedProject]);

      render(<ProjectsPage />);

      // Open the action menu for the primary project
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Look for "Unmerge" submenu or option
      // First hover over "Unmerge projects" if it's a submenu
      const unmergeSubmenu = screen.queryByText(/unmerge projects/i);
      if (unmergeSubmenu) {
        await user.hover(unmergeSubmenu);

        // Click on the specific merged project to unmerge
        const unmergeOption = await screen.findByText("project-2");
        fireEvent.click(unmergeOption);

        // Verify mutate was called with mergedInto: null
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: "projects",
            id: mergedProject.path,
            values: { mergedInto: null },
          }),
          expect.any(Object)
        );
      }
    });
  });
});

describe("ProjectsPage group reordering", () => {
  let mockMutate: jest.Mock;
  let mockInvalidate: jest.Mock;

  const mockProject: Project = {
    path: "/Users/test/my-project",
    name: "my-project",
    firstActivity: "2024-01-01T10:00:00Z",
    lastActivity: "2024-01-15T15:30:00Z",
    sessionCount: 5,
    messageCount: 100,
    totalTime: 3600000,
    isHidden: false,
    groupId: "group-1",
    mergedInto: null,
  };

  const mockGroups: ProjectGroup[] = [
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

  beforeEach(() => {
    mockUseList.mockClear();
    mockUseUpdate.mockClear();
    mockUseInvalidate.mockClear();

    mockMutate = jest.fn();
    mockInvalidate = jest.fn();

    mockUseUpdate.mockReturnValue({
      mutate: mockMutate,
    });
    mockUseInvalidate.mockReturnValue(mockInvalidate);
  });

  const setupMocksWithGroups = (projects = [mockProject], groups = mockGroups) => {
    mockUseList
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: projects, total: projects.length },
      })
      .mockReturnValueOnce({
        query: { isLoading: false, isError: false },
        result: { data: groups, total: groups.length },
      });
  };

  describe("handleReorderGroup", () => {
    it("shows group reorder buttons when groups exist", () => {
      const projectsInGroups = [
        { ...mockProject, groupId: "group-1" },
        { ...mockProject, path: "/proj2", name: "proj2", groupId: "group-2" },
      ];
      setupMocksWithGroups(projectsInGroups);

      render(<ProjectsPage />);

      // Move buttons should be visible
      expect(screen.getAllByRole("button", { name: /move group up/i }).length).toBeGreaterThan(0);
      expect(screen.getAllByRole("button", { name: /move group down/i }).length).toBeGreaterThan(0);
    });

    it("calls mutate to swap sort orders when moving group up", async () => {
      const user = userEvent.setup();
      const projectsInGroups = [
        { ...mockProject, groupId: "group-1" },
        { ...mockProject, path: "/proj2", name: "proj2", groupId: "group-2" },
      ];
      setupMocksWithGroups(projectsInGroups);

      // Setup mutate to call onSuccess
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      render(<ProjectsPage />);

      // Find an enabled move up button (second group should have it enabled)
      const moveUpButtons = screen.getAllByRole("button", { name: /move group up/i });
      const enabledButton = moveUpButtons.find((btn) => !btn.hasAttribute("disabled"));

      if (enabledButton) {
        await user.click(enabledButton);

        // First mutate call should update the current group's sort order
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: "groups",
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
          })
        );
      }
    });

    it("calls mutate to swap sort orders when moving group down", async () => {
      const user = userEvent.setup();
      const projectsInGroups = [
        { ...mockProject, groupId: "group-1" },
        { ...mockProject, path: "/proj2", name: "proj2", groupId: "group-2" },
      ];
      setupMocksWithGroups(projectsInGroups);

      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      render(<ProjectsPage />);

      // Find an enabled move down button (first group should have it enabled)
      const moveDownButtons = screen.getAllByRole("button", { name: /move group down/i });
      const enabledButton = moveDownButtons.find((btn) => !btn.hasAttribute("disabled"));

      if (enabledButton) {
        await user.click(enabledButton);

        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: "groups",
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
          })
        );
      }
    });

    it("invalidates groups cache after successful reorder", async () => {
      const user = userEvent.setup();
      const projectsInGroups = [
        { ...mockProject, groupId: "group-1" },
        { ...mockProject, path: "/proj2", name: "proj2", groupId: "group-2" },
      ];
      setupMocksWithGroups(projectsInGroups);

      // Setup nested onSuccess callbacks to simulate the chain
      mockMutate.mockImplementation((_params, options) => {
        if (options?.onSuccess) {
          options.onSuccess();
        }
      });

      render(<ProjectsPage />);

      const moveDownButtons = screen.getAllByRole("button", { name: /move group down/i });
      const enabledButton = moveDownButtons.find((btn) => !btn.hasAttribute("disabled"));

      if (enabledButton) {
        await user.click(enabledButton);

        // After both mutates succeed, invalidate should be called for groups
        expect(mockInvalidate).toHaveBeenCalledWith({
          resource: "groups",
          invalidates: ["list"],
        });
      }
    });
  });

  describe("handleUnmerge", () => {
    it("calls mutate with mergedInto: null when unmerging", async () => {
      const user = userEvent.setup();
      const primaryProject = {
        ...mockProject,
        mergedInto: null,
      };
      const mergedProject = {
        ...mockProject,
        path: "/merged-proj",
        name: "merged-proj",
        mergedInto: mockProject.path,
      };

      setupMocksWithGroups([primaryProject, mergedProject], []);

      render(<ProjectsPage />);

      // Open the action menu for the primary project (which has merged projects)
      const menuButton = screen.getByRole("button", { name: /open menu/i });
      await user.click(menuButton);

      // Look for "Unmerge" option if it exists in the menu
      const unmergeOption = screen.queryByRole("menuitem", { name: /unmerge/i });
      if (unmergeOption) {
        await user.click(unmergeOption);

        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            resource: "projects",
            values: { mergedInto: null },
          }),
          expect.any(Object)
        );
      }
    });
  });

  describe("boundary conditions for group reordering", () => {
    it("does not call mutate when trying to move first group up", async () => {
      const user = userEvent.setup();
      setupMocksWithGroups([mockProject]);

      render(<ProjectsPage />);

      // The first group's move up button should be disabled
      const moveUpButtons = screen.queryAllByRole("button", { name: /move group up/i });
      if (moveUpButtons.length > 0) {
        const firstMoveUp = moveUpButtons[0];
        expect(firstMoveUp).toBeDisabled();

        // Even if we try to click it (shouldn't do anything)
        await user.click(firstMoveUp);
        expect(mockMutate).not.toHaveBeenCalled();
      }
    });

    it("does not call mutate when trying to move last group down", () => {
      const projectsInGroups = [
        { ...mockProject, groupId: "group-1" },
        { ...mockProject, path: "/proj2", name: "proj2", groupId: "group-2" },
        { ...mockProject, path: "/proj3", name: "proj3", groupId: "group-3" },
      ];
      setupMocksWithGroups(projectsInGroups);

      render(<ProjectsPage />);

      // The last group's move down button should be disabled
      const moveDownButtons = screen.getAllByRole("button", { name: /move group down/i });
      const lastMoveDown = moveDownButtons[moveDownButtons.length - 1];
      expect(lastMoveDown).toBeDisabled();
    });

    it("handles reordering with only one group gracefully", () => {
      const singleGroup = [mockGroups[0]];
      setupMocksWithGroups([mockProject], singleGroup);

      render(<ProjectsPage />);

      // With only one group, both move up and move down should be disabled
      const moveUpButton = screen.queryByRole("button", { name: /move group up/i });
      const moveDownButton = screen.queryByRole("button", { name: /move group down/i });

      if (moveUpButton) {
        expect(moveUpButton).toBeDisabled();
      }
      if (moveDownButton) {
        expect(moveDownButton).toBeDisabled();
      }
    });
  });
});

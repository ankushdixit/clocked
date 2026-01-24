/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent, act } from "@testing-library/react";
import ProjectDetailPage from "../page";
import { useOne, useList, useUpdate, useInvalidate } from "@refinedev/core";
import type { Project, Session } from "@/types/electron";

// Mock @refinedev/core
jest.mock("@refinedev/core", () => ({
  useOne: jest.fn(),
  useList: jest.fn(),
  useUpdate: jest.fn(),
  useInvalidate: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => ({
    path: encodeURIComponent("/Users/test/my-project"),
  }),
}));

// Mock child components
jest.mock("@/components/projects/TimeLayersCard", () => ({
  TimeLayersCard: (props: {
    wallClockStart: string;
    wallClockEnd: string;
    sessionTime: number;
  }) => (
    <div data-testid="time-layers-card">
      <span data-testid="wall-clock-start">{props.wallClockStart}</span>
      <span data-testid="wall-clock-end">{props.wallClockEnd}</span>
      <span data-testid="session-time">{props.sessionTime}</span>
    </div>
  ),
}));

jest.mock("@/components/projects/ActivityMetricsCard", () => ({
  ActivityMetricsCard: (props: { sessionCount: number; messageCount: number }) => (
    <div data-testid="activity-metrics-card">
      <span data-testid="session-count">{props.sessionCount}</span>
      <span data-testid="message-count">{props.messageCount}</span>
    </div>
  ),
}));

jest.mock("@/components/projects/HumanVsAICard", () => ({
  HumanVsAICard: () => <div data-testid="human-vs-ai-card" />,
}));

jest.mock("@/components/projects/CostAnalysisCard", () => ({
  CostAnalysisCard: () => <div data-testid="cost-analysis-card" />,
}));

jest.mock("@/components/projects/ToolUsageCard", () => ({
  ToolUsageCard: () => <div data-testid="tool-usage-card" />,
}));

jest.mock("@/components/projects/MergedProjectsCard", () => ({
  MergedProjectsCard: (props: {
    mergedProjects: Project[];
    onUnmerge?: (path: string) => void;
  }) => (
    <div data-testid="merged-projects-card">
      {props.mergedProjects.map((p) => (
        <div key={p.path}>
          <span data-testid={`merged-${p.path}`}>{p.name}</span>
          {props.onUnmerge && (
            <button data-testid={`unmerge-${p.path}`} onClick={() => props.onUnmerge?.(p.path)}>
              Unmerge
            </button>
          )}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/projects/SessionsList", () => ({
  SessionsList: (props: {
    sessions: Session[];
    projectPath: string;
    onResumeSession?: (sessionId: string, projectPath: string) => void;
    loadingSessionId?: string | null;
  }) => (
    <div data-testid="sessions-list">
      {props.sessions.map((s) => (
        <div key={s.id} data-testid={`session-${s.id}`}>
          <span>{s.summary}</span>
          <button
            data-testid={`resume-session-${s.id}`}
            onClick={() => props.onResumeSession?.(s.id, props.projectPath)}
          >
            Resume
          </button>
          {props.loadingSessionId === s.id && (
            <span data-testid={`loading-${s.id}`}>Loading...</span>
          )}
        </div>
      ))}
    </div>
  ),
}));

const mockUseOne = useOne as jest.Mock;
const mockUseList = useList as jest.Mock;
const mockUseUpdate = useUpdate as jest.Mock;
const mockUseInvalidate = useInvalidate as jest.Mock;

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

const createMockSession = (overrides: Partial<Session> = {}): Session => ({
  id: "session-1",
  projectPath: "/Users/test/my-project",
  created: "2024-01-10T10:00:00Z",
  modified: "2024-01-10T11:00:00Z",
  duration: 3600000,
  messageCount: 50,
  summary: "Test session",
  firstPrompt: "Hello",
  gitBranch: "main",
  ...overrides,
});

// Helper to set up mocks for a standard render
function setupMocks(options: {
  project?: Project | null;
  sessions?: Session[];
  allProjects?: Project[];
  isLoading?: boolean;
}) {
  const {
    project = createMockProject(),
    sessions = [],
    allProjects = [],
    isLoading = false,
  } = options;

  mockUseUpdate.mockReturnValue({ mutate: jest.fn() });
  mockUseInvalidate.mockReturnValue(jest.fn());

  mockUseOne.mockReturnValue({
    query: { isLoading },
    result: project,
  });

  // useList is called multiple times and component re-renders, so use mockImplementation
  // to handle any number of calls with the same pattern
  let callCount = 0;
  mockUseList.mockImplementation(() => {
    const callIndex = callCount % 3; // cycles through 3 hook calls
    callCount++;

    if (callIndex === 0) {
      // First call: all projects
      return {
        query: { isLoading },
        result: { data: allProjects },
      };
    } else if (callIndex === 1) {
      // Second call: sessions for project
      return {
        query: { isLoading },
        result: { data: sessions },
      };
    } else {
      // Third call: merged sessions
      return {
        query: { isLoading: false },
        result: { data: [] },
      };
    }
  });
}

describe("ProjectDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  describe("Loading state", () => {
    it("shows loading spinner when project is loading", () => {
      setupMocks({ isLoading: true });
      render(<ProjectDetailPage />);
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });
  });

  describe("Project not found state", () => {
    it("shows not found message when project is null", () => {
      setupMocks({ project: null });
      render(<ProjectDetailPage />);
      expect(screen.getAllByText("Project not found").length).toBeGreaterThanOrEqual(1);
    });

    it("shows back button in not found state", () => {
      setupMocks({ project: null });
      render(<ProjectDetailPage />);
      expect(screen.getByRole("button", { name: /back to projects/i })).toBeInTheDocument();
    });

    it("navigates back when back button clicked in not found state", () => {
      setupMocks({ project: null });
      render(<ProjectDetailPage />);
      fireEvent.click(screen.getByRole("button", { name: /back to projects/i }));
      expect(mockPush).toHaveBeenCalledWith("/projects");
    });
  });

  describe("Successful rendering", () => {
    it("renders project name as page title", () => {
      setupMocks({ project: createMockProject({ name: "test-project" }) });
      render(<ProjectDetailPage />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("test-project");
    });

    it("renders project path below the title", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      expect(screen.getByText("/Users/test/my-project")).toBeInTheDocument();
    });

    it("renders back button", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      expect(screen.getByRole("button", { name: /back to projects/i })).toBeInTheDocument();
    });

    it("navigates to projects list when back button is clicked", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      fireEvent.click(screen.getByRole("button", { name: /back to projects/i }));
      expect(mockPush).toHaveBeenCalledWith("/projects");
    });

    it("renders TimeBreakdownCard", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      expect(screen.getByTestId("time-breakdown-card")).toBeInTheDocument();
    });

    it("renders QuickStatsCard", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      expect(screen.getByTestId("quick-stats-card")).toBeInTheDocument();
    });

    it("renders Recent Sessions section heading", () => {
      setupMocks({});
      render(<ProjectDetailPage />);
      expect(screen.getByText("Recent Sessions")).toBeInTheDocument();
    });

    it("renders SessionsList with sessions", () => {
      const sessions = [
        createMockSession({ id: "session-1", summary: "First session" }),
        createMockSession({ id: "session-2", summary: "Second session" }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);
      expect(screen.getByTestId("sessions-list")).toBeInTheDocument();
      expect(screen.getByTestId("session-session-1")).toBeInTheDocument();
      expect(screen.getByTestId("session-session-2")).toBeInTheDocument();
    });
  });

  describe("Empty sessions state", () => {
    it("shows empty state when project has no sessions", () => {
      setupMocks({ sessions: [] });
      render(<ProjectDetailPage />);
      expect(screen.getByText("No sessions found for this project")).toBeInTheDocument();
    });

    it("does not render SessionsList when no sessions", () => {
      setupMocks({ sessions: [] });
      render(<ProjectDetailPage />);
      expect(screen.queryByTestId("sessions-list")).not.toBeInTheDocument();
    });
  });

  describe("Merged projects", () => {
    it("shows merged badge when project has merged projects", () => {
      const mergedProject = createMockProject({
        path: "/Users/test/merged-project",
        name: "merged-project",
        mergedInto: "/Users/test/my-project",
      });
      setupMocks({ allProjects: [createMockProject(), mergedProject] });
      render(<ProjectDetailPage />);
      expect(screen.getByText("1 merged")).toBeInTheDocument();
    });

    it("renders MergedProjectsCard when project has merged projects", () => {
      const mergedProject = createMockProject({
        path: "/Users/test/merged-project",
        name: "merged-project",
        mergedInto: "/Users/test/my-project",
      });
      setupMocks({ allProjects: [createMockProject(), mergedProject] });
      render(<ProjectDetailPage />);
      expect(screen.getByTestId("merged-projects-card")).toBeInTheDocument();
    });

    it("does not show merged badge when no merged projects", () => {
      setupMocks({ allProjects: [createMockProject()] });
      render(<ProjectDetailPage />);
      expect(screen.queryByText(/merged/)).not.toBeInTheDocument();
    });

    it("does not render MergedProjectsCard when no real merged projects", () => {
      setupMocks({ allProjects: [createMockProject()] });
      render(<ProjectDetailPage />);
      expect(screen.queryByTestId("merged-projects-card")).not.toBeInTheDocument();
    });

    it("calls onUnmerge when unmerge button is clicked", () => {
      const mockMutate = jest.fn();
      const mockInvalidate = jest.fn();
      mockUseUpdate.mockReturnValue({ mutate: mockMutate });
      mockUseInvalidate.mockReturnValue(mockInvalidate);

      const mergedProject = createMockProject({
        path: "/Users/test/merged-project",
        name: "merged-project",
        mergedInto: "/Users/test/my-project",
      });

      mockUseOne.mockReturnValue({
        query: { isLoading: false },
        result: createMockProject(),
      });

      mockUseList
        .mockReturnValueOnce({
          query: { isLoading: false },
          result: { data: [createMockProject(), mergedProject] },
        })
        .mockReturnValueOnce({
          query: { isLoading: false },
          result: { data: [] },
        })
        .mockReturnValueOnce({
          query: { isLoading: false },
          result: { data: [] },
        });

      render(<ProjectDetailPage />);

      // Click the unmerge button for the merged project
      const unmergeButton = screen.getByTestId("unmerge-/Users/test/merged-project");
      fireEvent.click(unmergeButton);

      // Verify updateProject was called with correct params
      expect(mockMutate).toHaveBeenCalledWith(
        {
          resource: "projects",
          id: "/Users/test/merged-project",
          values: { mergedInto: null },
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
        })
      );
    });
  });

  describe("Calculations", () => {
    it("displays session count in hero card", () => {
      const sessions = [
        createMockSession({ duration: 1000000 }),
        createMockSession({ id: "session-2", duration: 2000000 }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);
      // Sessions section header and count displayed
      expect(screen.getByText("Sessions")).toBeInTheDocument();
    });

    it("displays message count in hero card", () => {
      const sessions = [
        createMockSession({ messageCount: 10 }),
        createMockSession({ id: "session-2", messageCount: 20 }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);
      // Messages section header displayed
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });

    it("handles empty sessions array", () => {
      setupMocks({ sessions: [] });
      render(<ProjectDetailPage />);
      // Empty state shown when no sessions
      expect(screen.getByText("No sessions found for this project")).toBeInTheDocument();
    });
  });

  describe("Session resume functionality", () => {
    const mockResume = jest.fn();

    beforeEach(() => {
      mockResume.mockReset();
      // Set up window.electron.sessions.resume mock
      Object.defineProperty(window, "electron", {
        value: {
          sessions: {
            resume: mockResume,
          },
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      // Clean up window.electron mock
      delete (window as unknown as { electron?: unknown }).electron;
    });

    it("successfully resumes a session and shows success message", async () => {
      mockResume.mockResolvedValue({
        success: true,
        message: "Session resumed. Command copied to clipboard - paste in VS Code terminal.",
      });

      const sessions = [createMockSession({ id: "session-123", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      // Click the resume button
      const resumeButton = screen.getByTestId("resume-session-session-123");
      fireEvent.click(resumeButton);

      // Verify resume was called with correct parameters
      expect(mockResume).toHaveBeenCalledWith("session-123", "/Users/test/my-project");

      // Wait for success message to appear
      const successMessage = await screen.findByText(
        "Session resumed. Command copied to clipboard - paste in VS Code terminal."
      );
      expect(successMessage).toBeInTheDocument();
    });

    it("shows error message when session resume fails with error response", async () => {
      mockResume.mockResolvedValue({
        success: false,
        error: "IDE not found. Please check your settings.",
      });

      const sessions = [createMockSession({ id: "session-456", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-456");
      fireEvent.click(resumeButton);

      // Wait for error message to appear
      const errorMessage = await screen.findByText("IDE not found. Please check your settings.");
      expect(errorMessage).toBeInTheDocument();
    });

    it("shows generic error message when resume fails without specific error", async () => {
      mockResume.mockResolvedValue({
        success: false,
      });

      const sessions = [createMockSession({ id: "session-789", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-789");
      fireEvent.click(resumeButton);

      // Wait for generic error message
      const errorMessage = await screen.findByText("Failed to resume session");
      expect(errorMessage).toBeInTheDocument();
    });

    it("shows error message when resume throws an exception", async () => {
      mockResume.mockRejectedValue(new Error("Network connection failed"));

      const sessions = [createMockSession({ id: "session-error", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-error");
      fireEvent.click(resumeButton);

      // Wait for error message from caught exception
      const errorMessage = await screen.findByText("Network connection failed");
      expect(errorMessage).toBeInTheDocument();
    });

    it("shows generic error when exception is not an Error instance", async () => {
      mockResume.mockRejectedValue("Unknown error occurred");

      const sessions = [createMockSession({ id: "session-unknown", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-unknown");
      fireEvent.click(resumeButton);

      // Wait for generic error message
      const errorMessage = await screen.findByText("Failed to resume session");
      expect(errorMessage).toBeInTheDocument();
    });

    it("shows loading indicator while resuming session", async () => {
      // Create a promise that we can control
      let resolveResume: (value: { success: boolean }) => void;
      const resumePromise = new Promise<{ success: boolean }>((resolve) => {
        resolveResume = resolve;
      });
      mockResume.mockReturnValue(resumePromise);

      const sessions = [createMockSession({ id: "session-loading", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-loading");
      fireEvent.click(resumeButton);

      // Loading indicator should appear immediately
      expect(screen.getByTestId("loading-session-loading")).toBeInTheDocument();

      // Resolve the promise
      resolveResume!({ success: true });

      // Note: The loading state clears after 500ms timeout, but we verify it was shown
    });

    it("allows dismissing error message by clicking dismiss button", async () => {
      mockResume.mockResolvedValue({
        success: false,
        error: "Session file not found",
      });

      const sessions = [
        createMockSession({ id: "session-dismiss-error", summary: "Test session" }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-dismiss-error");
      fireEvent.click(resumeButton);

      // Wait for error message to appear
      const errorMessage = await screen.findByText("Session file not found");
      expect(errorMessage).toBeInTheDocument();

      // Find and click the dismiss button (it's a sibling of the error message)
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      fireEvent.click(dismissButton);

      // Error message should be gone
      expect(screen.queryByText("Session file not found")).not.toBeInTheDocument();
    });

    it("allows dismissing success message by clicking dismiss button", async () => {
      mockResume.mockResolvedValue({
        success: true,
        message: "Session opened in terminal",
      });

      const sessions = [
        createMockSession({ id: "session-dismiss-success", summary: "Test session" }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-dismiss-success");
      fireEvent.click(resumeButton);

      // Wait for success message to appear
      const successMessage = await screen.findByText("Session opened in terminal");
      expect(successMessage).toBeInTheDocument();

      // Find and click the dismiss button
      const dismissButton = screen.getByRole("button", { name: /dismiss/i });
      fireEvent.click(dismissButton);

      // Success message should be gone
      expect(screen.queryByText("Session opened in terminal")).not.toBeInTheDocument();
    });

    it("does not call resume when window.electron is not available", () => {
      // Remove window.electron
      delete (window as unknown as { electron?: unknown }).electron;

      const sessions = [createMockSession({ id: "session-no-electron", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-no-electron");
      fireEvent.click(resumeButton);

      // mockResume should not be called since window.electron doesn't exist
      expect(mockResume).not.toHaveBeenCalled();
    });

    it("clears previous error when starting a new resume", async () => {
      mockResume
        .mockResolvedValueOnce({
          success: false,
          error: "First error",
        })
        .mockResolvedValueOnce({
          success: true,
          message: "Second attempt succeeded",
        });

      const sessions = [
        createMockSession({ id: "session-clear-1", summary: "Session 1" }),
        createMockSession({ id: "session-clear-2", summary: "Session 2" }),
      ];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      // Click first session - should show error
      const resumeButton1 = screen.getByTestId("resume-session-session-clear-1");
      fireEvent.click(resumeButton1);

      // Wait for error message
      await screen.findByText("First error");

      // Click second session - error should clear and show success
      const resumeButton2 = screen.getByTestId("resume-session-session-clear-2");
      fireEvent.click(resumeButton2);

      // Wait for success message
      await screen.findByText("Second attempt succeeded");

      // Previous error should be gone
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });

    it("auto-dismisses success message after timeout", async () => {
      jest.useFakeTimers();

      mockResume.mockResolvedValue({
        success: true,
        message: "Session resumed successfully",
      });

      const sessions = [createMockSession({ id: "session-auto-dismiss", summary: "Test session" })];
      setupMocks({ sessions });
      render(<ProjectDetailPage />);

      const resumeButton = screen.getByTestId("resume-session-session-auto-dismiss");

      // Click must be wrapped in act since it triggers async state updates
      await act(async () => {
        fireEvent.click(resumeButton);
        // Let promises resolve
        await Promise.resolve();
      });

      // Verify message is shown
      expect(screen.getByText("Session resumed successfully")).toBeInTheDocument();

      // Fast-forward 8 seconds (the auto-dismiss timeout) - wrap in act to handle state updates
      await act(async () => {
        jest.advanceTimersByTime(8000);
      });

      // Success message should be auto-dismissed
      expect(screen.queryByText("Session resumed successfully")).not.toBeInTheDocument();

      jest.useRealTimers();
    });
  });
});

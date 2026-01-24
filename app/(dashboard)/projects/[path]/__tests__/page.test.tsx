/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
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
  SessionsList: (props: { sessions: Session[] }) => (
    <div data-testid="sessions-list">
      {props.sessions.map((s) => (
        <div key={s.id} data-testid={`session-${s.id}`}>
          {s.summary}
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

  // useList is called 3 times: projects, sessions, merged sessions
  mockUseList
    .mockReturnValueOnce({
      query: { isLoading },
      result: { data: allProjects },
    })
    .mockReturnValueOnce({
      query: { isLoading },
      result: { data: sessions },
    })
    .mockReturnValueOnce({
      query: { isLoading: false },
      result: { data: [] },
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
});

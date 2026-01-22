import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";

// Mock date-fns to return consistent dates - only mock functions used in page.tsx
// ActivityHeatmap uses its own date-fns functions which should use real implementation
jest.mock("date-fns", () => {
  const actual = jest.requireActual("date-fns");
  return {
    ...actual,
    format: jest.fn((date, formatStr) => {
      if (formatStr === "yyyy-MM") return "2026-01";
      if (formatStr === "MMMM yyyy") return "January 2026";
      // Let other formats pass through to real implementation
      return actual.format(date, formatStr);
    }),
    endOfMonth: jest.fn(() => new Date("2026-01-31")),
    differenceInDays: jest.fn(() => 9),
  };
});

// Mock window.electron
const mockElectron = {
  platform: "darwin" as NodeJS.Platform,
  getAppVersion: jest.fn(),
  getHealth: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
  window: {
    minimize: jest.fn(),
    maximize: jest.fn(),
    close: jest.fn(),
    isMaximized: jest.fn(),
  },
  projects: {
    getAll: jest.fn(),
    getByPath: jest.fn(),
    getCount: jest.fn(),
    setHidden: jest.fn(),
    setGroup: jest.fn(),
    setDefault: jest.fn(),
    getDefault: jest.fn(),
  },
  groups: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sessions: {
    getAll: jest.fn(),
    getByProject: jest.fn(),
    getByDateRange: jest.fn(),
    getCount: jest.fn(),
  },
  data: {
    sync: jest.fn(),
    status: jest.fn(),
  },
  analytics: {
    getMonthlySummary: jest.fn(),
  },
};

const mockSummary = {
  month: "2026-01",
  totalSessions: 127,
  totalActiveTime: 564120000, // ~156h 42m
  estimatedApiCost: 847.23,
  humanTime: 0,
  claudeTime: 0,
  dailyActivity: [
    { date: "2026-01-15", sessionCount: 3, totalTime: 3600000 },
    { date: "2026-01-16", sessionCount: 5, totalTime: 7200000 },
  ],
  topProjects: [
    {
      path: "/Users/test/raincheck",
      name: "raincheck",
      sessionCount: 53,
      totalTime: 1024440000,
      estimatedCost: 412.5,
    },
    {
      path: "/Users/test/solokit",
      name: "solokit",
      sessionCount: 25,
      totalTime: 252900000,
      estimatedCost: 156.2,
    },
  ],
};

describe("DashboardPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron;
  });

  describe("when not in Electron", () => {
    it("renders month header", () => {
      render(<DashboardPage />);
      expect(screen.getByText("JANUARY 2026 USAGE")).toBeInTheDocument();
    });

    it("shows browser mode message when not in Electron", async () => {
      render(<DashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText("Running in browser mode - connect via Electron for live data")
        ).toBeInTheDocument();
      });
    });
  });

  describe("when in Electron", () => {
    beforeEach(() => {
      window.electron = mockElectron;
    });

    it("renders loading state initially", () => {
      mockElectron.analytics.getMonthlySummary.mockImplementation(
        () => new Promise(() => {}) // Never resolves - stays loading
      );

      render(<DashboardPage />);
      // Check for loading spinner (Loader2 renders as SVG)
      expect(document.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders month header with usage data", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("JANUARY 2026 USAGE")).toBeInTheDocument();
      });
    });

    it("renders days remaining", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("9 days remaining")).toBeInTheDocument();
      });
    });

    it("renders sessions metric card", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Sessions")).toBeInTheDocument();
        expect(screen.getByText("127")).toBeInTheDocument();
      });
    });

    it("renders session time metric card", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Session Time")).toBeInTheDocument();
        // 564120000ms = 156h 42m
        expect(screen.getByText("156h 42m")).toBeInTheDocument();
      });
    });

    it("renders API cost metric card", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("API Cost")).toBeInTheDocument();
        expect(screen.getByText("$847.23")).toBeInTheDocument();
      });
    });

    it("renders subscription metric card", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Subscription")).toBeInTheDocument();
        expect(screen.getByText("$100.00")).toBeInTheDocument();
      });
    });

    it("renders value multiplier metric card", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Value")).toBeInTheDocument();
        expect(screen.getByText("8.47x")).toBeInTheDocument();
      });
    });

    it("renders human:AI ratio metric card with placeholder when no data", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Human : AI")).toBeInTheDocument();
        expect(screen.getByText("\u2014")).toBeInTheDocument(); // em dash placeholder
      });
    });

    it("renders activity heatmap section", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Activity")).toBeInTheDocument();
      });
    });

    it("renders top projects section", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Top Projects")).toBeInTheDocument();
        expect(screen.getByText("raincheck")).toBeInTheDocument();
        expect(screen.getByText("solokit")).toBeInTheDocument();
      });
    });

    it("shows error state when API returns error", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        error: "Database error",
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Database error")).toBeInTheDocument();
      });
    });

    it("shows error state when API throws", async () => {
      mockElectron.analytics.getMonthlySummary.mockRejectedValue(new Error("Network error"));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("has proper spacing between sections", async () => {
      mockElectron.analytics.getMonthlySummary.mockResolvedValue({
        summary: mockSummary,
      });

      const { container } = render(<DashboardPage />);

      await waitFor(() => {
        const wrapper = container.querySelector(".space-y-6");
        expect(wrapper).toBeInTheDocument();
      });
    });
  });
});

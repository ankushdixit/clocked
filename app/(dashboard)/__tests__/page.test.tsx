import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";

// Mock @refinedev/core
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(() => ({
    result: { data: [] },
    query: { isLoading: false },
  })),
}));

// Mock the mockData module to have predictable values
jest.mock("@/lib/mockData", () => ({
  mockSummary: {
    dailyActivity: [
      { date: "2026-01-01", sessionCount: 10, totalTime: 36000000 },
      { date: "2026-01-02", sessionCount: 15, totalTime: 54000000 },
      { date: "2026-01-03", sessionCount: 12, totalTime: 43200000 },
    ],
  },
  generateCostTrend: () => [
    { date: "2026-01-01", cost: 100, cumulative: 100 },
    { date: "2026-01-02", cost: 120, cumulative: 220 },
    { date: "2026-01-03", cost: 110, cumulative: 330 },
  ],
  generateDailyComparison: () => ({
    today: { sessions: 8, time: 21600000, cost: 89.55 },
    average: { sessions: 14.5, time: 32400000, cost: 105.54 },
  }),
  generateQuickStats: () => ({
    busiestDay: { date: "2026-01-07", sessions: 22 },
    longestSession: { project: "raincheck", duration: 14400000 },
    mostActiveProject: "www",
    avgSessionLength: 8658000,
    avgDailySessions: 14.5,
    peakHour: 14,
    totalMessages: 4872,
    avgCostPerSession: 7.26,
  }),
  generateHourlyDistribution: () =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      sessions: Math.floor(Math.random() * 20),
    })),
  generateEnhancedProjects: () => [
    {
      path: "/test/raincheck",
      name: "raincheck",
      sessionCount: 26,
      totalTime: 960000,
      estimatedCost: 810.38,
      weeklyTrend: [3, 5, 2, 4, 6, 3, 3],
      color: "#10b981",
    },
    {
      path: "/test/www",
      name: "www",
      sessionCount: 145,
      totalTime: 720000,
      estimatedCost: 629.73,
      weeklyTrend: [5, 4, 6, 3, 5, 4, 4],
      color: "#3b82f6",
    },
  ],
}));

describe("DashboardPage Component", () => {
  describe("Section 1: Hero Metrics", () => {
    it("renders HeroMetricsRow with 4 hero cards", () => {
      const { container } = render(<DashboardPage />);
      // Hero row should have 4 cards
      const heroCards = container.querySelectorAll(".rounded-xl.bg-muted\\/50");
      expect(heroCards.length).toBe(4);
    });

    it("renders Sessions metric", () => {
      render(<DashboardPage />);
      // "Sessions" appears in multiple places, so use getAllByText
      const sessionsLabels = screen.getAllByText("Sessions");
      expect(sessionsLabels.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("349")).toBeInTheDocument();
    });

    it("renders Session Time metric", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Session Time")).toBeInTheDocument();
      expect(screen.getByText("844h 18m")).toBeInTheDocument();
    });

    it("renders API Cost metric", () => {
      render(<DashboardPage />);
      expect(screen.getByText("API Cost")).toBeInTheDocument();
      expect(screen.getByText("$2,532.92")).toBeInTheDocument();
    });

    it("renders Value metric with highlight", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Value")).toBeInTheDocument();
      expect(screen.getByText("25.33x")).toBeInTheDocument();
      // Value should be highlighted (emerald)
      const valueElement = screen.getByText("25.33x");
      expect(valueElement).toHaveClass("text-emerald-600");
    });
  });

  describe("Section 2: Today vs Average + Claude Limits + Quick Stats", () => {
    it("renders Today vs Daily Average card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Today vs Daily Average")).toBeInTheDocument();
    });

    it("renders Claude Max Limits card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Claude Max Limits")).toBeInTheDocument();
    });

    it("renders Quick Stats card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Quick Stats")).toBeInTheDocument();
    });
  });

  describe("Section 3: Activity Patterns", () => {
    it("renders Activity heatmap", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });

    it("renders Session Distribution chart", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Session Distribution")).toBeInTheDocument();
    });

    it("renders Cumulative Cost chart", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Cumulative Cost")).toBeInTheDocument();
    });
  });

  describe("Section 4: Projects & Time Insights", () => {
    it("renders Top Projects card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Top Projects")).toBeInTheDocument();
    });

    it("renders Time Distribution card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Time Distribution")).toBeInTheDocument();
    });

    it("renders Human : AI Ratio card", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Human : AI Ratio")).toBeInTheDocument();
    });
  });

  describe("Layout", () => {
    it("has proper spacing between sections", () => {
      const { container } = render(<DashboardPage />);
      const wrapper = container.querySelector(".space-y-6");
      expect(wrapper).toBeInTheDocument();
    });

    it("renders responsive grid for combined section 2+3", () => {
      const { container } = render(<DashboardPage />);
      // Combined section uses grid-cols-5 lg:grid-cols-2 xl:grid-cols-6
      const combinedGrid = container.querySelector(".grid.grid-cols-5");
      expect(combinedGrid).toBeInTheDocument();
    });

    it("renders responsive grid for section 4", () => {
      const { container } = render(<DashboardPage />);
      // Section 4 uses grid-cols-1 with min-[936px]:grid-cols-2
      const section4Grid = container.querySelector(".grid.grid-cols-1");
      expect(section4Grid).toBeInTheDocument();
    });
  });
});

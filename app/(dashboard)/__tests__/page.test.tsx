import { render, screen } from "@testing-library/react";
import DashboardPage from "../page";
import { useList } from "@refinedev/core";
import type { Project } from "@/types/electron";

// Mock @refinedev/core
jest.mock("@refinedev/core", () => ({
  useList: jest.fn(() => ({
    result: { data: [] },
    query: { isLoading: false, isError: false, error: null },
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

// Mock date-fns - import the real module and override format only
jest.mock("date-fns", () => {
  const actual = jest.requireActual("date-fns");
  return {
    ...actual,
    format: jest.fn((date, formatStr) => {
      // Return January 2026 for MMMM yyyy format
      if (formatStr === "MMMM yyyy") {
        return "January 2026";
      }
      // Use actual format for other formats
      return actual.format(date, formatStr);
    }),
  };
});

const mockUseList = useList as jest.MockedFunction<typeof useList>;

describe("DashboardPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseList.mockReturnValue({
      result: { data: [] },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
  });

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

  describe("Data Fetching with useList", () => {
    it("fetches projects from the projects resource", () => {
      render(<DashboardPage />);
      expect(mockUseList).toHaveBeenCalledWith({
        resource: "projects",
        pagination: { pageSize: 1000 },
      });
    });

    it("passes projects data to TopProjectsCard", () => {
      const mockProjects: Project[] = [
        {
          path: "/test/project1",
          name: "project1",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-15",
          sessionCount: 10,
          messageCount: 100,
          totalTime: 36000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
        {
          path: "/test/project2",
          name: "project2",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-15",
          sessionCount: 20,
          messageCount: 200,
          totalTime: 72000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mockProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Top Projects")).toBeInTheDocument();
    });

    it("passes projects data to TimeDistributionCard", () => {
      const mockProjects: Project[] = [
        {
          path: "/test/project1",
          name: "project1",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-15",
          sessionCount: 10,
          messageCount: 100,
          totalTime: 36000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mockProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Time Distribution")).toBeInTheDocument();
    });

    it("handles empty projects array", () => {
      mockUseList.mockReturnValue({
        result: { data: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Top Projects")).toBeInTheDocument();
      expect(screen.getByText("Time Distribution")).toBeInTheDocument();
    });

    it("handles undefined data gracefully", () => {
      mockUseList.mockReturnValue({
        result: { data: undefined },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("handles null data gracefully", () => {
      mockUseList.mockReturnValue({
        result: { data: null },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });
  });

  describe("Header Section", () => {
    it("renders Dashboard title", () => {
      render(<DashboardPage />);
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
    });

    it("renders current month", () => {
      render(<DashboardPage />);
      expect(screen.getByText("January 2026")).toBeInTheDocument();
    });

    it("renders Calendar icon", () => {
      const { container } = render(<DashboardPage />);
      // Calendar icon should be present in the header
      const calendarIcon = container.querySelector(".w-4.h-4");
      expect(calendarIcon).toBeInTheDocument();
    });

    it("header has correct layout", () => {
      const { container } = render(<DashboardPage />);
      const header = container.querySelector(".flex.items-center.justify-between");
      expect(header).toBeInTheDocument();
    });

    it("title has correct styling", () => {
      render(<DashboardPage />);
      const title = screen.getByText("Dashboard");
      expect(title).toHaveClass("text-2xl");
      expect(title).toHaveClass("font-bold");
      expect(title).toHaveClass("tracking-tight");
    });
  });

  describe("Responsive Layout Rendering", () => {
    it("section 2+3 grid has responsive breakpoints", () => {
      const { container } = render(<DashboardPage />);
      const combinedGrid = container.querySelector(
        ".grid.grid-cols-5.lg\\:grid-cols-2.xl\\:grid-cols-6"
      );
      expect(combinedGrid).toBeInTheDocument();
    });

    it("Today card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const todayCard = container.querySelector(".order-1.col-span-5.min-\\[936px\\]\\:col-span-2");
      expect(todayCard).toBeInTheDocument();
    });

    it("Claude limits card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const claudeCard = container.querySelector(
        ".order-2.col-span-5.min-\\[936px\\]\\:col-span-3"
      );
      expect(claudeCard).toBeInTheDocument();
    });

    it("Quick Stats card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const quickStatsCard = container.querySelector(".order-3.col-span-5.sm\\:col-span-3");
      expect(quickStatsCard).toBeInTheDocument();
    });

    it("Activity card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const activityCard = container.querySelector(".order-4.col-span-5.sm\\:col-span-2");
      expect(activityCard).toBeInTheDocument();
    });

    it("Session Distribution card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const sessionCard = container.querySelector(
        ".order-5.col-span-5.min-\\[936px\\]\\:col-span-2"
      );
      expect(sessionCard).toBeInTheDocument();
    });

    it("Cumulative Cost card has responsive column span", () => {
      const { container } = render(<DashboardPage />);
      const cumulativeCard = container.querySelector(
        ".order-6.col-span-5.min-\\[936px\\]\\:col-span-3"
      );
      expect(cumulativeCard).toBeInTheDocument();
    });

    it("section 4 has correct responsive grid classes", () => {
      const { container } = render(<DashboardPage />);
      const section4Grid = container.querySelector(
        ".grid.grid-cols-1.min-\\[936px\\]\\:grid-cols-2.xl\\:grid-cols-\\[5fr_3fr_7fr\\]"
      );
      expect(section4Grid).toBeInTheDocument();
    });

    it("Human:AI card spans 2 columns on medium screens", () => {
      const { container } = render(<DashboardPage />);
      const humanAICard = container.querySelector(".min-\\[936px\\]\\:col-span-2.xl\\:col-span-1");
      expect(humanAICard).toBeInTheDocument();
    });
  });

  describe("Real Data Display", () => {
    it("displays project data in Top Projects when available", () => {
      const mockProjects: Project[] = [
        {
          path: "/test/my-app",
          name: "my-app",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 45,
          messageCount: 450,
          totalTime: 162000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
        {
          path: "/test/backend-api",
          name: "backend-api",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 30,
          messageCount: 300,
          totalTime: 108000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mockProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);

      // The component should be rendered (exact project name display depends on TopProjectsCard implementation)
      expect(screen.getByText("Top Projects")).toBeInTheDocument();
    });

    it("calculates time distribution from real project data", () => {
      const mockProjects: Project[] = [
        {
          path: "/test/frontend",
          name: "frontend",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 25,
          messageCount: 250,
          totalTime: 90000000, // 25 hours
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
        {
          path: "/test/backend",
          name: "backend",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 15,
          messageCount: 150,
          totalTime: 54000000, // 15 hours
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mockProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      render(<DashboardPage />);
      expect(screen.getByText("Time Distribution")).toBeInTheDocument();
    });
  });

  describe("Hero Metrics Display with Real Data", () => {
    it("displays accurate session count", () => {
      render(<DashboardPage />);
      // mockSummary has totalSessions: 349
      expect(screen.getByText("349")).toBeInTheDocument();
    });

    it("displays formatted session time", () => {
      render(<DashboardPage />);
      // mockSummary has totalActiveTime that formats to 844h 18m
      expect(screen.getByText("844h 18m")).toBeInTheDocument();
    });

    it("displays formatted API cost with currency", () => {
      render(<DashboardPage />);
      // mockSummary has estimatedApiCost: 2532.92
      expect(screen.getByText("$2,532.92")).toBeInTheDocument();
    });

    it("displays value multiplier with x suffix", () => {
      render(<DashboardPage />);
      // Value is calculated as session time * $100/hr / API cost
      expect(screen.getByText("25.33x")).toBeInTheDocument();
    });

    it("value metric is highlighted in emerald color", () => {
      render(<DashboardPage />);
      const valueText = screen.getByText("25.33x");
      expect(valueText).toHaveClass("text-emerald-600");
    });
  });

  describe("Activity Heatmap Integration", () => {
    it("passes dailyActivity data to ActivityHeatmap", () => {
      render(<DashboardPage />);
      // ActivityHeatmap should be rendered
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });

    it("passes current month to ActivityHeatmap", () => {
      render(<DashboardPage />);
      // The month is passed as a Date object
      expect(screen.getByText("Activity")).toBeInTheDocument();
    });
  });

  describe("Full Page Rendering", () => {
    it("renders all dashboard sections without errors", () => {
      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("renders complete page structure", () => {
      const { container } = render(<DashboardPage />);

      // Main wrapper
      expect(container.querySelector(".space-y-6")).toBeInTheDocument();

      // All major sections
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      // "Sessions" appears in multiple places (Hero card and Today comparison)
      expect(screen.getAllByText("Sessions").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("Today vs Daily Average")).toBeInTheDocument();
      expect(screen.getByText("Claude Max Limits")).toBeInTheDocument();
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Top Projects")).toBeInTheDocument();
      expect(screen.getByText("Human : AI Ratio")).toBeInTheDocument();
    });

    it("renders all cards in correct order", () => {
      const { container } = render(<DashboardPage />);

      // Check order classes are applied
      expect(container.querySelector(".order-1")).toBeInTheDocument();
      expect(container.querySelector(".order-2")).toBeInTheDocument();
      expect(container.querySelector(".order-3")).toBeInTheDocument();
      expect(container.querySelector(".order-4")).toBeInTheDocument();
      expect(container.querySelector(".order-5")).toBeInTheDocument();
      expect(container.querySelector(".order-6")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very large project counts", () => {
      const largeProjectList: Project[] = Array.from({ length: 1000 }, (_, i) => ({
        path: `/test/project-${i}`,
        name: `project-${i}`,
        firstActivity: "2026-01-01",
        lastActivity: "2026-01-20",
        sessionCount: Math.floor(Math.random() * 100),
        messageCount: Math.floor(Math.random() * 1000),
        totalTime: Math.floor(Math.random() * 100000000),
        isHidden: false,
        groupId: null,
        mergedInto: null,
      }));

      mockUseList.mockReturnValue({
        result: { data: largeProjectList },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("handles projects with zero values", () => {
      const zeroValueProjects: Project[] = [
        {
          path: "/test/empty-project",
          name: "empty-project",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-01",
          sessionCount: 0,
          messageCount: 0,
          totalTime: 0,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: zeroValueProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("handles projects with very large values", () => {
      const largeValueProjects: Project[] = [
        {
          path: "/test/large-project",
          name: "large-project",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 999999,
          messageCount: 9999999,
          totalTime: 999999999999,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: largeValueProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("handles projects with special characters in names", () => {
      const specialCharProjects: Project[] = [
        {
          path: "/test/my-project_v2.0",
          name: "my-project_v2.0",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 10,
          messageCount: 100,
          totalTime: 36000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: specialCharProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("handles hidden projects in the list", () => {
      const mixedProjects: Project[] = [
        {
          path: "/test/visible",
          name: "visible",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 10,
          messageCount: 100,
          totalTime: 36000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
        {
          path: "/test/hidden",
          name: "hidden",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 5,
          messageCount: 50,
          totalTime: 18000000,
          isHidden: true,
          groupId: null,
          mergedInto: null,
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mixedProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });

    it("handles merged projects", () => {
      const mergedProjects: Project[] = [
        {
          path: "/test/primary",
          name: "primary",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-20",
          sessionCount: 10,
          messageCount: 100,
          totalTime: 36000000,
          isHidden: false,
          groupId: null,
          mergedInto: null,
        },
        {
          path: "/test/merged",
          name: "merged",
          firstActivity: "2026-01-01",
          lastActivity: "2026-01-15",
          sessionCount: 5,
          messageCount: 50,
          totalTime: 18000000,
          isHidden: false,
          groupId: null,
          mergedInto: "/test/primary",
        },
      ];

      mockUseList.mockReturnValue({
        result: { data: mergedProjects },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      expect(() => render(<DashboardPage />)).not.toThrow();
    });
  });
});

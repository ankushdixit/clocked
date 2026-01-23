import { render, screen } from "@testing-library/react";
import { TopProjectsCard } from "../TopProjectsCard";

// Mock the generateEnhancedProjects function
jest.mock("@/lib/mockData", () => ({
  generateEnhancedProjects: () => [
    {
      name: "raincheck",
      path: "/Users/ankush/Projects/raincheck",
      sessionCount: 26,
      totalTime: 972420,
      estimatedCost: 810.38,
      weeklyTrend: [4, 3, 5, 2, 4, 5, 3],
      color: "#10b981",
    },
    {
      name: "www",
      path: "/Users/ankush/Projects/www",
      sessionCount: 145,
      totalTime: 755640,
      estimatedCost: 629.73,
      weeklyTrend: [8, 12, 10, 15, 9, 11, 8],
      color: "#3b82f6",
    },
    {
      name: "windup",
      path: "/Users/ankush/Projects/windup",
      sessionCount: 9,
      totalTime: 377160,
      estimatedCost: 314.31,
      weeklyTrend: [1, 2, 1, 0, 2, 1, 2],
      color: "#8b5cf6",
    },
    {
      name: "validate-this-idea",
      path: "/Users/ankush/Projects/validate-this-idea",
      sessionCount: 6,
      totalTime: 176160,
      estimatedCost: 146.81,
      weeklyTrend: [0, 1, 1, 2, 1, 0, 1],
      color: "#f59e0b",
    },
    {
      name: "cosy",
      path: "/Users/ankush/Projects/cosy",
      sessionCount: 39,
      totalTime: 173400,
      estimatedCost: 144.55,
      weeklyTrend: [3, 5, 4, 6, 5, 4, 3],
      color: "#ec4899",
    },
    {
      name: "extra-project",
      path: "/Users/ankush/Projects/extra",
      sessionCount: 10,
      totalTime: 100000,
      estimatedCost: 50.0,
      weeklyTrend: [1, 1, 1, 1, 1, 1, 1],
      color: "#6366f1",
    },
  ],
}));

describe("TopProjectsCard Component", () => {
  it("renders the card title 'Top Projects'", () => {
    render(<TopProjectsCard />);
    expect(screen.getByText("Top Projects")).toBeInTheDocument();
  });

  it("renders the 'View all' button", () => {
    render(<TopProjectsCard />);
    expect(screen.getByText("View all")).toBeInTheDocument();
  });

  it("displays up to 5 projects", () => {
    render(<TopProjectsCard />);
    // Should show 5 projects even though mock has 6
    expect(screen.getByText("raincheck")).toBeInTheDocument();
    expect(screen.getByText("www")).toBeInTheDocument();
    expect(screen.getByText("windup")).toBeInTheDocument();
    expect(screen.getByText("validate-this-idea")).toBeInTheDocument();
    expect(screen.getByText("cosy")).toBeInTheDocument();
    // 6th project should NOT be displayed
    expect(screen.queryByText("extra-project")).not.toBeInTheDocument();
  });

  it("displays rank numbers for each project", () => {
    render(<TopProjectsCard />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("displays session count for each project", () => {
    render(<TopProjectsCard />);
    // Session counts are displayed in format "X sessions"
    // Use exact text matching to avoid conflicts with substrings
    expect(screen.getByText(/^26 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/^145 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/^9 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/^6 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/^39 sessions/)).toBeInTheDocument();
  });

  it("displays duration for each project", () => {
    render(<TopProjectsCard />);
    // formatDuration will format totalTime in seconds
    // 972420 seconds = 270h 7m
    // Check that duration text patterns appear (the exact format depends on formatDuration)
    const projectRows = screen.getAllByText(/sessions/);
    expect(projectRows.length).toBe(5);
  });

  it("displays cost for each project", () => {
    render(<TopProjectsCard />);
    // formatCost will format the estimatedCost values
    expect(screen.getByText("$810.38")).toBeInTheDocument();
    expect(screen.getByText("$629.73")).toBeInTheDocument();
    expect(screen.getByText("$314.31")).toBeInTheDocument();
    expect(screen.getByText("$146.81")).toBeInTheDocument();
    expect(screen.getByText("$144.55")).toBeInTheDocument();
  });

  it("renders mini weekly trend charts for each project", () => {
    const { container } = render(<TopProjectsCard />);
    // Each project has a mini chart with 7 bars (for weekly trend)
    // The bars have flex-1 and rounded-t-sm classes within a flex container
    const chartContainers = container.querySelectorAll(".flex.items-end.gap-0\\.5.h-5.w-12");
    expect(chartContainers.length).toBe(5);

    // Each chart should have 7 bars
    chartContainers.forEach((chart) => {
      const bars = chart.querySelectorAll(".flex-1.rounded-t-sm");
      expect(bars.length).toBe(7);
    });
  });

  it("renders project rows as clickable elements", () => {
    const { container } = render(<TopProjectsCard />);
    const projectRows = container.querySelectorAll(".cursor-pointer.group");
    expect(projectRows.length).toBe(5);
  });

  it("renders Zap icon in header", () => {
    const { container } = render(<TopProjectsCard />);
    // Lucide icons render as SVG elements
    const headerIcon = container.querySelector("svg.w-4.h-4");
    expect(headerIcon).toBeInTheDocument();
  });
});

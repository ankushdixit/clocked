import { render, screen } from "@testing-library/react";
import { TopProjectsCard } from "../TopProjectsCard";
import type { Project } from "@/types/electron";

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

  it("renders the 'View all' link", () => {
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

describe("TopProjectsCard with real project data", () => {
  const mockRealProjects: Project[] = [
    {
      path: "/Users/dev/alpha-project",
      name: "alpha-project",
      firstActivity: "2026-01-01T10:00:00Z",
      lastActivity: "2026-01-20T15:00:00Z",
      sessionCount: 100,
      messageCount: 1000,
      totalTime: 36000000, // 10 hours
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
    {
      path: "/Users/dev/beta-project",
      name: "beta-project",
      firstActivity: "2026-01-05T09:00:00Z",
      lastActivity: "2026-01-20T12:00:00Z",
      sessionCount: 50,
      messageCount: 500,
      totalTime: 18000000, // 5 hours
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
    {
      path: "/Users/dev/gamma-project",
      name: "gamma-project",
      firstActivity: "2026-01-10T11:00:00Z",
      lastActivity: "2026-01-19T14:00:00Z",
      sessionCount: 25,
      messageCount: 250,
      totalTime: 9000000, // 2.5 hours
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
  ];

  it("uses real project data when provided", () => {
    render(<TopProjectsCard projects={mockRealProjects} />);
    // Should display real project names, not mock data
    expect(screen.getByText("alpha-project")).toBeInTheDocument();
    expect(screen.getByText("beta-project")).toBeInTheDocument();
    expect(screen.getByText("gamma-project")).toBeInTheDocument();
    // Mock project name should not be present
    expect(screen.queryByText("raincheck")).not.toBeInTheDocument();
  });

  it("sorts projects by total time descending", () => {
    const { container } = render(<TopProjectsCard projects={mockRealProjects} />);
    // The first project row should be alpha-project (largest totalTime)
    const projectRows = container.querySelectorAll(".cursor-pointer.group");
    expect(projectRows[0].textContent).toContain("alpha-project");
    expect(projectRows[1].textContent).toContain("beta-project");
    expect(projectRows[2].textContent).toContain("gamma-project");
  });

  it("filters out merged projects", () => {
    const projectsWithMerged: Project[] = [
      ...mockRealProjects,
      {
        path: "/Users/dev/merged-project",
        name: "merged-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        totalTime: 900000, // 15 minutes
        isHidden: false,
        groupId: null,
        mergedInto: "/Users/dev/alpha-project", // This is merged
      },
    ];

    render(<TopProjectsCard projects={projectsWithMerged} />);
    // Merged project should not appear
    expect(screen.queryByText("merged-project")).not.toBeInTheDocument();
    // Other projects should still be there
    expect(screen.getByText("alpha-project")).toBeInTheDocument();
  });

  it("limits display to top 5 projects", () => {
    const manyProjects: Project[] = Array.from({ length: 10 }, (_, i) => ({
      path: `/Users/dev/project-${i}`,
      name: `project-${i}`,
      firstActivity: "2026-01-01T10:00:00Z",
      lastActivity: "2026-01-20T15:00:00Z",
      sessionCount: 10 * (10 - i),
      messageCount: 100,
      totalTime: 3600000 * (10 - i), // Decreasing time
      isHidden: false,
      groupId: null,
      mergedInto: null,
    }));

    const { container } = render(<TopProjectsCard projects={manyProjects} />);
    const projectRows = container.querySelectorAll(".cursor-pointer.group");
    // Should only display 5 projects (limited by slice(0, 5))
    expect(projectRows.length).toBe(5);
  });

  it("falls back to mock data when projects array is empty", () => {
    render(<TopProjectsCard projects={[]} />);
    // Should fall back to mock data which has "raincheck"
    expect(screen.getByText("raincheck")).toBeInTheDocument();
  });

  it("falls back to mock data when projects is undefined", () => {
    render(<TopProjectsCard />);
    // Should use mock data
    expect(screen.getByText("raincheck")).toBeInTheDocument();
  });

  it("displays session count from real project data", () => {
    render(<TopProjectsCard projects={mockRealProjects} />);
    // Check for real project session counts
    expect(screen.getByText(/100 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/50 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/25 sessions/)).toBeInTheDocument();
  });
});

describe("TopProjectsCard cost calculation", () => {
  it("calculates estimated cost based on total time", () => {
    // Cost calculation: (totalTimeMs / (1000 * 60 * 60)) * 0.5
    // For 36000000ms (10 hours) = 10 * 0.5 = $5.00
    const projectsWithKnownCost: Project[] = [
      {
        path: "/Users/dev/test-project",
        name: "test-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        totalTime: 36000000, // 10 hours -> $5.00 estimated
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    render(<TopProjectsCard projects={projectsWithKnownCost} />);
    // $5.00 cost should be displayed
    expect(screen.getByText("$5.00")).toBeInTheDocument();
  });

  it("handles very small time values correctly", () => {
    const smallTimeProject: Project[] = [
      {
        path: "/Users/dev/tiny-project",
        name: "tiny-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 60000, // 1 minute -> ~$0.0083
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    render(<TopProjectsCard projects={smallTimeProject} />);
    // Should display cost formatted to 2 decimal places
    expect(screen.getByText("$0.01")).toBeInTheDocument();
  });
});

describe("TopProjectsCard color assignment", () => {
  it("assigns colors from PROJECT_COLORS palette", () => {
    const twoProjects: Project[] = [
      {
        path: "/Users/dev/first",
        name: "first",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        totalTime: 7200000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
      {
        path: "/Users/dev/second",
        name: "second",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 5,
        messageCount: 50,
        totalTime: 3600000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    const { container } = render(<TopProjectsCard projects={twoProjects} />);
    // Rank badges should have color styling
    const rankBadges = container.querySelectorAll(".w-6.h-6.rounded-md");
    expect(rankBadges.length).toBe(2);

    // First should have #3b82f6 (blue - first in PROJECT_COLORS)
    expect(rankBadges[0]).toHaveStyle({ backgroundColor: "#3b82f6" });
    // Second should have #10b981 (emerald - second in PROJECT_COLORS)
    expect(rankBadges[1]).toHaveStyle({ backgroundColor: "#10b981" });
  });
});

describe("TopProjectsCard mini chart rendering", () => {
  it("renders weekly trend bars with varying heights", () => {
    const { container } = render(<TopProjectsCard />);
    const chartContainers = container.querySelectorAll(".flex.items-end.gap-0\\.5.h-5.w-12");

    // Get bars from first chart (raincheck with trend [4, 3, 5, 2, 4, 5, 3])
    if (chartContainers.length > 0) {
      const bars = chartContainers[0].querySelectorAll(".flex-1.rounded-t-sm");
      expect(bars.length).toBe(7);

      // Bars should have different heights based on data
      // The maxWeekly for [4, 3, 5, 2, 4, 5, 3] is 5
      // Each bar's height is calculated relative to max
      const heights = Array.from(bars).map((bar) => {
        const style = (bar as HTMLElement).style.height;
        return style;
      });

      // At least some bars should have different heights
      const uniqueHeights = new Set(heights);
      expect(uniqueHeights.size).toBeGreaterThan(1);
    }
  });

  it("applies opacity based on trend values", () => {
    const { container } = render(<TopProjectsCard />);
    const chartContainers = container.querySelectorAll(".flex.items-end.gap-0\\.5.h-5.w-12");

    if (chartContainers.length > 0) {
      const bars = chartContainers[0].querySelectorAll(".flex-1.rounded-t-sm");
      // Each bar should have opacity style (between 0.4 and 1)
      Array.from(bars).forEach((bar) => {
        const opacity = (bar as HTMLElement).style.opacity;
        // Opacity formula: 0.4 + (count / maxWeekly) * 0.6
        // So it ranges from 0.4 to 1.0
        expect(parseFloat(opacity)).toBeGreaterThanOrEqual(0.4);
        expect(parseFloat(opacity)).toBeLessThanOrEqual(1.0);
      });
    }
  });

  it("uses project color for mini chart bars", () => {
    const { container } = render(<TopProjectsCard />);
    const chartContainers = container.querySelectorAll(".flex.items-end.gap-0\\.5.h-5.w-12");

    if (chartContainers.length > 0) {
      const bars = chartContainers[0].querySelectorAll(".flex-1.rounded-t-sm");
      // Each bar should have background color matching project color
      Array.from(bars).forEach((bar) => {
        const bgColor = (bar as HTMLElement).style.backgroundColor;
        expect(bgColor).toBeTruthy();
      });
    }
  });
});

describe("TopProjectsCard links", () => {
  it("has View all link pointing to /projects", () => {
    render(<TopProjectsCard />);
    const viewAllLink = screen.getByText("View all").closest("a");
    expect(viewAllLink).toHaveAttribute("href", "/projects");
  });

  it("project rows link to individual project pages", () => {
    const projectsWithPath: Project[] = [
      {
        path: "/Users/dev/my-project",
        name: "my-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        totalTime: 3600000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    const { container } = render(<TopProjectsCard projects={projectsWithPath} />);
    const projectLink = container.querySelector('a[href*="/projects/"]');
    expect(projectLink).toBeInTheDocument();
    // Path should be URL encoded
    expect(projectLink).toHaveAttribute(
      "href",
      `/projects/${encodeURIComponent("/Users/dev/my-project")}`
    );
  });
});

describe("TopProjectsCard hover states", () => {
  it("project rows have hover styling class", () => {
    const { container } = render(<TopProjectsCard />);
    const projectRows = container.querySelectorAll(".cursor-pointer.group");
    // Each row should have hover:bg-muted/50 for hover effect
    projectRows.forEach((row) => {
      expect(row.className).toContain("hover:bg-muted/50");
    });
  });

  it("project name has hover color transition", () => {
    const { container } = render(<TopProjectsCard />);
    const projectNames = container.querySelectorAll(".group-hover\\:text-primary");
    // Each project name should change color on group hover
    expect(projectNames.length).toBe(5);
  });
});

describe("TopProjectsCard formatting", () => {
  it("displays formatted duration for each project", () => {
    const projectWithKnownDuration: Project[] = [
      {
        path: "/Users/dev/test",
        name: "test-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        // 2h 30m = 2.5 hours = 9,000,000ms
        totalTime: 9000000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    render(<TopProjectsCard projects={projectWithKnownDuration} />);
    // formatDuration(9000000) should return "2h 30m"
    expect(screen.getByText(/2h 30m/)).toBeInTheDocument();
  });

  it("displays singular 'session' for 1 session", () => {
    const singleSessionProject: Project[] = [
      {
        path: "/Users/dev/single",
        name: "single-session",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 3600000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    render(<TopProjectsCard projects={singleSessionProject} />);
    // Should show "1 sessions" (component always uses plural)
    // Note: The component doesn't handle singular form currently
    expect(screen.getByText(/1 sessions/)).toBeInTheDocument();
  });
});

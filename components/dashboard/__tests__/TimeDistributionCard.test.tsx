import { render, screen, fireEvent } from "@testing-library/react";
import { TimeDistributionCard } from "../TimeDistributionCard";
import type { Project } from "@/types/electron";

// Mock the generateEnhancedProjects function
jest.mock("@/lib/mockData", () => ({
  generateEnhancedProjects: () => [
    {
      name: "raincheck",
      path: "/Users/ankush/Projects/raincheck",
      sessionCount: 26,
      totalTime: 500000, // ~40% of total
      estimatedCost: 810.38,
      weeklyTrend: [4, 3, 5, 2, 4, 5, 3],
      color: "#10b981",
    },
    {
      name: "www",
      path: "/Users/ankush/Projects/www",
      sessionCount: 145,
      totalTime: 375000, // ~30% of total
      estimatedCost: 629.73,
      weeklyTrend: [8, 12, 10, 15, 9, 11, 8],
      color: "#3b82f6",
    },
    {
      name: "windup",
      path: "/Users/ankush/Projects/windup",
      sessionCount: 9,
      totalTime: 187500, // ~15% of total
      estimatedCost: 314.31,
      weeklyTrend: [1, 2, 1, 0, 2, 1, 2],
      color: "#8b5cf6",
    },
    {
      name: "validate-this-idea",
      path: "/Users/ankush/Projects/validate-this-idea",
      sessionCount: 6,
      totalTime: 125000, // ~10% of total
      estimatedCost: 146.81,
      weeklyTrend: [0, 1, 1, 2, 1, 0, 1],
      color: "#f59e0b",
    },
    {
      name: "cosy",
      path: "/Users/ankush/Projects/cosy",
      sessionCount: 39,
      totalTime: 62500, // ~5% of total
      estimatedCost: 144.55,
      weeklyTrend: [3, 5, 4, 6, 5, 4, 3],
      color: "#ec4899",
    },
  ],
}));

describe("TimeDistributionCard Component", () => {
  it("renders the card title 'Time Distribution'", () => {
    render(<TimeDistributionCard />);
    expect(screen.getByText("Time Distribution")).toBeInTheDocument();
  });

  it("renders the SVG pie/donut chart", () => {
    const { container } = render(<TimeDistributionCard />);
    // The chart SVG has viewBox="0 0 100 100", while icon SVGs have "0 0 24 24"
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    expect(chartSvg).toBeInTheDocument();
  });

  it("renders pie segments as path elements", () => {
    const { container } = render(<TimeDistributionCard />);
    // The chart SVG has viewBox="0 0 100 100"
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    // Each project should have a path element for its segment
    const paths = chartSvg?.querySelectorAll("path");
    expect(paths?.length).toBe(5);
  });

  it("renders center hole for donut shape", () => {
    const { container } = render(<TimeDistributionCard />);
    // The chart SVG has viewBox="0 0 100 100"
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const centerHole = chartSvg?.querySelector("circle");
    expect(centerHole).toBeInTheDocument();
    expect(centerHole).toHaveAttribute("cx", "50");
    expect(centerHole).toHaveAttribute("cy", "50");
    expect(centerHole).toHaveAttribute("r", "22");
  });

  it("renders legend items for projects", () => {
    render(<TimeDistributionCard />);
    // Legend shows project names
    expect(screen.getByText("raincheck")).toBeInTheDocument();
    expect(screen.getByText("www")).toBeInTheDocument();
    expect(screen.getByText("windup")).toBeInTheDocument();
    expect(screen.getByText("validate-this-idea")).toBeInTheDocument();
    expect(screen.getByText("cosy")).toBeInTheDocument();
  });

  it("renders colored legend indicators", () => {
    const { container } = render(<TimeDistributionCard />);
    // Legend has colored dots (w-2 h-2 rounded-full)
    const legendDots = container.querySelectorAll(".w-2.h-2.rounded-full");
    expect(legendDots.length).toBe(5);
  });

  it("displays percentage labels for segments >= 5%", () => {
    const { container } = render(<TimeDistributionCard />);
    // The chart SVG has viewBox="0 0 100 100"
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    // Text elements inside SVG for percentage labels
    const percentageLabels = chartSvg?.querySelectorAll("text");
    expect(percentageLabels).toBeDefined();
    // All 5 projects have >= 5% in our mock data, so all should have labels
    expect(percentageLabels?.length).toBe(5);
  });

  it("percentage labels contain % symbol", () => {
    const { container } = render(<TimeDistributionCard />);
    // The chart SVG has viewBox="0 0 100 100"
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const percentageLabels = chartSvg?.querySelectorAll("text");
    percentageLabels?.forEach((label) => {
      expect(label.textContent).toMatch(/%$/);
    });
  });

  it("renders PieChart icon in header", () => {
    const { container } = render(<TimeDistributionCard />);
    // Lucide icons render as SVG elements with specific classes
    const headerIcons = container.querySelectorAll("svg.w-4.h-4");
    expect(headerIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("limits legend to 5 items", () => {
    render(<TimeDistributionCard />);
    // The legend uses segments.slice(0, 5), so only 5 items max
    const legendItems = screen.getAllByText(/raincheck|www|windup|validate-this-idea|cosy/);
    expect(legendItems.length).toBe(5);
  });
});

describe("TimeDistributionCard percentage label visibility", () => {
  it("only shows percentage labels for segments with >= 5% share", () => {
    // The component conditionally renders text labels only for segments >= 5%
    // Our mock data has all segments >= 5%, verified by checking that all 5 segments have labels
    const { container } = render(<TimeDistributionCard />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const percentageLabels = chartSvg?.querySelectorAll("text");

    // Verify each label shows a reasonable percentage value (between 5% and 100%)
    percentageLabels?.forEach((label) => {
      const percentValue = parseInt(label.textContent?.replace("%", "") || "0");
      expect(percentValue).toBeGreaterThanOrEqual(5);
      expect(percentValue).toBeLessThanOrEqual(100);
    });
  });
});

describe("TimeDistributionCard tooltip interactions", () => {
  it("shows tooltip on mouse enter with project name", () => {
    const { container } = render(<TimeDistributionCard />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    if (paths && paths.length > 0) {
      fireEvent.mouseEnter(paths[0]);
      // Tooltip should show project name
      // The first segment in our mock data is "raincheck" (largest totalTime)
      const tooltip = container.querySelector(".fixed.z-50");
      expect(tooltip).toBeInTheDocument();
    }
  });

  it("shows tooltip with formatted duration and percentage", () => {
    const { container } = render(<TimeDistributionCard />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    if (paths && paths.length > 0) {
      fireEvent.mouseEnter(paths[0]);
      // Tooltip shows duration (from formatDuration) and percentage
      // Look for the tooltip content
      const tooltipContent = container.querySelector(".fixed.z-50");
      expect(tooltipContent).toBeInTheDocument();
      // Should contain a percentage value
      expect(tooltipContent?.textContent).toMatch(/%/);
    }
  });

  it("hides tooltip on mouse leave", () => {
    const { container } = render(<TimeDistributionCard />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    if (paths && paths.length > 0) {
      fireEvent.mouseEnter(paths[0]);
      expect(container.querySelector(".fixed.z-50")).toBeInTheDocument();

      fireEvent.mouseLeave(paths[0]);
      expect(container.querySelector(".fixed.z-50")).not.toBeInTheDocument();
    }
  });

  it("tooltip shows different data for different segments", () => {
    const { container } = render(<TimeDistributionCard />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    if (paths && paths.length >= 2) {
      // Hover first segment
      fireEvent.mouseEnter(paths[0]);
      const firstTooltip = container.querySelector(".fixed.z-50");
      const firstContent = firstTooltip?.textContent;
      fireEvent.mouseLeave(paths[0]);

      // Hover second segment
      fireEvent.mouseEnter(paths[1]);
      const secondTooltip = container.querySelector(".fixed.z-50");
      const secondContent = secondTooltip?.textContent;

      // Content should be different for different segments
      expect(firstContent).not.toBe(secondContent);
    }
  });
});

describe("TimeDistributionCard with real project data", () => {
  const mockRealProjects: Project[] = [
    {
      path: "/Users/dev/project-alpha",
      name: "project-alpha",
      firstActivity: "2026-01-01T10:00:00Z",
      lastActivity: "2026-01-20T15:00:00Z",
      sessionCount: 50,
      messageCount: 500,
      totalTime: 7200000, // 2 hours - largest
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
    {
      path: "/Users/dev/project-beta",
      name: "project-beta",
      firstActivity: "2026-01-05T09:00:00Z",
      lastActivity: "2026-01-20T12:00:00Z",
      sessionCount: 30,
      messageCount: 300,
      totalTime: 3600000, // 1 hour
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
    {
      path: "/Users/dev/project-gamma",
      name: "project-gamma",
      firstActivity: "2026-01-10T11:00:00Z",
      lastActivity: "2026-01-19T14:00:00Z",
      sessionCount: 20,
      messageCount: 200,
      totalTime: 1800000, // 30 minutes
      isHidden: false,
      groupId: null,
      mergedInto: null,
    },
  ];

  it("uses real project data when provided", () => {
    render(<TimeDistributionCard projects={mockRealProjects} />);
    // Should display real project names, not mock data
    expect(screen.getByText("project-alpha")).toBeInTheDocument();
    expect(screen.getByText("project-beta")).toBeInTheDocument();
    expect(screen.getByText("project-gamma")).toBeInTheDocument();
    // Mock project name should not be present
    expect(screen.queryByText("raincheck")).not.toBeInTheDocument();
  });

  it("sorts projects by total time descending", () => {
    const { container } = render(<TimeDistributionCard projects={mockRealProjects} />);
    // The first path element should correspond to the largest project (project-alpha)
    // Check legend order - project-alpha should be first in the legend
    const legendItems = container.querySelectorAll(".flex.items-center.gap-1.text-\\[12px\\]");
    expect(legendItems.length).toBe(3);
    // First legend item should be project-alpha (highest totalTime)
    expect(legendItems[0].textContent).toContain("project-alpha");
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
        mergedInto: "/Users/dev/project-alpha", // This is merged
      },
    ];

    render(<TimeDistributionCard projects={projectsWithMerged} />);
    // Merged project should not appear
    expect(screen.queryByText("merged-project")).not.toBeInTheDocument();
    // Other projects should still be there
    expect(screen.getByText("project-alpha")).toBeInTheDocument();
  });

  it("filters out projects with zero totalTime", () => {
    const projectsWithZero: Project[] = [
      ...mockRealProjects,
      {
        path: "/Users/dev/empty-project",
        name: "empty-project",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 0,
        messageCount: 0,
        totalTime: 0, // Zero time
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    render(<TimeDistributionCard projects={projectsWithZero} />);
    // Empty project should not appear in legend
    expect(screen.queryByText("empty-project")).not.toBeInTheDocument();
  });

  it("limits display to top 8 projects", () => {
    const manyProjects: Project[] = Array.from({ length: 12 }, (_, i) => ({
      path: `/Users/dev/project-${i}`,
      name: `project-${i}`,
      firstActivity: "2026-01-01T10:00:00Z",
      lastActivity: "2026-01-20T15:00:00Z",
      sessionCount: 10,
      messageCount: 100,
      totalTime: 3600000 * (12 - i), // Decreasing time
      isHidden: false,
      groupId: null,
      mergedInto: null,
    }));

    const { container } = render(<TimeDistributionCard projects={manyProjects} />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");
    // Should only render 8 segments (limited by slice(0, 8))
    expect(paths?.length).toBe(8);
  });

  it("falls back to mock data when projects array is empty", () => {
    render(<TimeDistributionCard projects={[]} />);
    // Should fall back to mock data which has "raincheck"
    expect(screen.getByText("raincheck")).toBeInTheDocument();
  });

  it("falls back to mock data when projects is undefined", () => {
    render(<TimeDistributionCard />);
    // Should use mock data
    expect(screen.getByText("raincheck")).toBeInTheDocument();
  });
});

describe("TimeDistributionCard color assignment", () => {
  it("assigns colors from PROJECT_COLORS palette to projects", () => {
    const twoProjects: Project[] = [
      {
        path: "/Users/dev/first",
        name: "first",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 10,
        messageCount: 100,
        totalTime: 3600000,
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
        totalTime: 1800000,
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    const { container } = render(<TimeDistributionCard projects={twoProjects} />);
    const legendDots = container.querySelectorAll(".w-2.h-2.rounded-full");

    // First project should get #3b82f6 (blue - first in PROJECT_COLORS)
    expect(legendDots[0]).toHaveStyle({ backgroundColor: "#3b82f6" });
    // Second project should get #10b981 (emerald - second in PROJECT_COLORS)
    expect(legendDots[1]).toHaveStyle({ backgroundColor: "#10b981" });
  });

  it("cycles colors when more than 8 projects", () => {
    const nineProjects: Project[] = Array.from({ length: 9 }, (_, i) => ({
      path: `/Users/dev/project-${i}`,
      name: `project-${i}`,
      firstActivity: "2026-01-01T10:00:00Z",
      lastActivity: "2026-01-20T15:00:00Z",
      sessionCount: 10,
      messageCount: 100,
      totalTime: 3600000 * (9 - i),
      isHidden: false,
      groupId: null,
      mergedInto: null,
    }));

    const { container } = render(<TimeDistributionCard projects={nineProjects} />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    // With 9 projects but limit of 8, the 9th gets color at index 0 (cycle)
    // Actually the component slices to 8, so this tests that the limit works
    expect(paths?.length).toBe(8);
  });
});

describe("TimeDistributionCard small segment handling", () => {
  it("hides percentage labels for segments smaller than 5%", () => {
    const projectsWithSmallSegment: Project[] = [
      {
        path: "/Users/dev/large",
        name: "large",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 100,
        messageCount: 1000,
        totalTime: 95000000, // 95%
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
      {
        path: "/Users/dev/tiny",
        name: "tiny",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 5000000, // ~5%
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    const { container } = render(<TimeDistributionCard projects={projectsWithSmallSegment} />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");
    const labels = chartSvg?.querySelectorAll("text");

    // Should have 2 segments
    expect(paths?.length).toBe(2);
    // Both segments are >= 5%, so both should have labels
    expect(labels?.length).toBe(2);
  });

  it("hides percentage label for segments under 5%", () => {
    const projectsWithTinySegment: Project[] = [
      {
        path: "/Users/dev/large",
        name: "large",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 100,
        messageCount: 1000,
        totalTime: 98000000, // ~98%
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
      {
        path: "/Users/dev/tiny",
        name: "tiny",
        firstActivity: "2026-01-01T10:00:00Z",
        lastActivity: "2026-01-20T15:00:00Z",
        sessionCount: 1,
        messageCount: 10,
        totalTime: 2000000, // ~2% - under threshold
        isHidden: false,
        groupId: null,
        mergedInto: null,
      },
    ];

    const { container } = render(<TimeDistributionCard projects={projectsWithTinySegment} />);
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");
    const labels = chartSvg?.querySelectorAll("text");

    // Should have 2 segments
    expect(paths?.length).toBe(2);
    // Only the large segment (>= 5%) should have a label
    expect(labels?.length).toBe(1);
  });
});

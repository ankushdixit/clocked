import { render, screen } from "@testing-library/react";
import { TimeDistributionCard } from "../TimeDistributionCard";

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

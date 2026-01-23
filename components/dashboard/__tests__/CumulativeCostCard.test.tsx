import { render, screen } from "@testing-library/react";
import { CumulativeCostCard } from "../CumulativeCostCard";

// Mock the data generation function with predictable data
jest.mock("@/lib/mockData", () => ({
  generateCostTrend: () => {
    const trend = [];
    let cumulative = 0;
    const dailyCosts = [100, 150, 200, 50, 100]; // 5 days, total cumulative = 600
    for (let i = 0; i < dailyCosts.length; i++) {
      cumulative += dailyCosts[i];
      trend.push({
        date: `2026-01-${(i + 1).toString().padStart(2, "0")}`,
        cost: dailyCosts[i],
        cumulative,
      });
    }
    return trend;
  },
}));

describe("CumulativeCostCard Component", () => {
  it("renders the card title 'Cumulative Cost'", () => {
    render(<CumulativeCostCard />);
    expect(screen.getByText("Cumulative Cost")).toBeInTheDocument();
  });

  it("displays current cost", () => {
    render(<CumulativeCostCard />);
    // Total cumulative = 100 + 150 + 200 + 50 + 100 = 600
    expect(screen.getByText("Current:")).toBeInTheDocument();
    // $600.00 appears both in header and Y-axis, use getAllByText
    const costElements = screen.getAllByText("$600.00");
    expect(costElements.length).toBeGreaterThanOrEqual(1);
  });

  it("displays daily average cost", () => {
    render(<CumulativeCostCard />);
    // Average = 600 / 5 = 120
    expect(screen.getByText("Avg:")).toBeInTheDocument();
    expect(screen.getByText("$120.00/day")).toBeInTheDocument();
  });

  it("renders the SVG chart", () => {
    const { container } = render(<CumulativeCostCard />);
    // The chart SVG has viewBox "0 0 100 100" and contains a polyline
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    expect(chartSvg).toBeInTheDocument();
  });

  it("renders chart elements - gradient and path", () => {
    const { container } = render(<CumulativeCostCard />);
    // Check for gradient definition
    const gradient = container.querySelector("#costGradient");
    expect(gradient).toBeInTheDocument();

    // Check for the area path (fill)
    const areaPath = container.querySelector('path[fill="url(#costGradient)"]');
    expect(areaPath).toBeInTheDocument();

    // Check for the line (polyline)
    const line = container.querySelector("polyline");
    expect(line).toBeInTheDocument();
    expect(line).toHaveAttribute("stroke", "rgb(16, 185, 129)");
  });

  it("renders X-axis date labels", () => {
    render(<CumulativeCostCard />);
    // With 5 days of data, should show Jan 1, Jan 3 (middle), Jan 5 (end)
    expect(screen.getByText("Jan 1")).toBeInTheDocument();
    expect(screen.getByText("Jan 3")).toBeInTheDocument(); // Math.round(5/2) = 3
    expect(screen.getByText("Jan 5")).toBeInTheDocument();
  });

  it("renders Y-axis cost labels", () => {
    const { container } = render(<CumulativeCostCard />);
    // Max cumulative is $600, so Y-axis should show $600.00, $300.00 (half), and $0
    // Y-axis is in a div with specific classes
    const yAxisLabels = container.querySelector(".flex.flex-col.justify-between.text-\\[10px\\]");
    expect(yAxisLabels).toBeInTheDocument();
    // Check for the $0 label (unique to Y-axis)
    expect(screen.getByText("$0")).toBeInTheDocument();
    // $300.00 should be present (only appears on Y-axis)
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    // $600.00 appears in both header and Y-axis
    const maxCostLabels = screen.getAllByText("$600.00");
    expect(maxCostLabels.length).toBe(2); // header + Y-axis
  });

  it("renders the TrendingUp icon", () => {
    const { container } = render(<CumulativeCostCard />);
    // Lucide icons render as SVGs with specific classes
    const icon = container.querySelector("svg.w-4.h-4");
    expect(icon).toBeInTheDocument();
  });

  it("renders chart grid line", () => {
    const { container } = render(<CumulativeCostCard />);
    // Check for the horizontal grid line at y=50
    const gridLine = container.querySelector('line[y1="50"][y2="50"]');
    expect(gridLine).toBeInTheDocument();
  });

  it("renders within a Card component structure", () => {
    const { container } = render(<CumulativeCostCard />);
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeInTheDocument();
  });
});

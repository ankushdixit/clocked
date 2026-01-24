import { render, screen } from "@testing-library/react";
import { CumulativeCostCard } from "../CumulativeCostCard";

// Store original mock so we can modify it for different scenarios
const mockGenerateCostTrend = jest.fn();

jest.mock("@/lib/mockData", () => ({
  generateCostTrend: () => mockGenerateCostTrend(),
}));

describe("CumulativeCostCard - Real User Scenarios", () => {
  beforeEach(() => {
    mockGenerateCostTrend.mockReset();
  });

  describe("High Usage Scenario", () => {
    beforeEach(() => {
      // Simulate a heavy usage month - $1000+ cumulative cost
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 50, cumulative: 50 },
        { date: "2026-01-02", cost: 75, cumulative: 125 },
        { date: "2026-01-03", cost: 100, cumulative: 225 },
        { date: "2026-01-04", cost: 120, cumulative: 345 },
        { date: "2026-01-05", cost: 150, cumulative: 495 },
        { date: "2026-01-06", cost: 180, cumulative: 675 },
        { date: "2026-01-07", cost: 200, cumulative: 875 },
        { date: "2026-01-08", cost: 175, cumulative: 1050 },
      ]);
    });

    it("displays high cumulative cost correctly", () => {
      render(<CumulativeCostCard />);
      // Current cost: $1050.00 (appears in header and Y-axis max)
      const costLabels = screen.getAllByText("$1,050.00");
      expect(costLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("calculates correct daily average for high usage", () => {
      render(<CumulativeCostCard />);
      // Average = 1050 / 8 = 131.25
      expect(screen.getByText("$131.25/day")).toBeInTheDocument();
    });

    it("renders Y-axis midpoint for high values", () => {
      render(<CumulativeCostCard />);
      // Midpoint = 1050 / 2 = 525
      expect(screen.getByText("$525.00")).toBeInTheDocument();
    });
  });

  describe("Low Usage Scenario", () => {
    beforeEach(() => {
      // Simulate minimal usage - under $10 total
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 1.5, cumulative: 1.5 },
        { date: "2026-01-02", cost: 2.25, cumulative: 3.75 },
        { date: "2026-01-03", cost: 1.75, cumulative: 5.5 },
        { date: "2026-01-04", cost: 3.0, cumulative: 8.5 },
      ]);
    });

    it("displays low cumulative cost with proper formatting", () => {
      render(<CumulativeCostCard />);
      const costLabels = screen.getAllByText("$8.50");
      expect(costLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("calculates correct daily average for low usage", () => {
      render(<CumulativeCostCard />);
      // Average = 8.50 / 4 = 2.125 -> $2.13
      expect(screen.getByText("$2.13/day")).toBeInTheDocument();
    });

    it("renders small values on Y-axis", () => {
      render(<CumulativeCostCard />);
      expect(screen.getByText("$4.25")).toBeInTheDocument(); // midpoint
      expect(screen.getByText("$0")).toBeInTheDocument();
    });
  });

  describe("Zero/Minimal Usage Scenario", () => {
    beforeEach(() => {
      // Single day with zero usage followed by small activity
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 0, cumulative: 0 },
        { date: "2026-01-02", cost: 0.5, cumulative: 0.5 },
      ]);
    });

    it("handles zero initial cost gracefully", () => {
      render(<CumulativeCostCard />);
      const costLabels = screen.getAllByText("$0.50");
      expect(costLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("calculates average even with zero days", () => {
      render(<CumulativeCostCard />);
      // Average = 0.50 / 2 = 0.25
      expect(screen.getByText("$0.25/day")).toBeInTheDocument();
    });
  });

  describe("Single Day Usage", () => {
    beforeEach(() => {
      mockGenerateCostTrend.mockReturnValue([{ date: "2026-01-01", cost: 50, cumulative: 50 }]);
    });

    it("displays current cost for single day", () => {
      render(<CumulativeCostCard />);
      const costLabels = screen.getAllByText("$50.00");
      expect(costLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("shows daily average equal to current cost for single day", () => {
      render(<CumulativeCostCard />);
      // Average = 50 / 1 = 50
      expect(screen.getByText("$50.00/day")).toBeInTheDocument();
    });

    it("renders X-axis labels for single day", () => {
      render(<CumulativeCostCard />);
      // With single day, all labels show Jan 1 (start, middle, end)
      const janLabels = screen.getAllByText(/Jan 1/);
      expect(janLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Chart Path Generation", () => {
    beforeEach(() => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 10, cumulative: 10 },
        { date: "2026-01-02", cost: 20, cumulative: 30 },
        { date: "2026-01-03", cost: 30, cumulative: 60 },
        { date: "2026-01-04", cost: 40, cumulative: 100 },
      ]);
    });

    it("generates SVG path with correct structure", () => {
      const { container } = render(<CumulativeCostCard />);
      const path = container.querySelector('path[fill="url(#costGradient)"]');
      expect(path).toBeInTheDocument();

      // Path should start with M 0,100 (starting point)
      const d = path?.getAttribute("d");
      expect(d).toMatch(/^M 0,100/);
      // Path should end with L 100,100 Z (close the area)
      expect(d).toMatch(/L 100,100 Z$/);
    });

    it("generates polyline with correct number of points", () => {
      const { container } = render(<CumulativeCostCard />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toBeInTheDocument();

      const points = polyline?.getAttribute("points") || "";
      // Should have 4 points separated by spaces
      const pointCount = points.split(" ").length;
      expect(pointCount).toBe(4);
    });

    it("positions points correctly based on cumulative values", () => {
      const { container } = render(<CumulativeCostCard />);
      const polyline = container.querySelector("polyline");
      const points = polyline?.getAttribute("points") || "";

      // First point should be at x=0 (first day)
      // y = 100 - (10/100)*100 = 90
      expect(points).toContain("0,90");

      // Last point should be at x=100 (last day)
      // y = 100 - (100/100)*100 = 0
      expect(points).toContain("100,0");
    });
  });

  describe("X-Axis Date Labels", () => {
    it("shows correct middle date for odd number of days", () => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 10, cumulative: 10 },
        { date: "2026-01-02", cost: 10, cumulative: 20 },
        { date: "2026-01-03", cost: 10, cumulative: 30 },
        { date: "2026-01-04", cost: 10, cumulative: 40 },
        { date: "2026-01-05", cost: 10, cumulative: 50 },
        { date: "2026-01-06", cost: 10, cumulative: 60 },
        { date: "2026-01-07", cost: 10, cumulative: 70 },
      ]);
      render(<CumulativeCostCard />);
      // Middle = Math.round(7/2) = 4
      expect(screen.getByText("Jan 1")).toBeInTheDocument();
      expect(screen.getByText("Jan 4")).toBeInTheDocument();
      expect(screen.getByText("Jan 7")).toBeInTheDocument();
    });

    it("shows correct middle date for even number of days", () => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 10, cumulative: 10 },
        { date: "2026-01-02", cost: 10, cumulative: 20 },
        { date: "2026-01-03", cost: 10, cumulative: 30 },
        { date: "2026-01-04", cost: 10, cumulative: 40 },
        { date: "2026-01-05", cost: 10, cumulative: 50 },
        { date: "2026-01-06", cost: 10, cumulative: 60 },
        { date: "2026-01-07", cost: 10, cumulative: 70 },
        { date: "2026-01-08", cost: 10, cumulative: 80 },
        { date: "2026-01-09", cost: 10, cumulative: 90 },
        { date: "2026-01-10", cost: 10, cumulative: 100 },
      ]);
      render(<CumulativeCostCard />);
      // Middle = Math.round(10/2) = 5
      expect(screen.getByText("Jan 1")).toBeInTheDocument();
      expect(screen.getByText("Jan 5")).toBeInTheDocument();
      expect(screen.getByText("Jan 10")).toBeInTheDocument();
    });
  });

  describe("Full Month Scenario", () => {
    beforeEach(() => {
      // 31 days of January with realistic data
      const trend = [];
      let cumulative = 0;
      for (let i = 1; i <= 31; i++) {
        const dailyCost = 20 + Math.random() * 30; // $20-50 per day
        cumulative += dailyCost;
        trend.push({
          date: `2026-01-${i.toString().padStart(2, "0")}`,
          cost: dailyCost,
          cumulative,
        });
      }
      mockGenerateCostTrend.mockReturnValue(trend);
    });

    it("renders full month data without errors", () => {
      const { container } = render(<CumulativeCostCard />);
      expect(screen.getByText("Cumulative Cost")).toBeInTheDocument();
      expect(container.querySelector("polyline")).toBeInTheDocument();
    });

    it("displays last day as Jan 31", () => {
      render(<CumulativeCostCard />);
      expect(screen.getByText("Jan 31")).toBeInTheDocument();
    });

    it("renders all chart elements for large dataset", () => {
      const { container } = render(<CumulativeCostCard />);
      expect(container.querySelector("#costGradient")).toBeInTheDocument();
      expect(container.querySelector("polyline")).toBeInTheDocument();
      expect(container.querySelector('line[y1="50"]')).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles empty data array gracefully", () => {
      mockGenerateCostTrend.mockReturnValue([]);

      // Component uses optional chaining for last element
      // currentCost = costData[costData.length - 1]?.cumulative ?? 0 = 0
      // dailyAvg = 0 / 0 = NaN, but formatCost handles it
      const { container } = render(<CumulativeCostCard />);
      expect(screen.getByText("Cumulative Cost")).toBeInTheDocument();
      // Chart should still render (empty)
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("handles very large cost values", () => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 5000, cumulative: 5000 },
        { date: "2026-01-02", cost: 5000, cumulative: 10000 },
      ]);
      render(<CumulativeCostCard />);
      // Should format with thousands separator
      const costLabels = screen.getAllByText("$10,000.00");
      expect(costLabels.length).toBeGreaterThanOrEqual(1);
    });

    it("handles fractional cents correctly", () => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 0.333, cumulative: 0.333 },
        { date: "2026-01-02", cost: 0.333, cumulative: 0.666 },
        { date: "2026-01-03", cost: 0.334, cumulative: 1.0 },
      ]);
      render(<CumulativeCostCard />);
      // formatCost rounds to 2 decimal places
      expect(screen.getByText("$0.33/day")).toBeInTheDocument();
    });
  });

  describe("Visual Indicators", () => {
    beforeEach(() => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 50, cumulative: 50 },
        { date: "2026-01-02", cost: 50, cumulative: 100 },
      ]);
    });

    it("renders TrendingUp icon in header", () => {
      const { container } = render(<CumulativeCostCard />);
      const icon = container.querySelector("svg.w-4.h-4");
      expect(icon).toBeInTheDocument();
    });

    it("applies correct emerald color to chart line", () => {
      const { container } = render(<CumulativeCostCard />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("stroke", "rgb(16, 185, 129)");
    });

    it("renders gradient with correct stops", () => {
      const { container } = render(<CumulativeCostCard />);
      const gradient = container.querySelector("#costGradient");
      const stops = gradient?.querySelectorAll("stop");
      expect(stops?.length).toBe(2);

      // First stop should be 0.3 opacity
      expect(stops?.[0]).toHaveAttribute("stop-opacity", "0.3");
      // Second stop should be 0 opacity
      expect(stops?.[1]).toHaveAttribute("stop-opacity", "0");
    });
  });

  describe("Responsive Layout", () => {
    beforeEach(() => {
      mockGenerateCostTrend.mockReturnValue([
        { date: "2026-01-01", cost: 100, cumulative: 100 },
        { date: "2026-01-02", cost: 100, cumulative: 200 },
      ]);
    });

    it("hides average on small screens (sm:inline class)", () => {
      const { container } = render(<CumulativeCostCard />);
      const avgElement = container.querySelector(".hidden.sm\\:inline");
      expect(avgElement).toBeInTheDocument();
      expect(avgElement?.textContent).toContain("Avg:");
    });

    it("maintains flex layout structure", () => {
      const { container } = render(<CumulativeCostCard />);
      // Card should have flex-col structure
      const card = container.querySelector(".flex.flex-col");
      expect(card).toBeInTheDocument();
    });
  });
});

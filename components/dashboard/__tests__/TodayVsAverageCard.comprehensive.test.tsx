import { render, screen } from "@testing-library/react";
import { TodayVsAverageCard } from "../TodayVsAverageCard";

const mockGenerateDailyComparison = jest.fn();

jest.mock("@/lib/mockData", () => ({
  generateDailyComparison: () => mockGenerateDailyComparison(),
}));

describe("TodayVsAverageCard - Real User Scenarios", () => {
  beforeEach(() => {
    mockGenerateDailyComparison.mockReset();
  });

  describe("Exceeding Daily Average", () => {
    beforeEach(() => {
      // User has exceeded their daily average in all metrics
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 20, time: 43200000, cost: 150.0 }, // 12 hours
        average: { sessions: 10, time: 21600000, cost: 75.0 }, // 6 hours
      });
    });

    it("displays today values greater than average", () => {
      render(<TodayVsAverageCard />);
      expect(screen.getByText("20")).toBeInTheDocument();
      expect(screen.getByText("$150.00")).toBeInTheDocument();
    });

    it("shows 200% when today is double the average", () => {
      const { container } = render(<TodayVsAverageCard />);
      // 20/10 * 100 = 200%
      const percentageTexts = container.querySelectorAll(
        ".text-xs.text-muted-foreground.text-right"
      );
      const percentages = Array.from(percentageTexts).map((el) => el.textContent);
      expect(percentages).toContain("200% of daily average");
    });

    it("caps progress bar width at 100% even when exceeding average", () => {
      const { container } = render(<TodayVsAverageCard />);
      // The inner fill divs should have max-width of 100%
      const fillBars = container.querySelectorAll(".h-full.rounded-full.transition-all");
      fillBars.forEach((bar) => {
        const style = bar.getAttribute("style");
        // Width should be capped at 100%
        if (style?.includes("width:")) {
          const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
          if (widthMatch) {
            expect(parseFloat(widthMatch[1])).toBeLessThanOrEqual(100);
          }
        }
      });
    });
  });

  describe("Below Daily Average", () => {
    beforeEach(() => {
      // User has used less than average today
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 3, time: 5400000, cost: 25.0 }, // 1.5 hours
        average: { sessions: 10, time: 21600000, cost: 100.0 }, // 6 hours
      });
    });

    it("displays today values less than average", () => {
      render(<TodayVsAverageCard />);
      expect(screen.getByText("3")).toBeInTheDocument();
      expect(screen.getByText("$25.00")).toBeInTheDocument();
    });

    it("shows correct low percentages", () => {
      const { container } = render(<TodayVsAverageCard />);
      // Sessions: 3/10 * 100 = 30%
      // Cost: 25/100 * 100 = 25%
      // Check that percentages are displayed in the right elements
      const percentageTexts = container.querySelectorAll(
        ".text-xs.text-muted-foreground.text-right"
      );
      const percentages = Array.from(percentageTexts).map((el) => el.textContent);
      expect(percentages).toContain("30% of daily average");
      expect(percentages).toContain("25% of daily average");
    });

    it("renders partial progress bar widths", () => {
      const { container } = render(<TodayVsAverageCard />);
      const fillBars = container.querySelectorAll(".h-full.rounded-full.transition-all");
      // Should have 3 bars with varying widths
      expect(fillBars.length).toBe(3);
    });
  });

  describe("Zero Usage Today", () => {
    beforeEach(() => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 0, time: 0, cost: 0 },
        average: { sessions: 8, time: 28800000, cost: 80.0 }, // 8 hours
      });
    });

    it("displays zero for today values", () => {
      render(<TodayVsAverageCard />);
      // Sessions: 0 formatted as "0" (not "0.0")
      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("shows 0% of daily average", () => {
      render(<TodayVsAverageCard />);
      const zeroPercents = screen.getAllByText("0% of daily average");
      expect(zeroPercents.length).toBe(3);
    });

    it("renders empty progress bars (0% width)", () => {
      const { container } = render(<TodayVsAverageCard />);
      const fillBars = container.querySelectorAll(".h-full.rounded-full.transition-all");
      fillBars.forEach((bar) => {
        const style = bar.getAttribute("style");
        expect(style).toContain("width: 0%");
      });
    });

    it("formats time as 0m for zero duration", () => {
      render(<TodayVsAverageCard />);
      expect(screen.getByText("0m")).toBeInTheDocument();
    });
  });

  describe("Zero Average (New User)", () => {
    beforeEach(() => {
      // Edge case: user just started, no average data yet
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 5, time: 7200000, cost: 50.0 }, // 2 hours
        average: { sessions: 0, time: 0, cost: 0 },
      });
    });

    it("handles division by zero gracefully", () => {
      render(<TodayVsAverageCard />);
      // When average is 0, percentage should be 0 (per code logic)
      const zeroPercents = screen.getAllByText("0% of daily average");
      expect(zeroPercents.length).toBe(3);
    });

    it("displays today values normally", () => {
      render(<TodayVsAverageCard />);
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("$50.00")).toBeInTheDocument();
    });
  });

  describe("Time Formatting", () => {
    it("formats time under 1 hour correctly", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 2, time: 2700000, cost: 20.0 }, // 45 minutes
        average: { sessions: 4, time: 5400000, cost: 40.0 }, // 1.5 hours
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("45m")).toBeInTheDocument();
    });

    it("formats time with hours and minutes", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 10, time: 19800000, cost: 100.0 }, // 5h 30m
        average: { sessions: 8, time: 14400000, cost: 80.0 }, // 4h
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("5h 30m")).toBeInTheDocument();
      expect(screen.getByText("4h 0m")).toBeInTheDocument();
    });

    it("formats long durations correctly", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 15, time: 57600000, cost: 200.0 }, // 16 hours
        average: { sessions: 12, time: 43200000, cost: 150.0 }, // 12 hours
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("16h 0m")).toBeInTheDocument();
      expect(screen.getByText("12h 0m")).toBeInTheDocument();
    });
  });

  describe("Session Count Formatting", () => {
    it("formats whole numbers without decimal", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 10, time: 3600000, cost: 50.0 },
        average: { sessions: 8, time: 3600000, cost: 50.0 },
      });
      render(<TodayVsAverageCard />);
      // 10.toFixed(1).replace(/\.0$/, '') = "10"
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText("8")).toBeInTheDocument();
    });

    it("formats average with decimal when needed", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 8, time: 3600000, cost: 50.0 },
        average: { sessions: 7.5, time: 3600000, cost: 50.0 },
      });
      render(<TodayVsAverageCard />);
      // 7.5.toFixed(1) = "7.5" (no .0 to replace)
      expect(screen.getByText("7.5")).toBeInTheDocument();
    });

    it("handles fractional session counts", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 5, time: 3600000, cost: 50.0 },
        average: { sessions: 4.3, time: 3600000, cost: 50.0 },
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("4.3")).toBeInTheDocument();
    });
  });

  describe("Percentage Calculations", () => {
    it("rounds percentage to whole number", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 7, time: 3600000, cost: 50.0 },
        average: { sessions: 11, time: 3600000, cost: 50.0 },
      });
      render(<TodayVsAverageCard />);
      // 7/11 * 100 = 63.636... -> 64%
      expect(screen.getByText("64% of daily average")).toBeInTheDocument();
    });

    it("shows 100% when today equals average", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 10, time: 36000000, cost: 100.0 },
        average: { sessions: 10, time: 36000000, cost: 100.0 },
      });
      render(<TodayVsAverageCard />);
      const fullPercents = screen.getAllByText("100% of daily average");
      expect(fullPercents.length).toBe(3);
    });

    it("handles very high percentages", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 100, time: 3600000, cost: 500.0 },
        average: { sessions: 10, time: 3600000, cost: 50.0 },
      });
      const { container } = render(<TodayVsAverageCard />);
      // 100/10 * 100 = 1000%
      const percentageTexts = container.querySelectorAll(
        ".text-xs.text-muted-foreground.text-right"
      );
      const percentages = Array.from(percentageTexts).map((el) => el.textContent);
      expect(percentages).toContain("1000% of daily average");
    });
  });

  describe("Progress Bar Gradients", () => {
    beforeEach(() => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 5, time: 18000000, cost: 50.0 },
        average: { sessions: 10, time: 36000000, cost: 100.0 },
      });
    });

    it("applies different gradient colors to each metric", () => {
      const { container } = render(<TodayVsAverageCard />);
      const fillBars = container.querySelectorAll(".h-full.rounded-full.transition-all");

      // Sessions: green gradient
      expect(fillBars[0]).toHaveAttribute("style", expect.stringContaining("#10b981"));

      // Time: blue gradient
      expect(fillBars[1]).toHaveAttribute("style", expect.stringContaining("#3b82f6"));

      // Cost: orange gradient
      expect(fillBars[2]).toHaveAttribute("style", expect.stringContaining("#f59e0b"));
    });
  });

  describe("Card Layout", () => {
    beforeEach(() => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 8, time: 21600000, cost: 89.55 },
        average: { sessions: 14.5, time: 32400000, cost: 105.54 },
      });
    });

    it("renders all three metrics in order", () => {
      const { container } = render(<TodayVsAverageCard />);
      const metricLabels = container.querySelectorAll(".font-medium.flex-shrink-0");
      expect(metricLabels[0].textContent).toBe("Sessions");
      expect(metricLabels[1].textContent).toBe("Time");
      expect(metricLabels[2].textContent).toBe("Cost");
    });

    it("renders Calendar icon in header", () => {
      const { container } = render(<TodayVsAverageCard />);
      const icon = container.querySelector("svg.w-4.h-4");
      expect(icon).toBeInTheDocument();
    });

    it("renders separators between today and average values", () => {
      render(<TodayVsAverageCard />);
      const separators = screen.getAllByText("/");
      expect(separators.length).toBe(3);
    });

    it("applies correct text styling to values", () => {
      const { container } = render(<TodayVsAverageCard />);
      // Today values should be bold
      const boldValues = container.querySelectorAll(".font-bold.text-foreground");
      expect(boldValues.length).toBe(3);

      // Average values should be muted
      const mutedValues = container.querySelectorAll(".text-muted-foreground.truncate");
      expect(mutedValues.length).toBe(3);
    });
  });

  describe("Edge Cases", () => {
    it("handles very small cost values", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 1, time: 60000, cost: 0.01 },
        average: { sessions: 1, time: 60000, cost: 0.02 },
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("$0.01")).toBeInTheDocument();
      expect(screen.getByText("$0.02")).toBeInTheDocument();
    });

    it("handles very large values", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 999, time: 359999000, cost: 9999.99 },
        average: { sessions: 500, time: 180000000, cost: 5000.0 },
      });
      render(<TodayVsAverageCard />);
      expect(screen.getByText("999")).toBeInTheDocument();
      expect(screen.getByText("$9,999.99")).toBeInTheDocument();
    });

    it("handles negative time gracefully", () => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 1, time: -1000, cost: 10.0 },
        average: { sessions: 1, time: 3600000, cost: 10.0 },
      });
      render(<TodayVsAverageCard />);
      // formatDuration returns "0m" for negative values
      expect(screen.getByText("0m")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    beforeEach(() => {
      mockGenerateDailyComparison.mockReturnValue({
        today: { sessions: 8, time: 21600000, cost: 89.55 },
        average: { sessions: 14.5, time: 32400000, cost: 105.54 },
      });
    });

    it("uses semantic text elements for values", () => {
      const { container } = render(<TodayVsAverageCard />);
      // All text should be readable by screen readers
      expect(container.textContent).toContain("Sessions");
      expect(container.textContent).toContain("Time");
      expect(container.textContent).toContain("Cost");
    });

    it("provides percentage context text", () => {
      render(<TodayVsAverageCard />);
      // Each metric has context about what the percentage means
      const contextTexts = screen.getAllByText(/of daily average/);
      expect(contextTexts.length).toBe(3);
    });
  });
});

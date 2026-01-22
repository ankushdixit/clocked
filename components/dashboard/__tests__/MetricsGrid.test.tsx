import { render, screen } from "@testing-library/react";
import { MetricsGrid } from "../MetricsGrid";
import type { MonthlySummary } from "@/types/electron";

const mockSummary: MonthlySummary = {
  month: "2026-01",
  totalSessions: 127,
  totalActiveTime: 564120000, // ~156h 42m
  estimatedApiCost: 847.23,
  humanTime: 0,
  claudeTime: 0,
  dailyActivity: [],
  topProjects: [],
};

describe("MetricsGrid Component", () => {
  it("renders all 6 metric cards", () => {
    render(<MetricsGrid summary={mockSummary} />);

    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Session Time")).toBeInTheDocument();
    expect(screen.getByText("API Cost")).toBeInTheDocument();
    expect(screen.getByText("Subscription")).toBeInTheDocument();
    expect(screen.getByText("Value")).toBeInTheDocument();
    expect(screen.getByText("Human : AI")).toBeInTheDocument();
  });

  it("displays session count", () => {
    render(<MetricsGrid summary={mockSummary} />);
    expect(screen.getByText("127")).toBeInTheDocument();
  });

  it("displays formatted session time", () => {
    render(<MetricsGrid summary={mockSummary} />);
    expect(screen.getByText("156h 42m")).toBeInTheDocument();
  });

  it("displays formatted API cost", () => {
    render(<MetricsGrid summary={mockSummary} />);
    expect(screen.getByText("$847.23")).toBeInTheDocument();
  });

  it("displays default subscription cost ($100)", () => {
    render(<MetricsGrid summary={mockSummary} />);
    expect(screen.getByText("$100.00")).toBeInTheDocument();
  });

  it("displays custom subscription cost when provided", () => {
    render(<MetricsGrid summary={mockSummary} subscriptionCost={200} />);
    expect(screen.getByText("$200.00")).toBeInTheDocument();
  });

  it("displays value multiplier", () => {
    render(<MetricsGrid summary={mockSummary} />);
    // 847.23 / 100 = 8.47x
    expect(screen.getByText("8.47x")).toBeInTheDocument();
  });

  it("displays em dash for human:AI ratio when no time data", () => {
    render(<MetricsGrid summary={mockSummary} />);
    // humanTime and claudeTime are both 0
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("displays actual ratio when time data is available", () => {
    const summaryWithTime: MonthlySummary = {
      ...mockSummary,
      humanTime: 6400000, // 64%
      claudeTime: 3600000, // 36%
    };
    render(<MetricsGrid summary={summaryWithTime} />);
    expect(screen.getByText("64% / 36%")).toBeInTheDocument();
  });

  it("highlights value multiplier when greater than 1", () => {
    render(<MetricsGrid summary={mockSummary} />);
    const valueText = screen.getByText("8.47x");
    expect(valueText).toHaveClass("text-emerald-500");
  });

  it("does not highlight value multiplier when less than 1", () => {
    const lowCostSummary: MonthlySummary = {
      ...mockSummary,
      estimatedApiCost: 50, // 0.5x multiplier
    };
    render(<MetricsGrid summary={lowCostSummary} />);
    const valueText = screen.getByText("0.50x");
    expect(valueText).not.toHaveClass("text-emerald-500");
  });

  it("renders in 3-column grid", () => {
    const { container } = render(<MetricsGrid summary={mockSummary} />);
    const grid = container.querySelector(".grid-cols-3");
    expect(grid).toBeInTheDocument();
  });
});

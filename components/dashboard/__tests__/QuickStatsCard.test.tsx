import { render, screen } from "@testing-library/react";
import { QuickStatsCard } from "../QuickStatsCard";

// Mock the mockData module
jest.mock("@/lib/mockData", () => ({
  generateQuickStats: () => ({
    busiestDay: { date: "2026-01-07", sessions: 22 },
    longestSession: { project: "raincheck", duration: 14400000 }, // 4 hours in ms
    mostActiveProject: "www",
    avgSessionLength: 8658000, // ~2h 24m in ms
    avgDailySessions: 14.5,
    peakHour: 14, // 2 PM
    totalMessages: 4872,
    avgCostPerSession: 7.26,
  }),
}));

describe("QuickStatsCard Component", () => {
  it("renders the card title", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Quick Stats")).toBeInTheDocument();
  });

  it("renders the Zap icon in the header", () => {
    render(<QuickStatsCard />);
    // Zap icon should be present alongside the title
    const title = screen.getByText("Quick Stats");
    const header = title.parentElement;
    expect(header?.querySelector("svg")).toBeInTheDocument();
  });

  it("renders all 6 stat items", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Busiest Day")).toBeInTheDocument();
    expect(screen.getByText("Longest Session")).toBeInTheDocument();
    expect(screen.getByText("Peak Hour")).toBeInTheDocument();
    expect(screen.getByText("Messages")).toBeInTheDocument();
    expect(screen.getByText("Avg Session")).toBeInTheDocument();
    expect(screen.getByText("Cost/Session")).toBeInTheDocument();
  });

  it("renders Busiest Day with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Busiest Day")).toBeInTheDocument();
    // Jan 7 formatted from "2026-01-07"
    expect(screen.getByText("Jan 7")).toBeInTheDocument();
    expect(screen.getByText("22 sessions")).toBeInTheDocument();
  });

  it("renders Longest Session with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Longest Session")).toBeInTheDocument();
    // 14400000ms = 4 hours
    expect(screen.getByText("4h 0m")).toBeInTheDocument();
    expect(screen.getByText("raincheck")).toBeInTheDocument();
  });

  it("renders Peak Hour with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Peak Hour")).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("most active")).toBeInTheDocument();
  });

  it("renders Messages with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
    // 4872 with locale formatting
    expect(screen.getByText("4,872")).toBeInTheDocument();
    expect(screen.getByText("this month")).toBeInTheDocument();
  });

  it("renders Avg Session with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Avg Session")).toBeInTheDocument();
    // 8658000ms = 2h 24m
    expect(screen.getByText("2h 24m")).toBeInTheDocument();
    expect(screen.getByText("duration")).toBeInTheDocument();
  });

  it("renders Cost/Session with correct value and subvalue", () => {
    render(<QuickStatsCard />);
    expect(screen.getByText("Cost/Session")).toBeInTheDocument();
    // $7.26 formatted as currency
    expect(screen.getByText("$7.26")).toBeInTheDocument();
    expect(screen.getByText("average")).toBeInTheDocument();
  });

  it("renders icons for each stat item", () => {
    const { container } = render(<QuickStatsCard />);
    // Each stat item has an icon (SVG), plus the header icon
    // 6 stat items + 1 header = 7 total SVG icons
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBe(7);
  });

  it("renders stat items in a responsive grid layout", () => {
    const { container } = render(<QuickStatsCard />);
    // Grid container with responsive columns (2 cols on mobile, 3 cols on sm+)
    const grid = container.querySelector(".grid.grid-cols-2.sm\\:grid-cols-3");
    expect(grid).toBeInTheDocument();
  });

  it("renders stat items with colored backgrounds", () => {
    const { container } = render(<QuickStatsCard />);
    // Each stat item has a colored background class pattern bg-{color}-500/10
    expect(container.querySelector('[class*="bg-orange-500/10"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-blue-500/10"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-purple-500/10"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-amber-500/10"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-pink-500/10"]')).toBeInTheDocument();
    expect(container.querySelector('[class*="bg-cyan-500/10"]')).toBeInTheDocument();
  });

  it("renders stat values in bold font", () => {
    render(<QuickStatsCard />);
    // Values should have font-bold class
    const janValue = screen.getByText("Jan 7");
    expect(janValue).toHaveClass("font-bold");
  });

  it("renders stat labels with accessible text color", () => {
    render(<QuickStatsCard />);
    // Labels should have text-foreground/70 class for better contrast
    const busiestDayLabel = screen.getByText("Busiest Day");
    expect(busiestDayLabel).toHaveClass("text-foreground/70");
  });

  it("renders subvalues with accessible text color", () => {
    render(<QuickStatsCard />);
    // Subvalues should have text-foreground/70 class for better contrast
    const sessionsSubvalue = screen.getByText("22 sessions");
    expect(sessionsSubvalue).toHaveClass("text-foreground/70");
  });

  it("renders each stat item with rounded corners", () => {
    const { container } = render(<QuickStatsCard />);
    // Each stat item container should have rounded-lg class
    const roundedItems = container.querySelectorAll(".rounded-lg");
    expect(roundedItems.length).toBeGreaterThanOrEqual(6);
  });
});

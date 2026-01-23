import { render, screen } from "@testing-library/react";
import { TodayVsAverageCard } from "../TodayVsAverageCard";

// Mock the mockData module
jest.mock("@/lib/mockData", () => ({
  generateDailyComparison: () => ({
    today: { sessions: 8, time: 21600000, cost: 89.55 },
    average: { sessions: 14.5, time: 32400000, cost: 105.54 },
  }),
}));

describe("TodayVsAverageCard Component", () => {
  it("renders the card title", () => {
    render(<TodayVsAverageCard />);
    expect(screen.getByText("Today vs Daily Average")).toBeInTheDocument();
  });

  it("renders the calendar icon in the header", () => {
    render(<TodayVsAverageCard />);
    // Calendar icon should be present alongside the title
    const title = screen.getByText("Today vs Daily Average");
    const header = title.parentElement;
    expect(header?.querySelector("svg")).toBeInTheDocument();
  });

  it("renders all three metrics: Sessions, Time, and Cost", () => {
    render(<TodayVsAverageCard />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
  });

  it("renders progress bars for each metric", () => {
    const { container } = render(<TodayVsAverageCard />);
    // Progress bars have the class h-3 bg-muted rounded-full
    const progressBars = container.querySelectorAll(".h-3.bg-muted.rounded-full");
    expect(progressBars.length).toBe(3);
  });

  it("displays today values for each metric", () => {
    render(<TodayVsAverageCard />);
    // Sessions: 8
    expect(screen.getByText("8")).toBeInTheDocument();
    // Cost: $89.55
    expect(screen.getByText("$89.55")).toBeInTheDocument();
  });

  it("displays average values for each metric", () => {
    render(<TodayVsAverageCard />);
    // Average sessions: 14.5
    expect(screen.getByText("14.5")).toBeInTheDocument();
    // Average cost: $105.54
    expect(screen.getByText("$105.54")).toBeInTheDocument();
  });

  it("displays percentage of daily average for each metric", () => {
    render(<TodayVsAverageCard />);
    // Should show "X% of daily average" text for each metric
    const percentageTexts = screen.getAllByText(/of daily average/);
    expect(percentageTexts.length).toBe(3);
  });

  it("calculates and displays correct percentage for sessions", () => {
    render(<TodayVsAverageCard />);
    // Sessions: today=8, average=14.5, percentage = (8/14.5)*100 = 55%
    expect(screen.getByText("55% of daily average")).toBeInTheDocument();
  });

  it("calculates and displays correct percentage for cost", () => {
    render(<TodayVsAverageCard />);
    // Cost: today=89.55, average=105.54, percentage = (89.55/105.54)*100 = 85%
    expect(screen.getByText("85% of daily average")).toBeInTheDocument();
  });

  it("renders separator between today and average values", () => {
    render(<TodayVsAverageCard />);
    // Each metric has a "/" separator
    const separators = screen.getAllByText("/");
    expect(separators.length).toBe(3);
  });

  it("renders progress bar fill elements inside each progress bar container", () => {
    const { container } = render(<TodayVsAverageCard />);
    // Inner fill divs with gradient backgrounds
    const progressBars = container.querySelectorAll(".h-3.bg-muted.rounded-full");
    progressBars.forEach((bar) => {
      const fillElement = bar.querySelector(".h-full.rounded-full");
      expect(fillElement).toBeInTheDocument();
    });
  });
});

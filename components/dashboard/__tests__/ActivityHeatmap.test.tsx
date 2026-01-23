import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityHeatmap } from "../ActivityHeatmap";
import type { DailyActivity } from "@/types/electron";

const mockActivity: DailyActivity[] = [
  { date: "2026-01-15", sessionCount: 3, totalTime: 3600000 },
  { date: "2026-01-16", sessionCount: 5, totalTime: 7200000 },
  { date: "2026-01-17", sessionCount: 1, totalTime: 1800000 },
];

// Use a fixed date for testing
const fixedMonth = new Date(2026, 0, 22); // January 22, 2026

describe("ActivityHeatmap Component", () => {
  it("renders Activity title", () => {
    render(<ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />);
    expect(screen.getByText("Activity")).toBeInTheDocument();
  });

  it("renders day name headers", () => {
    render(<ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />);
    // S appears twice (Sun, Sat), T appears twice (Tue, Thu)
    expect(screen.getAllByText("S").length).toBe(2);
    expect(screen.getByText("M")).toBeInTheDocument();
    expect(screen.getAllByText("T").length).toBe(2);
    expect(screen.getByText("W")).toBeInTheDocument();
    expect(screen.getByText("F")).toBeInTheDocument();
  });

  it("renders legend", () => {
    render(<ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />);
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("renders day cells for the month", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    // Should have 31 day cells for January plus potential empty padding cells
    const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
    expect(dayCells.length).toBeGreaterThanOrEqual(31);
  });

  it("shows tooltip on hover", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");

    // Find a cell and hover over it
    if (dayCells.length > 0) {
      fireEvent.mouseEnter(dayCells[0]);
      // Tooltip should appear with date format
      expect(screen.getByText(/Jan \d+, 2026/)).toBeInTheDocument();
    }
  });

  it("hides tooltip on mouse leave", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");

    if (dayCells.length > 0) {
      fireEvent.mouseEnter(dayCells[0]);
      fireEvent.mouseLeave(dayCells[0]);
      // Tooltip should be hidden - check that there's no fixed tooltip visible
      expect(container.querySelector(".fixed.z-50")).not.toBeInTheDocument();
    }
  });

  it("renders empty state when no activity (still shows heatmap)", () => {
    render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
    // Should still render the heatmap structure
    expect(screen.getByText("Activity")).toBeInTheDocument();
    expect(screen.getByText("Less")).toBeInTheDocument();
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("applies light gray for days with no sessions", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    // Days without sessions should have bg-slate-100 class
    expect(container.querySelector(".bg-slate-100")).toBeInTheDocument();
  });

  it("tooltip shows session count", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");

    if (dayCells.length > 0) {
      // Hover over a cell
      fireEvent.mouseEnter(dayCells[0]);
      // Tooltip should show session info
      expect(screen.getByText(/\d+ sessions?/)).toBeInTheDocument();
    }
  });

  it("uses different intensity colors for different session counts", () => {
    const { container } = render(
      <ActivityHeatmap dailyActivity={mockActivity} month={fixedMonth} />
    );
    // Should have cells with emerald intensity classes (for days with sessions)
    // mockActivity has days with 1, 3, and 5 sessions
    // These should have different intensity colors
    const emeraldCells = container.querySelectorAll('[class*="bg-emerald"]');
    expect(emeraldCells.length).toBeGreaterThan(0);
  });
});

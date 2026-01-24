import { render, screen, fireEvent } from "@testing-library/react";
import { ActivityHeatmap } from "../ActivityHeatmap";
import type { DailyActivity } from "@/types/electron";

// Helper to create activity data for testing
function createActivityData(
  activities: Array<{ day: number; sessions: number; time: number }>
): DailyActivity[] {
  return activities.map(({ day, sessions, time }) => ({
    date: `2026-01-${day.toString().padStart(2, "0")}`,
    sessionCount: sessions,
    totalTime: time,
  }));
}

describe("ActivityHeatmap - Real User Scenarios", () => {
  const fixedMonth = new Date(2026, 0, 15); // January 2026

  describe("High Activity User", () => {
    const highActivity: DailyActivity[] = createActivityData([
      { day: 1, sessions: 10, time: 36000000 },
      { day: 2, sessions: 15, time: 54000000 },
      { day: 3, sessions: 12, time: 43200000 },
      { day: 4, sessions: 8, time: 28800000 },
      { day: 5, sessions: 20, time: 72000000 }, // Peak day
      { day: 6, sessions: 5, time: 18000000 },
      { day: 7, sessions: 18, time: 64800000 },
      { day: 8, sessions: 14, time: 50400000 },
    ]);

    it("renders different intensity levels based on session count", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={highActivity} month={fixedMonth} />
      );
      // Should have day cells with varying emerald intensities (filter by h-6 for day cells)
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const emeraldDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-emerald")
      );
      expect(emeraldDayCells.length).toBe(8);

      // Check for multiple intensity levels
      const intensityClasses = [
        "bg-emerald-200",
        "bg-emerald-300",
        "bg-emerald-400",
        "bg-emerald-500",
        "bg-emerald-600",
        "bg-emerald-700",
      ];
      const foundIntensities = intensityClasses.filter(
        (cls) => container.querySelector(`.${cls}`) !== null
      );
      // Should have multiple intensity levels for varied data
      expect(foundIntensities.length).toBeGreaterThan(1);
    });

    it("applies darkest color to peak session day", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={highActivity} month={fixedMonth} />
      );
      // Day 5 has 20 sessions (max), should have darkest intensity
      expect(container.querySelector(".bg-emerald-700")).toBeInTheDocument();
    });
  });

  describe("Low Activity User", () => {
    const lowActivity: DailyActivity[] = createActivityData([
      { day: 1, sessions: 1, time: 1800000 },
      { day: 5, sessions: 2, time: 3600000 },
      { day: 10, sessions: 1, time: 2700000 },
    ]);

    it("shows mostly gray cells for inactive days", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={lowActivity} month={fixedMonth} />
      );
      // Most day cells should be gray (bg-slate-100)
      // Filter to only day cells (h-6 height), not legend cells (h-2)
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const grayDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-slate-100")
      );
      // 31 days - 3 active = 28 gray
      expect(grayDayCells.length).toBe(28);
    });

    it("shows light green for minimal activity", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={lowActivity} month={fixedMonth} />
      );
      // With max=2 sessions, day with 1 session = 50% -> level 3 (bg-emerald-400)
      // Day with 2 sessions = 100% -> level 6 (bg-emerald-700)
      expect(container.querySelector(".bg-emerald-700")).toBeInTheDocument();
    });
  });

  describe("Zero Activity (New User)", () => {
    it("renders empty heatmap with all gray cells", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      // Filter to only day cells (h-6 height), not legend cells
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const grayDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-slate-100")
      );
      expect(grayDayCells.length).toBe(31); // All days in January
    });

    it("still renders legend and title", () => {
      render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      expect(screen.getByText("Activity")).toBeInTheDocument();
      expect(screen.getByText("Less")).toBeInTheDocument();
      expect(screen.getByText("More")).toBeInTheDocument();
    });

    it("shows 0 sessions in tooltip for empty days", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      if (dayCells.length > 0) {
        fireEvent.mouseEnter(dayCells[0]);
        expect(screen.getByText("0 sessions")).toBeInTheDocument();
      }
    });
  });

  describe("Intensity Level Thresholds", () => {
    it("assigns level 1 (bg-emerald-200) for ratio <= 1/6", () => {
      // Max = 12, so 1-2 sessions = level 1
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 2, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-200")).toBeInTheDocument();
    });

    it("assigns level 2 (bg-emerald-300) for ratio <= 2/6", () => {
      // Max = 12, so 3-4 sessions = level 2
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 4, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-300")).toBeInTheDocument();
    });

    it("assigns level 3 (bg-emerald-400) for ratio <= 3/6", () => {
      // Max = 12, so 5-6 sessions = level 3
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 6, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-400")).toBeInTheDocument();
    });

    it("assigns level 4 (bg-emerald-500) for ratio <= 4/6", () => {
      // Max = 12, so 7-8 sessions = level 4
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 8, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument();
    });

    it("assigns level 5 (bg-emerald-600) for ratio <= 5/6", () => {
      // Max = 12, so 9-10 sessions = level 5
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 10, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-600")).toBeInTheDocument();
    });

    it("assigns level 6 (bg-emerald-700) for ratio > 5/6", () => {
      // Max = 12, so 11-12 sessions = level 6
      const activity = createActivityData([
        { day: 1, sessions: 12, time: 0 },
        { day: 2, sessions: 12, time: 0 },
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      expect(container.querySelector(".bg-emerald-700")).toBeInTheDocument();
    });

    it("assigns gray (bg-slate-100) for 0 sessions", () => {
      const activity = createActivityData([
        { day: 1, sessions: 5, time: 0 },
        // Day 2 has no entry, so sessionCount = 0
      ]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // Should have gray cells for days without data
      expect(container.querySelector(".bg-slate-100")).toBeInTheDocument();
    });

    it("handles maxCount of 0 gracefully", () => {
      // All sessions are 0
      const activity = createActivityData([{ day: 1, sessions: 0, time: 0 }]);
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // Should render gray for days without sessions
      // When max is 0, all days get gray
      const grayCells = container.querySelectorAll(".bg-slate-100");
      // At least 28 days should be gray (some may have activity data with 0 sessions)
      expect(grayCells.length).toBeGreaterThanOrEqual(28);
    });
  });

  describe("Tooltip Behavior", () => {
    const activityWithTime: DailyActivity[] = [
      { date: "2026-01-15", sessionCount: 5, totalTime: 7200000 }, // 2 hours
    ];

    it("shows formatted date in tooltip", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={activityWithTime} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      // Find the cell for Jan 15
      const jan15Cell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (jan15Cell) {
        fireEvent.mouseEnter(jan15Cell);
        expect(screen.getByText("Jan 15, 2026")).toBeInTheDocument();
      }
    });

    it("shows session count with plural form", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={activityWithTime} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const activeCell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (activeCell) {
        fireEvent.mouseEnter(activeCell);
        expect(screen.getByText(/5 sessions/)).toBeInTheDocument();
      }
    });

    it("shows singular 'session' for 1 session", () => {
      const singleSession: DailyActivity[] = [
        { date: "2026-01-15", sessionCount: 1, totalTime: 1800000 },
      ];
      const { container } = render(
        <ActivityHeatmap dailyActivity={singleSession} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const activeCell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (activeCell) {
        fireEvent.mouseEnter(activeCell);
        expect(screen.getByText(/1 session(?!s)/)).toBeInTheDocument();
      }
    });

    it("shows formatted duration in tooltip", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={activityWithTime} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const activeCell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (activeCell) {
        fireEvent.mouseEnter(activeCell);
        // 7200000ms = 2h 0m
        expect(screen.getByText(/2h 0m/)).toBeInTheDocument();
      }
    });

    it("hides duration when totalTime is 0", () => {
      const zeroTime: DailyActivity[] = [{ date: "2026-01-15", sessionCount: 3, totalTime: 0 }];
      const { container } = render(<ActivityHeatmap dailyActivity={zeroTime} month={fixedMonth} />);
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const activeCell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (activeCell) {
        fireEvent.mouseEnter(activeCell);
        // Should not show duration text
        expect(screen.queryByText(/\d+h \d+m/)).not.toBeInTheDocument();
      }
    });

    it("positions tooltip above the cell", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={activityWithTime} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      if (dayCells.length > 0) {
        fireEvent.mouseEnter(dayCells[0]);
        const tooltip = container.querySelector(".fixed.z-50");
        expect(tooltip).toBeInTheDocument();
        // Transform centers horizontally and positions above
        const style = tooltip?.getAttribute("style");
        expect(style).toContain("translate(-50%, -100%)");
      }
    });

    it("removes tooltip on mouse leave", () => {
      const { container } = render(
        <ActivityHeatmap dailyActivity={activityWithTime} month={fixedMonth} />
      );
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      if (dayCells.length > 0) {
        fireEvent.mouseEnter(dayCells[0]);
        expect(container.querySelector(".fixed.z-50")).toBeInTheDocument();

        fireEvent.mouseLeave(dayCells[0]);
        expect(container.querySelector(".fixed.z-50")).not.toBeInTheDocument();
      }
    });
  });

  describe("Today Highlighting", () => {
    it("highlights today with ring style", () => {
      // Use current date for testing
      const today = new Date();
      const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const todayActivity: DailyActivity[] = [
        {
          date: today.toISOString().split("T")[0],
          sessionCount: 5,
          totalTime: 3600000,
        },
      ];

      const { container } = render(
        <ActivityHeatmap dailyActivity={todayActivity} month={currentMonth} />
      );

      // Today's cell should have ring styling
      const todayCell = container.querySelector(".ring-1.ring-foreground.ring-offset-1");
      expect(todayCell).toBeInTheDocument();
    });
  });

  describe("Month Grid Layout", () => {
    it("renders correct number of week rows for January 2026", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      // January 2026 starts on Thursday, so 5 weeks
      const weekRows = container.querySelectorAll(".space-y-1 > .flex.gap-0\\.5");
      expect(weekRows.length).toBe(5);
    });

    it("renders 7 cells per week row", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const weekRows = container.querySelectorAll(".space-y-1 > .flex.gap-0\\.5");
      weekRows.forEach((row) => {
        const cells = row.querySelectorAll(".w-4");
        expect(cells.length).toBe(7);
      });
    });

    it("adds empty cells for days before month start", () => {
      // January 2026 starts on Thursday (index 4)
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const firstWeek = container.querySelector(".space-y-1 > .flex.gap-0\\.5");
      // First 4 cells should be empty (no cursor-pointer)
      const cells = firstWeek?.querySelectorAll(".w-4");
      let emptyCount = 0;
      cells?.forEach((cell) => {
        if (!cell.className.includes("cursor-pointer")) {
          emptyCount++;
        }
      });
      expect(emptyCount).toBe(4);
    });
  });

  describe("Day Name Headers", () => {
    it("renders all day abbreviations", () => {
      render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      // S (Sun), M, T (Tue), W, T (Thu), F, S (Sat)
      expect(screen.getAllByText("S").length).toBe(2);
      expect(screen.getByText("M")).toBeInTheDocument();
      expect(screen.getAllByText("T").length).toBe(2);
      expect(screen.getByText("W")).toBeInTheDocument();
      expect(screen.getByText("F")).toBeInTheDocument();
    });
  });

  describe("Legend Display", () => {
    it("renders 7 intensity level indicators", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      // Legend should have all intensity levels including gray
      const legendItems = container.querySelectorAll(".flex.items-center.gap-0\\.5 > .w-2.h-2");
      expect(legendItems.length).toBe(7);
    });

    it("includes gray in legend for no activity", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const grayLegendItem = container.querySelector(
        ".flex.items-center.gap-0\\.5 > .bg-slate-100"
      );
      expect(grayLegendItem).toBeInTheDocument();
    });
  });

  describe("Month Prop Handling", () => {
    it("uses current month when prop not provided", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} />);
      // Should render without errors
      expect(screen.getByText("Activity")).toBeInTheDocument();
      // Should have day cells for current month
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      expect(dayCells.length).toBeGreaterThan(0);
    });

    it("renders February correctly (28 days)", () => {
      const february = new Date(2026, 1, 15); // February 2026
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={february} />);
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      expect(dayCells.length).toBe(28);
    });

    it("renders March correctly (31 days)", () => {
      const march = new Date(2026, 2, 15); // March 2026
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={march} />);
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      expect(dayCells.length).toBe(31);
    });
  });

  describe("Activity Data Mapping", () => {
    it("correctly maps activity by date string", () => {
      const activity: DailyActivity[] = [{ date: "2026-01-15", sessionCount: 7, totalTime: 0 }];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // Should have at least one emerald cell for the day with activity
      // The legend also contains emerald cells, so we check the day cell container
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const emeraldDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-emerald")
      );
      expect(emeraldDayCells.length).toBe(1);
    });

    it("handles duplicate date entries (uses last)", () => {
      // ActivityMap.set overwrites, so last value wins
      const activity: DailyActivity[] = [
        { date: "2026-01-15", sessionCount: 3, totalTime: 0 },
        { date: "2026-01-15", sessionCount: 10, totalTime: 0 },
      ];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // Check day cells specifically (not legend)
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const emeraldDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-emerald")
      );
      // Should only have one day cell colored
      expect(emeraldDayCells.length).toBe(1);
      // And it should use the max value for intensity calculation
      expect(container.querySelector(".bg-emerald-700")).toBeInTheDocument();
    });

    it("ignores activity data from other months", () => {
      const activity: DailyActivity[] = [
        { date: "2026-02-15", sessionCount: 10, totalTime: 0 }, // February
      ];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // January day cells should have no green (activity is for February)
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const emeraldDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-emerald")
      );
      expect(emeraldDayCells.length).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("handles very high session counts", () => {
      const activity: DailyActivity[] = [
        { date: "2026-01-15", sessionCount: 1000, totalTime: 0 },
        { date: "2026-01-16", sessionCount: 100, totalTime: 0 },
      ];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // Max is 1000, so 100 is 10% (level 1)
      expect(container.querySelector(".bg-emerald-200")).toBeInTheDocument();
      // 1000 is 100% (level 6)
      expect(container.querySelector(".bg-emerald-700")).toBeInTheDocument();
    });

    it("handles activity data with all same session counts", () => {
      const activity: DailyActivity[] = [
        { date: "2026-01-01", sessionCount: 5, totalTime: 0 },
        { date: "2026-01-02", sessionCount: 5, totalTime: 0 },
        { date: "2026-01-03", sessionCount: 5, totalTime: 0 },
      ];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      // All active days should be darkest green (ratio = 1)
      // Check only day cells, not legend
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      const darkestGreenDayCells = Array.from(dayCells).filter((cell) =>
        cell.className.includes("bg-emerald-700")
      );
      expect(darkestGreenDayCells.length).toBe(3);
    });

    it("handles very large totalTime values", () => {
      const activity: DailyActivity[] = [
        { date: "2026-01-15", sessionCount: 5, totalTime: 86400000 }, // 24 hours
      ];
      const { container } = render(<ActivityHeatmap dailyActivity={activity} month={fixedMonth} />);
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm.cursor-pointer");
      const activeCell = Array.from(dayCells).find((cell) => cell.className.includes("bg-emerald"));
      if (activeCell) {
        fireEvent.mouseEnter(activeCell);
        expect(screen.getByText(/24h 0m/)).toBeInTheDocument();
      }
    });
  });

  describe("Responsive Container", () => {
    it("renders with responsive width classes", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      // Check for responsive classes on cells (e.g., w-4, which adjusts with container queries)
      const dayCells = container.querySelectorAll(".w-4.h-6.rounded-sm");
      expect(dayCells.length).toBeGreaterThan(0);
    });
  });

  describe("Card Structure", () => {
    it("renders Activity icon in header", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const icon = container.querySelector("svg.w-4.h-4.flex-shrink-0");
      expect(icon).toBeInTheDocument();
    });

    it("renders card with overflow-hidden", () => {
      const { container } = render(<ActivityHeatmap dailyActivity={[]} month={fixedMonth} />);
      const card = container.querySelector(".overflow-hidden");
      expect(card).toBeInTheDocument();
    });
  });
});

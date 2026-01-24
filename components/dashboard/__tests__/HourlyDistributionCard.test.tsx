import { render, screen, fireEvent } from "@testing-library/react";
import { HourlyDistributionCard } from "../HourlyDistributionCard";

// Mock the data generation function
jest.mock("@/lib/mockData", () => ({
  generateHourlyDistribution: () => [
    { hour: 0, sessions: 2 },
    { hour: 1, sessions: 1 },
    { hour: 2, sessions: 0 },
    { hour: 3, sessions: 0 },
    { hour: 4, sessions: 1 },
    { hour: 5, sessions: 3 },
    { hour: 6, sessions: 8 },
    { hour: 7, sessions: 15 },
    { hour: 8, sessions: 28 },
    { hour: 9, sessions: 42 },
    { hour: 10, sessions: 38 },
    { hour: 11, sessions: 35 },
    { hour: 12, sessions: 22 },
    { hour: 13, sessions: 30 },
    { hour: 14, sessions: 45 }, // Peak hour
    { hour: 15, sessions: 40 },
    { hour: 16, sessions: 32 },
    { hour: 17, sessions: 25 },
    { hour: 18, sessions: 18 },
    { hour: 19, sessions: 12 },
    { hour: 20, sessions: 8 },
    { hour: 21, sessions: 5 },
    { hour: 22, sessions: 3 },
    { hour: 23, sessions: 2 },
  ],
}));

describe("HourlyDistributionCard Component", () => {
  it("renders the card title 'Session Distribution'", () => {
    render(<HourlyDistributionCard />);
    expect(screen.getByText("Session Distribution")).toBeInTheDocument();
  });

  it("displays peak hour information", () => {
    render(<HourlyDistributionCard />);
    // Peak hour is 14 (2 PM) with 45 sessions
    expect(screen.getByText(/Peak at/)).toBeInTheDocument();
    expect(screen.getByText("14:00")).toBeInTheDocument();
  });

  it("renders 24 hour bars", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Each hour has a bar container (flex-1 divs inside the h-32 container)
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");
    expect(hourBars).toHaveLength(24);
  });

  it("renders time labels for major time points", () => {
    render(<HourlyDistributionCard />);
    // The component shows 12am, 6am, 12pm, 6pm, 12am labels
    const twelvAm = screen.getAllByText("12am");
    expect(twelvAm).toHaveLength(2); // Start and end labels
    expect(screen.getByText("6am")).toBeInTheDocument();
    expect(screen.getByText("12pm")).toBeInTheDocument();
    expect(screen.getByText("6pm")).toBeInTheDocument();
  });

  it("renders the Clock icon", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Lucide icons render as SVGs with specific classes
    const clockIcon = container.querySelector("svg.w-4.h-4");
    expect(clockIcon).toBeInTheDocument();
  });

  it("applies different styling to peak hour bar", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Peak hour bar should have full emerald color (bg-emerald-500)
    // Non-peak bars have bg-emerald-500/40 (with opacity)
    const allBars = container.querySelectorAll('[class*="bg-emerald"]');
    // Should have bars with emerald styling
    expect(allBars.length).toBeGreaterThan(0);
    // Check that there's exactly one peak bar (without opacity modifier)
    const peakBars = Array.from(allBars).filter(
      (bar) => bar.className.includes("bg-emerald-500") && !bar.className.includes("/40")
    );
    expect(peakBars.length).toBe(1);
  });

  it("shows tooltip on hover with session information", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Get the hour bars (flex-1 divs inside the h-32 container)
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over the 15th bar (index 14, which is 2pm with 45 sessions)
    if (hourBars && hourBars[14]) {
      fireEvent.mouseEnter(hourBars[14]);
      // Tooltip should show the time range and session count
      expect(screen.getByText("2pm - 3pm")).toBeInTheDocument();
      expect(screen.getByText("45 sessions")).toBeInTheDocument();

      // Mouse leave should hide the tooltip
      fireEvent.mouseLeave(hourBars[14]);
      expect(screen.queryByText("2pm - 3pm")).not.toBeInTheDocument();
    }
  });

  it("renders within a Card component structure", () => {
    const { container } = render(<HourlyDistributionCard />);
    // The Card component should be present (Radix/shadcn uses data attributes or specific class patterns)
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeInTheDocument();
  });
});

describe("HourlyDistributionCard tooltip interactions", () => {
  it("shows tooltip on mouse enter for morning hours", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over 9am bar (index 9)
    if (hourBars && hourBars[9]) {
      fireEvent.mouseEnter(hourBars[9]);
      expect(screen.getByText("9am - 10am")).toBeInTheDocument();
      expect(screen.getByText("42 sessions")).toBeInTheDocument();
    }
  });

  it("shows tooltip on mouse enter for midnight hours", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over midnight bar (index 0)
    if (hourBars && hourBars[0]) {
      fireEvent.mouseEnter(hourBars[0]);
      expect(screen.getByText("12am - 1am")).toBeInTheDocument();
      expect(screen.getByText("2 sessions")).toBeInTheDocument();
    }
  });

  it("shows tooltip on mouse enter for noon", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over noon bar (index 12)
    if (hourBars && hourBars[12]) {
      fireEvent.mouseEnter(hourBars[12]);
      expect(screen.getByText("12pm - 1pm")).toBeInTheDocument();
      expect(screen.getByText("22 sessions")).toBeInTheDocument();
    }
  });

  it("shows tooltip on mouse enter for 11pm", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over 11pm bar (index 23)
    if (hourBars && hourBars[23]) {
      fireEvent.mouseEnter(hourBars[23]);
      // Hour 23 (11pm) wraps to 12am for end time
      expect(screen.getByText("11pm - 12am")).toBeInTheDocument();
      expect(screen.getByText("2 sessions")).toBeInTheDocument();
    }
  });

  it("hides tooltip on mouse leave", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars && hourBars[9]) {
      fireEvent.mouseEnter(hourBars[9]);
      expect(container.querySelector(".fixed.z-50")).toBeInTheDocument();

      fireEvent.mouseLeave(hourBars[9]);
      expect(container.querySelector(".fixed.z-50")).not.toBeInTheDocument();
    }
  });

  it("shows singular 'session' for 1 session", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over 1am bar (index 1) which has 1 session
    if (hourBars && hourBars[1]) {
      fireEvent.mouseEnter(hourBars[1]);
      expect(screen.getByText("1 session")).toBeInTheDocument();
    }
  });

  it("shows plural 'sessions' for multiple sessions", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over 9am bar (index 9) which has 42 sessions
    if (hourBars && hourBars[9]) {
      fireEvent.mouseEnter(hourBars[9]);
      expect(screen.getByText("42 sessions")).toBeInTheDocument();
    }
  });

  it("updates tooltip when moving between bars", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars && hourBars.length >= 2) {
      // Hover first bar
      fireEvent.mouseEnter(hourBars[9]);
      expect(screen.getByText("42 sessions")).toBeInTheDocument();
      fireEvent.mouseLeave(hourBars[9]);

      // Hover different bar
      fireEvent.mouseEnter(hourBars[14]);
      expect(screen.getByText("45 sessions")).toBeInTheDocument();
    }
  });
});

describe("HourlyDistributionCard bar height calculations", () => {
  it("sets bar height relative to max sessions", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      // Peak hour (index 14, 45 sessions) should have 100% height
      const peakBar = hourBars[14].querySelector('[class*="bg-emerald"]');
      expect(peakBar).toHaveStyle({ height: "100%" });

      // Hour with 0 sessions (index 2) should have 0 height
      const zeroBar = hourBars[2].querySelector('[class*="bg-emerald"]');
      expect(zeroBar).toHaveStyle({ height: "0" });
    }
  });

  it("calculates proportional height for mid-range values", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      // Hour 9 has 42 sessions, max is 45
      // Expected height: (42/45) * 100 = ~93.3%
      const bar9 = hourBars[9].querySelector('[class*="bg-emerald"]');
      const height = (bar9 as HTMLElement)?.style.height;
      // Parse the percentage and verify it's close to expected
      const heightValue = parseFloat(height);
      expect(heightValue).toBeGreaterThan(90);
      expect(heightValue).toBeLessThan(100);
    }
  });

  it("sets minimum height of 2px for bars with sessions > 0", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      // Hour 1 has 1 session (small but non-zero)
      const smallBar = hourBars[1].querySelector('[class*="bg-emerald"]');
      const minHeight = (smallBar as HTMLElement)?.style.minHeight;
      expect(minHeight).toBe("2px");
    }
  });
});

describe("HourlyDistributionCard peak hour detection", () => {
  it("identifies correct peak hour", () => {
    render(<HourlyDistributionCard />);
    // Peak hour is 14 (2pm) with 45 sessions
    expect(screen.getByText("14:00")).toBeInTheDocument();
  });

  it("highlights peak hour bar differently", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      // Peak bar (index 14) should have bg-emerald-500 without opacity
      const peakBar = hourBars[14].querySelector('[class*="bg-emerald"]');
      expect(peakBar?.className).toContain("bg-emerald-500");
      expect(peakBar?.className).not.toContain("/40");

      // Non-peak bar should have opacity
      const normalBar = hourBars[10].querySelector('[class*="bg-emerald"]');
      expect(normalBar?.className).toContain("bg-emerald-500/40");
    }
  });
});

describe("HourlyDistributionCard hour formatting", () => {
  it("formats hour 0 as 12am", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars && hourBars[0]) {
      fireEvent.mouseEnter(hourBars[0]);
      // 12am - 1am range shown in tooltip
      expect(screen.getByText("12am - 1am")).toBeInTheDocument();
    }
  });

  it("formats hour 12 as 12pm", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars && hourBars[12]) {
      fireEvent.mouseEnter(hourBars[12]);
      // 12pm - 1pm range shown in tooltip
      expect(screen.getByText("12pm - 1pm")).toBeInTheDocument();
    }
  });

  it("formats morning hours correctly (am)", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Test 8am
    if (hourBars && hourBars[8]) {
      fireEvent.mouseEnter(hourBars[8]);
      expect(screen.getByText("8am - 9am")).toBeInTheDocument();
    }
  });

  it("formats afternoon hours correctly (pm)", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Test 3pm (index 15)
    if (hourBars && hourBars[15]) {
      fireEvent.mouseEnter(hourBars[15]);
      expect(screen.getByText("3pm - 4pm")).toBeInTheDocument();
    }
  });
});

describe("HourlyDistributionCard empty/zero hour handling", () => {
  it("renders bars for hours with zero sessions", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hours 2 and 3 have 0 sessions in mock data
    expect(hourBars?.length).toBe(24);

    // Zero session bars should still be in DOM but with 0 height
    if (hourBars) {
      const zeroBar = hourBars[2].querySelector('[class*="bg-emerald"]');
      expect(zeroBar).toHaveStyle({ height: "0" });
      expect(zeroBar).toHaveStyle({ minHeight: "0" });
    }
  });

  it("shows tooltip for hours with zero sessions", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    // Hover over hour 2 (0 sessions)
    if (hourBars && hourBars[2]) {
      fireEvent.mouseEnter(hourBars[2]);
      // Should show time range even for 0 sessions
      expect(screen.getByText("2am - 3am")).toBeInTheDocument();
      expect(screen.getByText("0 sessions")).toBeInTheDocument();
    }
  });
});

describe("HourlyDistributionCard cursor behavior", () => {
  it("bars have cursor-pointer for interactivity", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      Array.from(hourBars).forEach((bar) => {
        expect(bar.className).toContain("cursor-pointer");
      });
    }
  });
});

describe("HourlyDistributionCard bar styling", () => {
  it("bars have rounded top corners", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32");
    const hourBars = barContainer?.querySelectorAll(".flex-1");

    if (hourBars) {
      // Get inner bars with color
      const colorBars = container.querySelectorAll('[class*="bg-emerald"][class*="rounded-t-sm"]');
      expect(colorBars.length).toBe(24);
    }
  });

  it("bars have hover opacity transition", () => {
    const { container } = render(<HourlyDistributionCard />);
    const colorBars = container.querySelectorAll('[class*="bg-emerald"][class*="transition-all"]');
    expect(colorBars.length).toBeGreaterThan(0);
  });
});

describe("HourlyDistributionCard layout", () => {
  it("renders within a flex column card structure", () => {
    const { container } = render(<HourlyDistributionCard />);
    const card = container.querySelector(".flex.flex-col.h-full");
    expect(card).toBeInTheDocument();
  });

  it("has flex-1 bars container with gap", () => {
    const { container } = render(<HourlyDistributionCard />);
    const barContainer = container.querySelector(".h-32.flex.items-end.gap-0\\.5");
    expect(barContainer).toBeInTheDocument();
  });

  it("has time axis labels at bottom", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Time axis labels container
    const timeLabels = container.querySelector(".flex.justify-between.mt-2");
    expect(timeLabels).toBeInTheDocument();

    // Check all 5 labels are present
    expect(screen.getAllByText("12am").length).toBe(2);
    expect(screen.getByText("6am")).toBeInTheDocument();
    expect(screen.getByText("12pm")).toBeInTheDocument();
    expect(screen.getByText("6pm")).toBeInTheDocument();
  });
});

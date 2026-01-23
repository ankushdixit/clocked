import { render, screen } from "@testing-library/react";
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
    // Each hour has a bar container with title attribute like "X:00 - Y sessions"
    const hourBars = container.querySelectorAll('[title*=":00 -"]');
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

  it("includes tooltip information for each hour bar", () => {
    const { container } = render(<HourlyDistributionCard />);
    // Check that bars have title attributes with session counts
    const barWith45Sessions = container.querySelector('[title="14:00 - 45 sessions"]');
    expect(barWith45Sessions).toBeInTheDocument();

    const barWithZeroSessions = container.querySelector('[title="2:00 - 0 sessions"]');
    expect(barWithZeroSessions).toBeInTheDocument();
  });

  it("renders within a Card component structure", () => {
    const { container } = render(<HourlyDistributionCard />);
    // The Card component should be present (Radix/shadcn uses data attributes or specific class patterns)
    const card = container.querySelector('[class*="card"]');
    expect(card).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { ClaudeMaxLimitsCard } from "../ClaudeMaxLimitsCard";

describe("ClaudeMaxLimitsCard Component", () => {
  it("renders the card title", () => {
    render(<ClaudeMaxLimitsCard />);
    expect(screen.getByText("Claude Max Limits")).toBeInTheDocument();
  });

  it("renders the alert icon in the header", () => {
    render(<ClaudeMaxLimitsCard />);
    // AlertCircle icon should be present alongside the title
    const title = screen.getByText("Claude Max Limits");
    const header = title.parentElement;
    expect(header?.querySelector("svg")).toBeInTheDocument();
  });

  it("renders all three limit indicators: Session, Weekly, and Sonnet", () => {
    render(<ClaudeMaxLimitsCard />);
    expect(screen.getByText("Session")).toBeInTheDocument();
    expect(screen.getByText("Weekly")).toBeInTheDocument();
    expect(screen.getByText("Sonnet")).toBeInTheDocument();
  });

  it("displays percentage values for each limit", () => {
    render(<ClaudeMaxLimitsCard />);
    // Session: 1%, Weekly: 62%, Sonnet: 0%
    expect(screen.getByText("1%")).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("displays reset info for Session limit", () => {
    render(<ClaudeMaxLimitsCard />);
    expect(screen.getByText("Resets 2pm")).toBeInTheDocument();
  });

  it("displays reset info for Weekly limit", () => {
    render(<ClaudeMaxLimitsCard />);
    // Weekly and Sonnet have the same reset date
    const resetTexts = screen.getAllByText("Resets Jan 25, 4pm");
    expect(resetTexts.length).toBe(2);
  });

  it("displays reset info for Sonnet limit", () => {
    render(<ClaudeMaxLimitsCard />);
    // The Sonnet reset info is part of the multiple matches
    const resetTexts = screen.getAllByText("Resets Jan 25, 4pm");
    expect(resetTexts.length).toBeGreaterThanOrEqual(1);
  });

  it("renders circular progress indicators (SVG circles)", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Each limit has an SVG with circles for the progress indicator
    const svgElements = container.querySelectorAll("svg.w-full.h-full");
    expect(svgElements.length).toBe(3);
  });

  it("renders background circles for each progress indicator", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Each progress indicator has a background circle (text-muted class)
    const backgroundCircles = container.querySelectorAll("circle.text-muted");
    expect(backgroundCircles.length).toBe(3);
  });

  it("renders gradient definitions for styling", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Check for gradient definitions
    expect(container.querySelector("#sessionGradient")).toBeInTheDocument();
    expect(container.querySelector("#weeklyGradient")).toBeInTheDocument();
    expect(container.querySelector("#sonnetGradient")).toBeInTheDocument();
  });

  it("renders the correct SVG viewBox attribute", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    const progressSvgs = container.querySelectorAll('svg[viewBox="0 0 100 100"]');
    expect(progressSvgs.length).toBe(3);
  });

  it("positions percentage values in center of circular indicators", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Percentage values are inside absolute positioned containers
    const centerContainers = container.querySelectorAll(".absolute.inset-0.flex");
    expect(centerContainers.length).toBe(3);
  });

  it("renders circular progress with correct stroke properties", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Progress circles should have strokeWidth of 12
    const circles = container.querySelectorAll('circle[stroke-width="12"]');
    // 6 circles total (3 background + 3 progress)
    expect(circles.length).toBe(6);
  });

  it("renders limit labels below each indicator", () => {
    render(<ClaudeMaxLimitsCard />);
    // Labels should be visible
    const sessionLabel = screen.getByText("Session");
    const weeklyLabel = screen.getByText("Weekly");
    const sonnetLabel = screen.getByText("Sonnet");

    expect(sessionLabel).toBeInTheDocument();
    expect(weeklyLabel).toBeInTheDocument();
    expect(sonnetLabel).toBeInTheDocument();
  });

  it("displays all limits in a horizontal layout", () => {
    const { container } = render(<ClaudeMaxLimitsCard />);
    // Container with flex and justify-evenly
    const limitsContainer = container.querySelector(".flex.items-start.justify-evenly");
    expect(limitsContainer).toBeInTheDocument();
    // Should have 3 children (one per limit)
    expect(limitsContainer?.children.length).toBe(3);
  });
});

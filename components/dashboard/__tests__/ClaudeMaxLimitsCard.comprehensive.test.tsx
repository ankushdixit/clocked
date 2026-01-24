import { render, screen } from "@testing-library/react";
import { ClaudeMaxLimitsCard } from "../ClaudeMaxLimitsCard";

/**
 * Note: The ClaudeMaxLimitsCard currently uses hardcoded mock data.
 * These tests validate the component's behavior with that data structure.
 * When the component is updated to accept dynamic data, these tests
 * will need to be updated to use mocks/props.
 */

describe("ClaudeMaxLimitsCard - Real User Scenarios", () => {
  describe("Current Hardcoded Data Display", () => {
    it("renders all three limit types", () => {
      render(<ClaudeMaxLimitsCard />);
      expect(screen.getByText("Session")).toBeInTheDocument();
      expect(screen.getByText("Weekly")).toBeInTheDocument();
      expect(screen.getByText("Sonnet")).toBeInTheDocument();
    });

    it("displays correct percentage for each limit", () => {
      render(<ClaudeMaxLimitsCard />);
      expect(screen.getByText("1%")).toBeInTheDocument();
      expect(screen.getByText("62%")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("displays reset time information", () => {
      render(<ClaudeMaxLimitsCard />);
      expect(screen.getByText("Resets 2pm")).toBeInTheDocument();
      // Weekly and Sonnet share the same reset time
      const weeklyResets = screen.getAllByText("Resets Jan 25, 4pm");
      expect(weeklyResets.length).toBe(2);
    });
  });

  describe("Circular Progress Indicators", () => {
    it("renders three SVG circular indicators", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const circularSvgs = container.querySelectorAll('svg[viewBox="0 0 100 100"]');
      expect(circularSvgs.length).toBe(3);
    });

    it("renders background circles for each indicator", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const backgroundCircles = container.querySelectorAll("circle.text-muted");
      expect(backgroundCircles.length).toBe(3);
    });

    it("applies correct circle dimensions in progress indicators", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Get circles from the circular progress SVGs (viewBox 0 0 100 100)
      const progressSvgs = container.querySelectorAll('svg[viewBox="0 0 100 100"]');
      progressSvgs.forEach((svg) => {
        const circles = svg.querySelectorAll("circle");
        circles.forEach((circle) => {
          expect(circle).toHaveAttribute("cx", "50");
          expect(circle).toHaveAttribute("cy", "50");
          expect(circle).toHaveAttribute("r", "42");
        });
      });
    });

    it("renders circles with stroke-width of 12", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const circles = container.querySelectorAll('circle[stroke-width="12"]');
      // 3 background + 3 progress circles
      expect(circles.length).toBe(6);
    });
  });

  describe("Progress Arc Calculation", () => {
    it("calculates correct strokeDasharray for 1% progress", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Session limit is 1%
      // strokeDasharray = percentage * 2.64 = 1 * 2.64 = 2.64
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');
      // Find the session circle (first one)
      const sessionCircle = progressCircles[0];
      expect(sessionCircle).toHaveAttribute("stroke-dasharray", "2.64 264");
    });

    it("calculates correct strokeDasharray for 62% progress", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Weekly limit is 62%
      // strokeDasharray = 62 * 2.64 = 163.68
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');
      const weeklyCircle = progressCircles[1];
      expect(weeklyCircle).toHaveAttribute("stroke-dasharray", "163.68 264");
    });

    it("calculates correct strokeDasharray for 0% progress", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Sonnet limit is 0%
      // strokeDasharray = 0 * 2.64 = 0
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');
      const sonnetCircle = progressCircles[2];
      expect(sonnetCircle).toHaveAttribute("stroke-dasharray", "0 264");
    });
  });

  describe("Gradient Definitions", () => {
    it("defines all three gradients", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      expect(container.querySelector("#sessionGradient")).toBeInTheDocument();
      expect(container.querySelector("#weeklyGradient")).toBeInTheDocument();
      expect(container.querySelector("#sonnetGradient")).toBeInTheDocument();
    });

    it("sessionGradient uses green colors", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const sessionGradient = container.querySelector("#sessionGradient");
      const stops = sessionGradient?.querySelectorAll("stop");
      expect(stops?.[0]).toHaveAttribute("stop-color", "#10b981");
      expect(stops?.[1]).toHaveAttribute("stop-color", "#14b8a6");
    });

    it("weeklyGradient uses blue to purple colors", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const weeklyGradient = container.querySelector("#weeklyGradient");
      const stops = weeklyGradient?.querySelectorAll("stop");
      expect(stops?.[0]).toHaveAttribute("stop-color", "#3b82f6");
      expect(stops?.[1]).toHaveAttribute("stop-color", "#8b5cf6");
    });

    it("sonnetGradient uses amber to orange colors", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const sonnetGradient = container.querySelector("#sonnetGradient");
      const stops = sonnetGradient?.querySelectorAll("stop");
      expect(stops?.[0]).toHaveAttribute("stop-color", "#f59e0b");
      expect(stops?.[1]).toHaveAttribute("stop-color", "#f97316");
    });
  });

  describe("Warning Color for High Usage", () => {
    // The component uses percentage > 80 to trigger red color
    // With current hardcoded data, only weekly (62%) is tested

    it("applies gradient stroke to limits under 80%", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');

      // Session (1%) should use gradient
      expect(progressCircles[0]).toHaveAttribute("stroke", "url(#sessionGradient)");

      // Weekly (62%) should use gradient
      expect(progressCircles[1]).toHaveAttribute("stroke", "url(#weeklyGradient)");

      // Sonnet (0%) should use gradient
      expect(progressCircles[2]).toHaveAttribute("stroke", "url(#sonnetGradient)");
    });

    it("would apply red color for limits over 80%", () => {
      // Note: Current hardcoded data doesn't include a >80% case
      // This documents the expected behavior when percentage > 80
      // The ternary is: percentage > 80 ? "#ef4444" : limit.gradient
      const { container } = render(<ClaudeMaxLimitsCard />);
      // No circles should currently be red
      const redCircles = container.querySelectorAll('circle[stroke="#ef4444"]');
      expect(redCircles.length).toBe(0);
    });
  });

  describe("Layout and Positioning", () => {
    it("positions indicators in a horizontal row", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const limitsContainer = container.querySelector(".flex.items-start.justify-evenly");
      expect(limitsContainer).toBeInTheDocument();
      expect(limitsContainer?.children.length).toBe(3);
    });

    it("centers percentage in circular indicator", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const centerContainers = container.querySelectorAll(
        ".absolute.inset-0.flex.flex-col.items-center.justify-center"
      );
      expect(centerContainers.length).toBe(3);
    });

    it("renders labels below indicators", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const labels = container.querySelectorAll(".text-xs.font-medium.mt-1");
      expect(labels.length).toBe(3);
    });

    it("renders reset info below labels", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const resetInfo = container.querySelectorAll(".text-\\[10px\\].text-muted-foreground");
      expect(resetInfo.length).toBe(3);
    });
  });

  describe("Card Structure", () => {
    it("renders AlertCircle icon in header", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const icon = container.querySelector("svg.w-4.h-4.flex-shrink-0");
      expect(icon).toBeInTheDocument();
    });

    it("renders title text", () => {
      render(<ClaudeMaxLimitsCard />);
      expect(screen.getByText("Claude Max Limits")).toBeInTheDocument();
    });

    it("has correct card layout classes", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const card = container.querySelector(".h-full.flex.flex-col.overflow-hidden");
      expect(card).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("applies responsive width classes to circles", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const circleContainers = container.querySelectorAll('[class*="w-24"][class*="h-24"]');
      expect(circleContainers.length).toBe(3);
    });

    it("applies responsive text sizes to percentages", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const percentageTexts = container.querySelectorAll(
        '[class*="text-base"][class*="sm:text-lg"]'
      );
      expect(percentageTexts.length).toBe(3);
    });

    it("truncates long labels with max-width", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const labels = container.querySelectorAll(".truncate.max-w-full");
      expect(labels.length).toBe(6); // 3 labels + 3 reset info texts
    });
  });

  describe("SVG Transform", () => {
    it("rotates circular SVGs -90 degrees for top-start position", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const circularSvgs = container.querySelectorAll("svg.w-full.h-full.transform.-rotate-90");
      expect(circularSvgs.length).toBe(3);
    });
  });

  describe("Gradient SVG Container", () => {
    it("renders hidden SVG container for gradient definitions", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Hidden SVG has width and height of 0
      const hiddenSvg = container.querySelector('svg[width="0"][height="0"]');
      expect(hiddenSvg).toBeInTheDocument();
    });

    it("gradient SVG is positioned absolutely", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const hiddenSvg = container.querySelector("svg.absolute");
      expect(hiddenSvg).toBeInTheDocument();
    });
  });

  describe("Edge Cases - Theoretical", () => {
    // These test cases document expected behavior for edge cases
    // that would occur with dynamic data

    it("displays percentage values as integers", () => {
      render(<ClaudeMaxLimitsCard />);
      // Current values: 1%, 62%, 0% - all integers
      expect(screen.getByText("1%")).toBeInTheDocument();
      expect(screen.getByText("62%")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("maintains visual hierarchy with varying percentages", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Visual check: circles should be visible even at 0%
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');
      expect(progressCircles.length).toBe(3);
    });
  });

  describe("Limit Types", () => {
    it("renders all three limits with correct labels and percentages", () => {
      render(<ClaudeMaxLimitsCard />);
      // Verify all limits are displayed with their labels and percentages
      expect(screen.getByText("Session")).toBeInTheDocument();
      expect(screen.getByText("1%")).toBeInTheDocument();

      expect(screen.getByText("Weekly")).toBeInTheDocument();
      expect(screen.getByText("62%")).toBeInTheDocument();

      expect(screen.getByText("Sonnet")).toBeInTheDocument();
      expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("renders limits in correct order (Session, Weekly, Sonnet)", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Check that Session appears before Weekly and Weekly before Sonnet in DOM order
      const text = container.textContent || "";
      const sessionIndex = text.indexOf("Session");
      const weeklyIndex = text.indexOf("Weekly");
      const sonnetIndex = text.indexOf("Sonnet");

      expect(sessionIndex).toBeLessThan(weeklyIndex);
      expect(weeklyIndex).toBeLessThan(sonnetIndex);
    });
  });

  describe("Circle Fill Property", () => {
    it("progress circles in SVG viewBox have fill set to none", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      // Get circles from the circular progress indicators (viewBox 0 0 100 100)
      const progressSvgs = container.querySelectorAll('svg[viewBox="0 0 100 100"]');
      progressSvgs.forEach((svg) => {
        const circles = svg.querySelectorAll("circle");
        circles.forEach((circle) => {
          expect(circle).toHaveAttribute("fill", "none");
        });
      });
    });
  });

  describe("Stroke Properties", () => {
    it("progress circles have rounded line caps", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const progressCircles = container.querySelectorAll('circle[stroke-linecap="round"]');
      expect(progressCircles.length).toBe(3);
    });

    it("background circles use currentColor for stroke", () => {
      const { container } = render(<ClaudeMaxLimitsCard />);
      const backgroundCircles = container.querySelectorAll("circle.text-muted");
      backgroundCircles.forEach((circle) => {
        expect(circle).toHaveAttribute("stroke", "currentColor");
      });
    });
  });
});

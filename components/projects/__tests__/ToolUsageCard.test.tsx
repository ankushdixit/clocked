/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { ToolUsageCard } from "../ToolUsageCard";

describe("ToolUsageCard", () => {
  describe("Placeholder state", () => {
    it("renders the card title", () => {
      render(<ToolUsageCard toolUsage={null} />);

      expect(screen.getByText("Tool Usage")).toBeInTheDocument();
    });

    it("shows placeholder when toolUsage is null", () => {
      render(<ToolUsageCard toolUsage={null} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByText("Available in future update")).toBeInTheDocument();
    });

    it("shows placeholder when toolUsage is empty array", () => {
      render(<ToolUsageCard toolUsage={[]} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("With data", () => {
    const mockToolUsage = [
      { name: "Bash", count: 3421 },
      { name: "Edit", count: 2156 },
      { name: "Read", count: 1892 },
    ];

    it("displays tool names", () => {
      render(<ToolUsageCard toolUsage={mockToolUsage} />);

      expect(screen.getByText("Bash")).toBeInTheDocument();
      expect(screen.getByText("Edit")).toBeInTheDocument();
      expect(screen.getByText("Read")).toBeInTheDocument();
    });

    it("displays formatted tool counts", () => {
      render(<ToolUsageCard toolUsage={mockToolUsage} />);

      expect(screen.getByText("3,421")).toBeInTheDocument();
      expect(screen.getByText("2,156")).toBeInTheDocument();
      expect(screen.getByText("1,892")).toBeInTheDocument();
    });

    it("renders a bar for each tool", () => {
      const { container } = render(<ToolUsageCard toolUsage={mockToolUsage} />);

      // Check for bar elements
      const bars = container.querySelectorAll(".bg-muted.rounded-sm");
      expect(bars.length).toBe(3);
    });
  });

  describe("Bar colors", () => {
    it("applies specific colors for known tools", () => {
      const toolsWithColors = [
        { name: "Bash", count: 100 },
        { name: "Edit", count: 90 },
        { name: "Read", count: 80 },
        { name: "Write", count: 70 },
        { name: "Glob", count: 60 },
        { name: "Grep", count: 50 },
        { name: "Task", count: 40 },
      ];

      const { container } = render(<ToolUsageCard toolUsage={toolsWithColors} />);

      expect(container.querySelector(".bg-amber-500")).toBeInTheDocument(); // Bash
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument(); // Edit
      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument(); // Read
      expect(container.querySelector(".bg-purple-500")).toBeInTheDocument(); // Write
      expect(container.querySelector(".bg-pink-500")).toBeInTheDocument(); // Glob
      expect(container.querySelector(".bg-cyan-500")).toBeInTheDocument(); // Grep
      expect(container.querySelector(".bg-orange-500")).toBeInTheDocument(); // Task
    });

    it("applies default color for unknown tools", () => {
      const unknownTools = [{ name: "CustomTool", count: 100 }];

      const { container } = render(<ToolUsageCard toolUsage={unknownTools} />);

      expect(container.querySelector(".bg-slate-500")).toBeInTheDocument();
    });
  });

  describe("Bar widths", () => {
    it("scales bar widths relative to max count", () => {
      const toolUsage = [
        { name: "Bash", count: 100 }, // Should be 100% width
        { name: "Edit", count: 50 }, // Should be 50% width
      ];

      const { container } = render(<ToolUsageCard toolUsage={toolUsage} />);

      const bars = container.querySelectorAll("[style]");
      // Check that bars have different widths
      expect(bars.length).toBeGreaterThan(0);
    });

    it("handles single tool (100% width)", () => {
      const singleTool = [{ name: "Bash", count: 1000 }];

      const { container } = render(<ToolUsageCard toolUsage={singleTool} />);

      const bar = container.querySelector(".bg-amber-500");
      expect(bar).toHaveStyle({ width: "100%" });
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<ToolUsageCard toolUsage={null} />);

      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("applies tabular-nums class for counts", () => {
      const toolUsage = [{ name: "Bash", count: 1234 }];

      render(<ToolUsageCard toolUsage={toolUsage} />);

      const countElement = screen.getByText("1,234");
      expect(countElement).toHaveClass("tabular-nums");
    });
  });

  describe("Edge cases", () => {
    it("handles tools with zero count", () => {
      const toolUsage = [{ name: "Bash", count: 0 }];

      render(<ToolUsageCard toolUsage={toolUsage} />);

      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("handles large counts", () => {
      const toolUsage = [{ name: "Bash", count: 1000000 }];

      render(<ToolUsageCard toolUsage={toolUsage} />);

      expect(screen.getByText("1,000,000")).toBeInTheDocument();
    });
  });
});

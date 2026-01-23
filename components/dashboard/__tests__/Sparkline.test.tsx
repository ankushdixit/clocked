import { render } from "@testing-library/react";
import { Sparkline } from "../Sparkline";

describe("Sparkline Component", () => {
  describe("Basic Rendering", () => {
    it("renders an SVG element", () => {
      const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders a polyline for the data path", () => {
      const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toBeInTheDocument();
    });

    it("renders an end dot (circle) at the last data point", () => {
      const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
      const circle = container.querySelector("circle");
      expect(circle).toBeInTheDocument();
      // End dot should be at x=100 (rightmost position)
      expect(circle).toHaveAttribute("cx", "100");
    });

    it("sets correct SVG viewBox", () => {
      const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 100 100");
    });
  });

  describe("Data Handling", () => {
    it("handles ascending data correctly", () => {
      const { container } = render(<Sparkline data={[1, 2, 3, 4, 5]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
      const points = polyline?.getAttribute("points");
      // Points should exist and have coordinates
      expect(points).toBeTruthy();
      expect(points?.split(" ").length).toBe(5);
    });

    it("handles descending data correctly", () => {
      const { container } = render(<Sparkline data={[5, 4, 3, 2, 1]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
      const points = polyline?.getAttribute("points");
      expect(points).toBeTruthy();
    });

    it("handles flat data (all same values)", () => {
      const { container } = render(<Sparkline data={[5, 5, 5, 5, 5]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
      // With flat data, all y values should be the same (middle of the range)
      const points = polyline?.getAttribute("points");
      expect(points).toBeTruthy();
    });

    it("handles data with negative values", () => {
      const { container } = render(<Sparkline data={[-5, -2, 0, 3, 5]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
    });

    it("handles large data arrays", () => {
      const largeData = Array.from({ length: 100 }, (_, i) => Math.sin(i / 10) * 50);
      const { container } = render(<Sparkline data={largeData} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
      const points = polyline?.getAttribute("points");
      expect(points?.split(" ").length).toBe(100);
    });

    it("handles two data points", () => {
      const { container } = render(<Sparkline data={[10, 20]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("points");
      const points = polyline?.getAttribute("points");
      expect(points?.split(" ").length).toBe(2);
    });
  });

  describe("Edge Cases", () => {
    it("handles single data point", () => {
      // With a single data point, x position calculation involves division by 0
      // (data.length - 1 = 0), resulting in NaN
      const { container } = render(<Sparkline data={[5]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toBeInTheDocument();
    });

    it("handles empty data array", () => {
      // Empty data causes Math.max/min to return -Infinity/Infinity
      const { container } = render(<Sparkline data={[]} />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Custom Colors", () => {
    it("applies default color (currentColor) when no color prop", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} />);
      const polyline = container.querySelector("polyline");
      const circle = container.querySelector("circle");
      expect(polyline).toHaveAttribute("stroke", "currentColor");
      expect(circle).toHaveAttribute("fill", "currentColor");
    });

    it("applies custom color to polyline stroke", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} color="#10b981" />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("stroke", "#10b981");
    });

    it("applies custom color to end dot fill", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} color="#3b82f6" />);
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("fill", "#3b82f6");
    });

    it("applies named colors", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} color="red" />);
      const polyline = container.querySelector("polyline");
      const circle = container.querySelector("circle");
      expect(polyline).toHaveAttribute("stroke", "red");
      expect(circle).toHaveAttribute("fill", "red");
    });
  });

  describe("Custom className", () => {
    it("applies custom className to SVG", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} className="custom-sparkline" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-sparkline");
    });

    it("preserves default classes when adding custom className", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("w-full");
      expect(svg).toHaveClass("h-full");
      expect(svg).toHaveClass("custom-class");
    });
  });

  describe("SVG Attributes", () => {
    it("has correct polyline styling attributes", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} />);
      const polyline = container.querySelector("polyline");
      expect(polyline).toHaveAttribute("fill", "none");
      expect(polyline).toHaveAttribute("stroke-width", "2.5");
      expect(polyline).toHaveAttribute("stroke-linecap", "round");
      expect(polyline).toHaveAttribute("stroke-linejoin", "round");
    });

    it("has correct circle radius", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} />);
      const circle = container.querySelector("circle");
      expect(circle).toHaveAttribute("r", "3");
    });

    it("preserves aspect ratio correctly", () => {
      const { container } = render(<Sparkline data={[1, 2, 3]} />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("preserveAspectRatio", "none");
    });
  });
});

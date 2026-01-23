import { render, screen } from "@testing-library/react";
import { HeroMetricsRow } from "../HeroMetricsRow";

// Mock the mockData module to have predictable values
jest.mock("@/lib/mockData", () => ({
  mockSummary: {
    dailyActivity: [
      { date: "2026-01-01", sessionCount: 10, totalTime: 36000000 },
      { date: "2026-01-02", sessionCount: 15, totalTime: 54000000 },
      { date: "2026-01-03", sessionCount: 12, totalTime: 43200000 },
    ],
  },
  generateCostTrend: () => [
    { date: "2026-01-01", cost: 100, cumulative: 100 },
    { date: "2026-01-02", cost: 120, cumulative: 220 },
    { date: "2026-01-03", cost: 110, cumulative: 330 },
  ],
}));

describe("HeroMetricsRow Component", () => {
  describe("Rendering All Cards", () => {
    it("renders all 4 metric cards", () => {
      const { container } = render(<HeroMetricsRow />);
      // Each card has rounded-xl class
      const cards = container.querySelectorAll(".rounded-xl.bg-muted\\/50");
      expect(cards.length).toBe(4);
    });

    it("renders in a responsive grid layout", () => {
      const { container } = render(<HeroMetricsRow />);
      const grid = container.firstChild;
      expect(grid).toHaveClass("grid");
      expect(grid).toHaveClass("grid-cols-1");
      expect(grid).toHaveClass("md:grid-cols-2");
      expect(grid).toHaveClass("lg:grid-cols-4");
    });
  });

  describe("Sessions Card", () => {
    it("renders Sessions title", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("Sessions")).toBeInTheDocument();
    });

    it("renders Sessions value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("349")).toBeInTheDocument();
    });

    it("renders Sessions subtitle", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("this month")).toBeInTheDocument();
    });

    it("renders Sessions trend value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("+12% vs last week")).toBeInTheDocument();
    });

    it("has Activity icon", () => {
      const { container } = render(<HeroMetricsRow />);
      // First card should have an icon
      const iconContainers = container.querySelectorAll(".w-9.h-9");
      expect(iconContainers.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("Session Time Card", () => {
    it("renders Session Time title", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("Session Time")).toBeInTheDocument();
    });

    it("renders Session Time value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("844h 18m")).toBeInTheDocument();
    });

    it("renders Session Time subtitle", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("total duration")).toBeInTheDocument();
    });

    it("renders Session Time trend value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("+8% vs last week")).toBeInTheDocument();
    });
  });

  describe("API Cost Card", () => {
    it("renders API Cost title", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("API Cost")).toBeInTheDocument();
    });

    it("renders API Cost value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("$2,532.92")).toBeInTheDocument();
    });

    it("renders API Cost subtitle", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("estimated")).toBeInTheDocument();
    });

    it("renders API Cost trend value (neutral)", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("$110/day avg")).toBeInTheDocument();
    });
  });

  describe("Value Card", () => {
    it("renders Value title", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("Value")).toBeInTheDocument();
    });

    it("renders Value multiplier", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("25.33x")).toBeInTheDocument();
    });

    it("renders Value subtitle", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("multiplier")).toBeInTheDocument();
    });

    it("renders Value trend value", () => {
      render(<HeroMetricsRow />);
      expect(screen.getByText("+14% vs last month")).toBeInTheDocument();
    });

    it("has highlight applied (emerald color on value)", () => {
      render(<HeroMetricsRow />);
      const valueElement = screen.getByText("25.33x");
      expect(valueElement).toHaveClass("text-emerald-500");
    });
  });

  describe("Sparklines", () => {
    it("renders sparklines for all cards", () => {
      const { container } = render(<HeroMetricsRow />);
      // Each card has a sparkline container (hidden below xl breakpoint)
      const sparklineContainers = container.querySelectorAll(".hidden.xl\\:block");
      expect(sparklineContainers.length).toBe(4);
    });

    it("each sparkline contains an SVG", () => {
      const { container } = render(<HeroMetricsRow />);
      const sparklineContainers = container.querySelectorAll(".hidden.xl\\:block");
      sparklineContainers.forEach((sparklineContainer) => {
        const svg = sparklineContainer.querySelector("svg");
        expect(svg).toBeInTheDocument();
      });
    });

    it("sparklines have correct colors", () => {
      const { container } = render(<HeroMetricsRow />);
      const polylines = container.querySelectorAll(".hidden.xl\\:block polyline");
      const colors = Array.from(polylines).map((p) => p.getAttribute("stroke"));

      // Sessions: emerald, Session Time: blue, API Cost: amber, Value: emerald
      expect(colors).toContain("#10b981"); // emerald
      expect(colors).toContain("#3b82f6"); // blue
      expect(colors).toContain("#f59e0b"); // amber
    });
  });

  describe("Trend Icons", () => {
    it("renders up trend icons for cards with positive trends", () => {
      const { container } = render(<HeroMetricsRow />);
      // Cards with 'up' trend should have emerald colored trend badges
      const upTrendBadges = container.querySelectorAll(".text-emerald-600");
      // Sessions, Session Time, and Value have up trends
      expect(upTrendBadges.length).toBe(3);
    });

    it("renders neutral trend for API Cost card", () => {
      const { container } = render(<HeroMetricsRow />);
      // API Cost has neutral trend - find the outer badge span
      const neutralBadge = container.querySelector(".text-muted-foreground.bg-muted");
      expect(neutralBadge).toBeInTheDocument();
      // The text should be present in the badge
      expect(screen.getByText("$110/day avg")).toBeInTheDocument();
    });
  });

  describe("Layout and Spacing", () => {
    it("has gap between cards", () => {
      const { container } = render(<HeroMetricsRow />);
      const grid = container.firstChild;
      expect(grid).toHaveClass("gap-4");
    });
  });
});

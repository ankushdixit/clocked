import { render, screen } from "@testing-library/react";
import { HeroMetricCard } from "../HeroMetricCard";
import { Activity, Clock, DollarSign, TrendingUp } from "lucide-react";

describe("HeroMetricCard Component", () => {
  const defaultProps = {
    icon: Activity,
    title: "Sessions",
    value: "349",
    subtitle: "this month",
    trend: "up" as const,
    trendValue: "+12% vs last week",
    sparklineData: [1, 2, 3, 4, 5],
    sparklineColor: "#10b981",
  };

  describe("Basic Rendering", () => {
    it("renders the title", () => {
      render(<HeroMetricCard {...defaultProps} />);
      expect(screen.getByText("Sessions")).toBeInTheDocument();
    });

    it("renders the value", () => {
      render(<HeroMetricCard {...defaultProps} />);
      expect(screen.getByText("349")).toBeInTheDocument();
    });

    it("renders the subtitle", () => {
      render(<HeroMetricCard {...defaultProps} />);
      expect(screen.getByText("this month")).toBeInTheDocument();
    });

    it("renders the trend value text", () => {
      render(<HeroMetricCard {...defaultProps} />);
      // Trend value now appears in two spans (one for xl+, one for below xl)
      const trendTexts = screen.getAllByText("+12% vs last week");
      expect(trendTexts.length).toBeGreaterThanOrEqual(1);
    });

    it("renders the icon", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      // Lucide icons render as SVGs with specific classes
      const iconContainer = container.querySelector(".w-9.h-9");
      expect(iconContainer).toBeInTheDocument();
      const svg = iconContainer?.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Different Icons", () => {
    it("renders with Clock icon", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} icon={Clock} title="Session Time" />
      );
      expect(screen.getByText("Session Time")).toBeInTheDocument();
      const svg = container.querySelector(".w-9.h-9 svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders with DollarSign icon", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} icon={DollarSign} title="API Cost" />
      );
      expect(screen.getByText("API Cost")).toBeInTheDocument();
      const svg = container.querySelector(".w-9.h-9 svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders with TrendingUp icon", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} icon={TrendingUp} title="Value" />
      );
      expect(screen.getByText("Value")).toBeInTheDocument();
      const svg = container.querySelector(".w-9.h-9 svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Trend States", () => {
    it("shows up trend with emerald styling", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} trend="up" trendValue="+12% vs last week" />
      );
      const trendBadge = container.querySelector(".text-emerald-600");
      expect(trendBadge).toBeInTheDocument();
      // Should contain a TrendingUp icon (check for SVG in trend badge)
      expect(trendBadge?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows down trend with red styling", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} trend="down" trendValue="-5% vs last week" />
      );
      const trendBadge = container.querySelector(".text-red-600");
      expect(trendBadge).toBeInTheDocument();
      // Trend text appears in two spans (responsive)
      const trendTexts = screen.getAllByText("-5% vs last week");
      expect(trendTexts.length).toBeGreaterThanOrEqual(1);
      // Should contain a TrendingDown icon
      expect(trendBadge?.querySelector("svg")).toBeInTheDocument();
    });

    it("shows neutral trend with muted styling", () => {
      const { container } = render(
        <HeroMetricCard {...defaultProps} trend="neutral" trendValue="$110/day avg" />
      );
      const trendBadge = container.querySelector(".text-muted-foreground.bg-muted");
      expect(trendBadge).toBeInTheDocument();
      // Trend text appears in two spans (responsive)
      const trendTexts = screen.getAllByText("$110/day avg");
      expect(trendTexts.length).toBeGreaterThanOrEqual(1);
      // Neutral trend should not have a trend icon inside the badge
      const svgs = trendBadge?.querySelectorAll("svg");
      expect(svgs?.length).toBe(0);
    });
  });

  describe("Highlight Prop", () => {
    it("applies emerald text color when highlight is true", () => {
      render(<HeroMetricCard {...defaultProps} highlight={true} />);
      const valueElement = screen.getByText("349");
      expect(valueElement).toHaveClass("text-emerald-500");
    });

    it("does not apply emerald color when highlight is false", () => {
      render(<HeroMetricCard {...defaultProps} highlight={false} />);
      const valueElement = screen.getByText("349");
      expect(valueElement).not.toHaveClass("text-emerald-500");
    });

    it("does not apply emerald color when highlight is undefined", () => {
      render(<HeroMetricCard {...defaultProps} />);
      const valueElement = screen.getByText("349");
      expect(valueElement).not.toHaveClass("text-emerald-500");
    });
  });

  describe("Sparkline Integration", () => {
    it("renders sparkline container", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      // Sparkline is in a hidden xl:block container (hidden below xl breakpoint)
      const sparklineContainer = container.querySelector(".hidden.xl\\:block");
      expect(sparklineContainer).toBeInTheDocument();
    });

    it("passes sparklineData to Sparkline component", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      // Sparkline renders an SVG inside the container
      const sparklineContainer = container.querySelector(".hidden.xl\\:block");
      const sparklineSvg = sparklineContainer?.querySelector("svg");
      expect(sparklineSvg).toBeInTheDocument();
    });

    it("passes sparklineColor to Sparkline component", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} sparklineColor="#3b82f6" />);
      const sparklineContainer = container.querySelector(".hidden.xl\\:block");
      const polyline = sparklineContainer?.querySelector("polyline");
      expect(polyline).toHaveAttribute("stroke", "#3b82f6");
    });
  });

  describe("Card Structure", () => {
    it("has correct card styling", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      const card = container.firstChild;
      expect(card).toHaveClass("rounded-xl");
      expect(card).toHaveClass("bg-muted/50");
      expect(card).toHaveClass("p-5");
      expect(card).toHaveClass("overflow-hidden");
    });

    it("has minimum height", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      const card = container.firstChild;
      expect(card).toHaveClass("min-h-[140px]");
    });

    it("title has correct styling (uppercase, tracking)", () => {
      render(<HeroMetricCard {...defaultProps} />);
      const title = screen.getByText("Sessions");
      expect(title).toHaveClass("uppercase");
      expect(title).toHaveClass("tracking-wide");
    });

    it("value has bold styling", () => {
      render(<HeroMetricCard {...defaultProps} />);
      const value = screen.getByText("349");
      expect(value).toHaveClass("text-3xl");
      expect(value).toHaveClass("font-bold");
    });
  });

  describe("Responsive Behavior", () => {
    it("trend badge is hidden on mobile (has md:flex)", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      const trendContainer = container.querySelector(".hidden.md\\:flex");
      expect(trendContainer).toBeInTheDocument();
    });

    it("sparkline is hidden below xl breakpoint (has xl:block)", () => {
      const { container } = render(<HeroMetricCard {...defaultProps} />);
      const sparklineContainer = container.querySelector(".hidden.xl\\:block");
      expect(sparklineContainer).toBeInTheDocument();
    });

    it("shows short trend text on smaller screens", () => {
      render(<HeroMetricCard {...defaultProps} trendValueShort="+12% vs LW" />);
      // Short version is shown in xl:hidden span
      expect(screen.getByText("+12% vs LW")).toBeInTheDocument();
      // Full version is shown in hidden xl:inline span
      expect(screen.getByText("+12% vs last week")).toBeInTheDocument();
    });
  });

  describe("Various Content", () => {
    it("renders currency values correctly", () => {
      render(
        <HeroMetricCard
          {...defaultProps}
          icon={DollarSign}
          title="API Cost"
          value="$2,532.92"
          subtitle="estimated"
        />
      );
      expect(screen.getByText("$2,532.92")).toBeInTheDocument();
      expect(screen.getByText("estimated")).toBeInTheDocument();
    });

    it("renders time values correctly", () => {
      render(
        <HeroMetricCard
          {...defaultProps}
          icon={Clock}
          title="Session Time"
          value="844h 18m"
          subtitle="total duration"
        />
      );
      expect(screen.getByText("844h 18m")).toBeInTheDocument();
      expect(screen.getByText("total duration")).toBeInTheDocument();
    });

    it("renders multiplier values correctly", () => {
      render(
        <HeroMetricCard
          {...defaultProps}
          icon={TrendingUp}
          title="Value"
          value="25.33x"
          subtitle="multiplier"
          highlight={true}
        />
      );
      expect(screen.getByText("25.33x")).toBeInTheDocument();
      expect(screen.getByText("multiplier")).toBeInTheDocument();
    });
  });
});

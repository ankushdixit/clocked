import { render, screen } from "@testing-library/react";
import { HumanAIRatioCard } from "../HumanAIRatioCard";

describe("HumanAIRatioCard Component", () => {
  it("renders the card title 'Human : AI Ratio'", () => {
    render(<HumanAIRatioCard />);
    expect(screen.getByText("Human : AI Ratio")).toBeInTheDocument();
  });

  it("renders legend showing Human percentage", () => {
    render(<HumanAIRatioCard />);
    // The component shows "Human 30%" in both header (sm+) and mobile legend
    const humanLabels = screen.getAllByText(/Human \d+%/);
    expect(humanLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders legend showing AI percentage", () => {
    render(<HumanAIRatioCard />);
    // The component shows "AI 70%" in both header (sm+) and mobile legend
    const aiLabels = screen.getAllByText(/AI \d+%/);
    expect(aiLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders colored legend indicators for Human and AI", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Human has emerald color, AI has indigo color
    const humanIndicator = container.querySelector(".bg-emerald-500");
    const aiIndicator = container.querySelector(".bg-indigo-500");
    expect(humanIndicator).toBeInTheDocument();
    expect(aiIndicator).toBeInTheDocument();
  });

  it("renders the SVG area chart", () => {
    const { container } = render(<HumanAIRatioCard />);
    // The chart SVG has responsive heights (h-40 sm:h-52 lg:h-64)
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    expect(chartSvg).toBeInTheDocument();
    expect(chartSvg).toHaveAttribute("preserveAspectRatio", "none");
  });

  it("renders stacked areas for Human and AI", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Find the chart SVG by viewBox
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    // Should have 2 path elements for the two areas
    const paths = chartSvg?.querySelectorAll("path");
    expect(paths?.length).toBe(2);
  });

  it("renders dividing line between areas", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Find the chart SVG by viewBox
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    // The polyline is the dividing line
    const polyline = chartSvg?.querySelector("polyline");
    expect(polyline).toBeInTheDocument();
    expect(polyline).toHaveAttribute("stroke", "white");
  });

  it("renders grid line at 50%", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Find the chart SVG by viewBox
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const gridLine = chartSvg?.querySelector("line");
    expect(gridLine).toBeInTheDocument();
    expect(gridLine).toHaveAttribute("y1", "50");
    expect(gridLine).toHaveAttribute("y2", "50");
  });

  it("renders X-axis date labels", () => {
    render(<HumanAIRatioCard />);
    // The component shows dates from ratioTrend: Jan 1, Jan 7 (middle), Jan 14
    // Middle date is index 7 which is "Jan 8" (Math.floor(14/2) = 7)
    expect(screen.getByText("Jan 1")).toBeInTheDocument();
    expect(screen.getByText("Jan 8")).toBeInTheDocument();
    expect(screen.getByText("Jan 14")).toBeInTheDocument();
  });

  it("renders left Y-axis percentage labels", () => {
    render(<HumanAIRatioCard />);
    // Left Y-axis shows 100%, 50%, 0%
    const percentLabels = screen.getAllByText("100%");
    expect(percentLabels.length).toBeGreaterThanOrEqual(1);
    const fiftyLabels = screen.getAllByText("50%");
    expect(fiftyLabels.length).toBeGreaterThanOrEqual(1);
    const zeroLabels = screen.getAllByText("0%");
    expect(zeroLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders right Y-axis percentage labels", () => {
    render(<HumanAIRatioCard />);
    // Right Y-axis also shows 100%, 50%, 0% (duplicated on both sides)
    // So we should have at least 2 of each
    const percentLabels = screen.getAllByText("100%");
    expect(percentLabels.length).toBe(2);
    const fiftyLabels = screen.getAllByText("50%");
    expect(fiftyLabels.length).toBe(2);
    const zeroLabels = screen.getAllByText("0%");
    expect(zeroLabels.length).toBe(2);
  });

  it("renders Users icon in header", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Lucide icons render as SVG elements with specific classes
    const headerIcons = container.querySelectorAll("svg.w-4.h-4");
    expect(headerIcons.length).toBeGreaterThanOrEqual(1);
  });

  it("areas have correct fill colors", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Find the chart SVG by viewBox
    const chartSvg = container.querySelector('svg[viewBox="0 0 100 100"]');
    const paths = chartSvg?.querySelectorAll("path");

    // AI area (indigo) - first path
    expect(paths?.[0]).toHaveAttribute("fill", "rgba(99, 102, 241, 0.5)");
    // Human area (emerald/green) - second path
    expect(paths?.[1]).toHaveAttribute("fill", "rgba(16, 185, 129, 0.5)");
  });

  it("shows current ratio values in legend", () => {
    render(<HumanAIRatioCard />);
    // Based on the mock data, the last entry is { human: 30, ai: 70 }
    // Now shown in both header (sm+) and mobile legend, use getAllByText
    const humanLabels = screen.getAllByText("Human 30%");
    const aiLabels = screen.getAllByText("AI 70%");
    expect(humanLabels.length).toBeGreaterThanOrEqual(1);
    expect(aiLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("renders Y-axis containers on both sides", () => {
    const { container } = render(<HumanAIRatioCard />);
    // Left Y-axis has text-right and sm:flex, right Y-axis has text-left and sm:flex
    // Y-axis containers are hidden on mobile (hidden sm:flex)
    const leftYAxis = container.querySelector(".hidden.sm\\:flex.text-right");
    const rightYAxis = container.querySelector(".hidden.sm\\:flex.text-left");
    expect(leftYAxis).toBeInTheDocument();
    expect(rightYAxis).toBeInTheDocument();
  });
});

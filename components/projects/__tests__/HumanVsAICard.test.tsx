/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { HumanVsAICard } from "../HumanVsAICard";

describe("HumanVsAICard", () => {
  describe("Placeholder state", () => {
    it("renders the card title", () => {
      render(<HumanVsAICard humanTime={null} claudeTime={null} />);

      expect(screen.getByText("Human vs AI Time")).toBeInTheDocument();
    });

    it("shows placeholder when humanTime is null", () => {
      render(<HumanVsAICard humanTime={null} claudeTime={null} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByText("Available in future update")).toBeInTheDocument();
    });

    it("shows placeholder when claudeTime is null", () => {
      render(<HumanVsAICard humanTime={3600000} claudeTime={null} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("With data", () => {
    it("displays percentages correctly", () => {
      // 2 hours human, 1 hour AI = 67% human, 33% AI
      render(<HumanVsAICard humanTime={7200000} claudeTime={3600000} />);

      expect(screen.getByText("67%")).toBeInTheDocument();
      expect(screen.getByText("33%")).toBeInTheDocument();
    });

    it("displays formatted duration times", () => {
      render(<HumanVsAICard humanTime={5400000} claudeTime={1800000} />); // 1h 30m and 30m

      expect(screen.getByText("1h 30m")).toBeInTheDocument();
      expect(screen.getByText("30m")).toBeInTheDocument();
    });

    it("displays Human and AI labels", () => {
      render(<HumanVsAICard humanTime={3600000} claudeTime={3600000} />);

      expect(screen.getByText("Human")).toBeInTheDocument();
      expect(screen.getByText("AI")).toBeInTheDocument();
    });

    it("handles 50/50 split correctly", () => {
      render(<HumanVsAICard humanTime={3600000} claudeTime={3600000} />);

      // Check that Human and AI labels are present with their percentages
      const humanLabel = screen.getByText("Human");
      const aiLabel = screen.getByText("AI");
      expect(humanLabel).toBeInTheDocument();
      expect(aiLabel).toBeInTheDocument();
      // Percentage elements are siblings to the labels
      expect(humanLabel.parentElement?.textContent).toContain("50");
      expect(aiLabel.parentElement?.textContent).toContain("50");
    });

    it("handles zero total time", () => {
      render(<HumanVsAICard humanTime={0} claudeTime={0} />);

      // When total is 0, humanPercent=0, aiPercent=100 (100 - 0)
      const humanLabel = screen.getByText("Human");
      const aiLabel = screen.getByText("AI");
      expect(humanLabel.parentElement?.textContent).toContain("0");
      expect(aiLabel.parentElement?.textContent).toContain("100");
    });
  });

  describe("Progress bar", () => {
    it("renders progress bar segments when data is available", () => {
      const { container } = render(<HumanVsAICard humanTime={7200000} claudeTime={3600000} />);

      const progressBar = container.querySelector(".rounded-full.bg-muted");
      expect(progressBar).toBeInTheDocument();

      // Check for both color segments
      expect(container.querySelector(".bg-blue-500")).toBeInTheDocument();
      expect(container.querySelector(".bg-emerald-500")).toBeInTheDocument();
    });
  });

  describe("Legend", () => {
    it("renders color indicators for Human and AI", () => {
      const { container } = render(<HumanVsAICard humanTime={3600000} claudeTime={3600000} />);

      // Check for color dots in legend
      const blueDot = container.querySelector(".rounded-full.bg-blue-500");
      const greenDot = container.querySelector(".rounded-full.bg-emerald-500");

      expect(blueDot).toBeInTheDocument();
      expect(greenDot).toBeInTheDocument();
    });
  });
});

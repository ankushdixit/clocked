/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { CostAnalysisCard } from "../CostAnalysisCard";

describe("CostAnalysisCard", () => {
  const defaultProps = {
    inputCost: null,
    outputCost: null,
    cacheWriteCost: null,
    cacheReadCost: null,
    cacheSavings: null,
  };

  describe("Placeholder state", () => {
    it("renders the card title", () => {
      render(<CostAnalysisCard {...defaultProps} />);

      expect(screen.getByText("Cost Analysis")).toBeInTheDocument();
    });

    it("shows placeholder when all costs are null", () => {
      render(<CostAnalysisCard {...defaultProps} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByText("Available in future update")).toBeInTheDocument();
    });

    it("shows placeholder when any cost is null", () => {
      render(<CostAnalysisCard {...defaultProps} inputCost={10.5} />);

      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("With data", () => {
    const fullProps = {
      inputCost: 156.4,
      outputCost: 234.8,
      cacheWriteCost: 12.3,
      cacheReadCost: 9.0,
      cacheSavings: 89.2,
    };

    it("displays all cost labels", () => {
      render(<CostAnalysisCard {...fullProps} />);

      expect(screen.getByText("Input")).toBeInTheDocument();
      expect(screen.getByText("Output")).toBeInTheDocument();
      expect(screen.getByText("Cache Write")).toBeInTheDocument();
      expect(screen.getByText("Cache Read")).toBeInTheDocument();
      expect(screen.getByText("Total")).toBeInTheDocument();
    });

    it("formats costs with currency symbol", () => {
      render(<CostAnalysisCard {...fullProps} />);

      expect(screen.getByText("$156.40")).toBeInTheDocument();
      expect(screen.getByText("$234.80")).toBeInTheDocument();
      expect(screen.getByText("$12.30")).toBeInTheDocument();
      expect(screen.getByText("$9.00")).toBeInTheDocument();
    });

    it("calculates and displays total correctly", () => {
      render(<CostAnalysisCard {...fullProps} />);

      // Total = 156.40 + 234.80 + 12.30 + 9.00 = 412.50
      expect(screen.getByText("$412.50")).toBeInTheDocument();
    });

    it("displays cache savings when provided", () => {
      render(<CostAnalysisCard {...fullProps} />);

      expect(screen.getByText("Cache Savings")).toBeInTheDocument();
      expect(screen.getByText("$89.20")).toBeInTheDocument();
    });

    it("hides cache savings when zero", () => {
      render(<CostAnalysisCard {...fullProps} cacheSavings={0} />);

      expect(screen.queryByText("Cache Savings")).not.toBeInTheDocument();
    });

    it("hides cache savings when null", () => {
      render(<CostAnalysisCard {...fullProps} cacheSavings={null} />);

      expect(screen.queryByText("Cache Savings")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("renders with card styling", () => {
      const { container } = render(<CostAnalysisCard {...defaultProps} />);

      const card = container.firstChild;
      expect(card).toHaveClass("h-full");
      expect(card).toHaveClass("flex");
      expect(card).toHaveClass("flex-col");
    });

    it("applies font-medium class for values", () => {
      const fullProps = {
        inputCost: 10.0,
        outputCost: 20.0,
        cacheWriteCost: 5.0,
        cacheReadCost: 3.0,
        cacheSavings: null,
      };

      render(<CostAnalysisCard {...fullProps} />);

      const inputValue = screen.getByText("$10.00");
      expect(inputValue).toHaveClass("font-medium");
    });
  });

  describe("Edge cases", () => {
    it("handles zero costs", () => {
      const zeroProps = {
        inputCost: 0,
        outputCost: 0,
        cacheWriteCost: 0,
        cacheReadCost: 0,
        cacheSavings: null,
      };

      render(<CostAnalysisCard {...zeroProps} />);

      // All values should be $0.00 (input, output, cacheWrite, cacheRead, total)
      expect(screen.getAllByText("$0.00")).toHaveLength(5);
    });

    it("handles small decimal costs", () => {
      const smallProps = {
        inputCost: 0.01,
        outputCost: 0.02,
        cacheWriteCost: 0.03,
        cacheReadCost: 0.04,
        cacheSavings: null,
      };

      render(<CostAnalysisCard {...smallProps} />);

      // Total should be 0.10
      expect(screen.getByText("$0.10")).toBeInTheDocument();
    });
  });
});

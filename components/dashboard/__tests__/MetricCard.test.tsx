import { render, screen } from "@testing-library/react";
import { MetricCard } from "../MetricCard";

describe("MetricCard Component", () => {
  it("renders title", () => {
    render(<MetricCard title="Sessions" value="127" />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
  });

  it("renders value", () => {
    render(<MetricCard title="Sessions" value="127" />);
    expect(screen.getByText("127")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<MetricCard title="Sessions" value="127" subtitle="this month" />);
    expect(screen.getByText("this month")).toBeInTheDocument();
  });

  it("does not render subtitle when not provided", () => {
    render(<MetricCard title="Sessions" value="127" />);
    expect(screen.queryByText("this month")).not.toBeInTheDocument();
  });

  it("applies highlight class when highlight prop is true", () => {
    render(<MetricCard title="Value" value="8.47x" highlight />);
    const value = screen.getByText("8.47x");
    expect(value).toHaveClass("text-emerald-500");
  });

  it("does not apply highlight class when highlight prop is false", () => {
    render(<MetricCard title="Value" value="0.50x" highlight={false} />);
    const value = screen.getByText("0.50x");
    expect(value).not.toHaveClass("text-emerald-500");
  });

  it("renders title in uppercase", () => {
    render(<MetricCard title="Active Time" value="156h 42m" />);
    const title = screen.getByText("Active Time");
    expect(title).toHaveClass("uppercase");
  });

  it("renders value in bold", () => {
    render(<MetricCard title="Sessions" value="127" />);
    const value = screen.getByText("127");
    expect(value).toHaveClass("font-bold");
  });
});

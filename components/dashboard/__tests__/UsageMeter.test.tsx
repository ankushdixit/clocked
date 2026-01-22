import { render, screen } from "@testing-library/react";
import { UsageMeter } from "../UsageMeter";

describe("UsageMeter Component", () => {
  it("renders percentage", () => {
    render(<UsageMeter percentage={52} daysRemaining={15} />);
    expect(screen.getByText("52%")).toBeInTheDocument();
  });

  it("renders days remaining (plural)", () => {
    render(<UsageMeter percentage={52} daysRemaining={15} />);
    expect(screen.getByText("15 days remaining")).toBeInTheDocument();
  });

  it("renders days remaining (singular)", () => {
    render(<UsageMeter percentage={99} daysRemaining={1} />);
    expect(screen.getByText("1 day remaining")).toBeInTheDocument();
  });

  it("clamps percentage to 0 when negative", () => {
    render(<UsageMeter percentage={-10} daysRemaining={15} />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("clamps percentage to 100 when over 100", () => {
    render(<UsageMeter percentage={150} daysRemaining={15} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("applies green color for low usage", () => {
    const { container } = render(<UsageMeter percentage={50} daysRemaining={15} />);
    const progressBar = container.querySelector(".bg-emerald-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("applies yellow color for medium usage (70-90%)", () => {
    const { container } = render(<UsageMeter percentage={75} daysRemaining={15} />);
    const progressBar = container.querySelector(".bg-yellow-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("applies red color for high usage (90%+)", () => {
    const { container } = render(<UsageMeter percentage={95} daysRemaining={15} />);
    const progressBar = container.querySelector(".bg-red-500");
    expect(progressBar).toBeInTheDocument();
  });

  it("sets correct width style based on percentage", () => {
    const { container } = render(<UsageMeter percentage={75} daysRemaining={15} />);
    const progressBar = container.querySelector(".bg-yellow-500");
    expect(progressBar).toHaveStyle({ width: "75%" });
  });

  it("rounds percentage to whole number", () => {
    render(<UsageMeter percentage={52.7} daysRemaining={15} />);
    expect(screen.getByText("53%")).toBeInTheDocument();
  });
});

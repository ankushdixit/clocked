/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../empty-state";
import { Search } from "lucide-react";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="No items" description="Try a different search" />);
    expect(screen.getByText("Try a different search")).toBeInTheDocument();
  });

  it("does not render description when not provided", () => {
    render(<EmptyState title="No items" />);
    const description = screen.queryByText("Try a different search");
    expect(description).not.toBeInTheDocument();
  });

  it("renders custom icon when provided", () => {
    render(<EmptyState title="No results" icon={<Search data-testid="custom-icon" />} />);
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<EmptyState title="No items" className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("has correct structure", () => {
    render(<EmptyState title="No items found" description="Add some items to get started" />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("No items found");
  });
});

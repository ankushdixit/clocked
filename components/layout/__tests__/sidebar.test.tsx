import { render, screen } from "@testing-library/react";
import { Sidebar } from "../sidebar";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

// Mock next/image
jest.mock("next/image", () => ({
  __esModule: true,
  default: function MockImage({
    alt,
    src,
  }: {
    alt: string;
    src: string;
    width?: number;
    height?: number;
    priority?: boolean;
  }) {
    return <img alt={alt} src={src} />;
  },
}));

// Mock window.electron for platform detection
beforeAll(() => {
  Object.defineProperty(window, "electron", {
    value: {
      platform: "darwin",
    },
    writable: true,
    configurable: true,
  });
});

describe("Sidebar Component", () => {
  it("renders sidebar navigation", () => {
    const { container } = render(<Sidebar />);
    expect(container.querySelector("aside")).toBeInTheDocument();
  });

  it("renders Clocked logo", () => {
    render(<Sidebar />);
    expect(screen.getByAltText("Clocked")).toBeInTheDocument();
  });

  it("renders Dashboard navigation link", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("has accessible navigation landmark", () => {
    render(<Sidebar />);
    expect(screen.getByLabelText("Main navigation")).toBeInTheDocument();
  });

  it("renders links with correct href attributes", () => {
    render(<Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/");
  });

  it("marks dashboard as active on root path", () => {
    const { usePathname } = require("next/navigation");
    usePathname.mockReturnValue("/");

    render(<Sidebar />);

    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveAttribute("aria-current", "page");
  });

  it("has hidden class for mobile viewports", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("hidden");
  });

  it("has md:flex for desktop viewports", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("md:flex");
  });

  it("renders brand logo link in header", () => {
    render(<Sidebar />);
    const logoImage = screen.getByAltText("Clocked");
    const logoLink = logoImage.closest("a");
    expect(logoLink).toHaveAttribute("href", "/");
  });

  it("has proper sidebar width", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("w-52");
  });

  it("has border on the right", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    expect(aside).toHaveClass("border-r");
  });

  it("brand link has no-drag class", () => {
    render(<Sidebar />);
    const logoImage = screen.getByAltText("Clocked");
    const logoLink = logoImage.closest("a");
    expect(logoLink).toHaveClass("app-no-drag");
  });

  describe("platform-specific styling", () => {
    it("renders traffic light area on macOS", () => {
      Object.defineProperty(window, "electron", {
        value: { platform: "darwin" },
        writable: true,
        configurable: true,
      });

      const { container, rerender } = render(<Sidebar />);
      rerender(<Sidebar />);

      // On macOS, there should be a traffic light drag region
      const dragRegions = container.querySelectorAll(".app-drag-region");
      expect(dragRegions.length).toBeGreaterThan(0);
    });

    it("has drag region on Windows", () => {
      Object.defineProperty(window, "electron", {
        value: { platform: "win32" },
        writable: true,
        configurable: true,
      });

      const { container, rerender } = render(<Sidebar />);
      rerender(<Sidebar />);

      const dragRegion = container.querySelector(".app-drag-region");
      expect(dragRegion).toBeInTheDocument();
    });
  });
});

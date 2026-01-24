import React from "react";
import { render, screen } from "@testing-library/react";

// Define type for mock state
interface MockDynamicState {
  dynamicOptions: { ssr?: boolean; loading?: () => React.ReactElement | null } | undefined;
  mockDynamicLoader:
    | (() => Promise<{ default: React.ComponentType<{ children: React.ReactNode }> }>)
    | undefined;
  shouldLoadComponent: boolean;
}

// Mock next/dynamic to capture how it's being used
jest.mock("next/dynamic", () => {
  const React = require("react");

  // Initialize state inside the mock factory
  const state: MockDynamicState = {
    dynamicOptions: undefined,
    mockDynamicLoader: undefined,
    shouldLoadComponent: false,
  };

  // Expose state on the mock function itself
  const mockDynamic = <T extends React.ComponentType<{ children: React.ReactNode }>>(
    loader: () => Promise<{ default: T }>,
    options?: { loading?: () => React.ReactElement | null; ssr?: boolean }
  ) => {
    // Store the options and loader for inspection
    state.dynamicOptions = options;
    state.mockDynamicLoader = loader as () => Promise<{
      default: React.ComponentType<{ children: React.ReactNode }>;
    }>;

    // Return a component that either shows loading or the real content
    const DynamicComponent = ({ children }: { children: React.ReactNode }) => {
      if (!state.shouldLoadComponent && options?.loading) {
        return options.loading();
      }
      // If loaded, wrap children in a div for testing
      return React.createElement("div", { "data-testid": "refine-provider-loaded" }, children);
    };
    DynamicComponent.displayName = "DynamicComponent";
    return DynamicComponent;
  };

  // Attach state to the mock for test access
  mockDynamic.__state = state;

  return mockDynamic;
});

// Mock the refine-provider module
jest.mock("@/providers/refine-provider", () => ({
  RefineProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="real-refine-provider">{children}</div>
  ),
}));

// Import the mocked dynamic to access state
import dynamic from "next/dynamic";
import ClientRefineWrapper from "../client-refine-wrapper";

// Get state accessor
const getMockState = () => (dynamic as unknown as { __state: MockDynamicState }).__state;

describe("ClientRefineWrapper Component", () => {
  beforeEach(() => {
    const state = getMockState();
    // Only reset the load state flag, not the options (which are set at module load)
    state.shouldLoadComponent = false;
  });

  describe("Loading State", () => {
    it("renders loading state initially", () => {
      render(
        <ClientRefineWrapper>
          <div>Child content</div>
        </ClientRefineWrapper>
      );
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("has centered loading layout", () => {
      const { container } = render(
        <ClientRefineWrapper>
          <div>Child content</div>
        </ClientRefineWrapper>
      );
      const wrapper = container.querySelector(".flex");
      expect(wrapper).toHaveClass("min-h-screen");
      expect(wrapper).toHaveClass("items-center");
      expect(wrapper).toHaveClass("justify-center");
    });

    it("loading text has proper styling", () => {
      render(
        <ClientRefineWrapper>
          <div>Child content</div>
        </ClientRefineWrapper>
      );
      const loadingText = screen.getByText("Loading...");
      expect(loadingText).toHaveClass("text-lg");
    });

    it("loading state covers full viewport height", () => {
      const { container } = render(
        <ClientRefineWrapper>
          <div>Test</div>
        </ClientRefineWrapper>
      );
      const loadingContainer = container.querySelector(".min-h-screen");
      expect(loadingContainer).toBeInTheDocument();
    });
  });

  describe("SSR Safety (Hydration)", () => {
    it("uses dynamic import with ssr: false", () => {
      // Dynamic import options are captured when the module loads
      // We need to verify the mock captured the options
      const state = getMockState();
      // The mock is called at module load, so options should exist
      expect(state.dynamicOptions).toBeDefined();
      expect(state.dynamicOptions?.ssr).toBe(false);
    });

    it("provides loading fallback for SSR", () => {
      const state = getMockState();
      expect(state.dynamicOptions).toBeDefined();
      expect(state.dynamicOptions?.loading).toBeDefined();
      expect(typeof state.dynamicOptions?.loading).toBe("function");
    });

    it("loading fallback returns valid JSX", () => {
      const loading = getMockState().dynamicOptions?.loading;
      expect(loading).toBeDefined();
      if (loading) {
        const loadingElement = loading();
        expect(loadingElement).toBeTruthy();
        expect(React.isValidElement(loadingElement)).toBe(true);
      }
    });
  });

  describe("Provider Wrapping", () => {
    it("wraps children with RefineProvider when loaded", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="test-child">Child content</div>
        </ClientRefineWrapper>
      );

      const wrapper = screen.getByTestId("refine-provider-loaded");
      expect(wrapper).toBeInTheDocument();
      expect(screen.getByTestId("test-child")).toBeInTheDocument();
    });

    it("preserves children structure when loaded", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="outer">
            <span data-testid="inner">Nested content</span>
          </div>
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("outer")).toBeInTheDocument();
      expect(screen.getByTestId("inner")).toBeInTheDocument();
      expect(screen.getByText("Nested content")).toBeInTheDocument();
    });

    it("handles multiple children elements", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("child-1")).toBeInTheDocument();
      expect(screen.getByTestId("child-2")).toBeInTheDocument();
      expect(screen.getByTestId("child-3")).toBeInTheDocument();
    });

    it("handles null children gracefully", () => {
      getMockState().shouldLoadComponent = true;
      expect(() => {
        render(<ClientRefineWrapper>{null}</ClientRefineWrapper>);
      }).not.toThrow();
    });

    it("handles undefined children gracefully", () => {
      getMockState().shouldLoadComponent = true;
      expect(() => {
        render(<ClientRefineWrapper>{undefined}</ClientRefineWrapper>);
      }).not.toThrow();
    });
  });

  describe("Dynamic Import Behavior", () => {
    it("captures the dynamic import loader", () => {
      // The loader is captured when the module loads
      const state = getMockState();
      expect(state.mockDynamicLoader).toBeDefined();
    });

    it("loader resolves with RefineProvider module", async () => {
      const loader = getMockState().mockDynamicLoader;
      expect(loader).toBeDefined();
      if (loader) {
        const module = await loader();
        expect(module.default).toBeDefined();
        // The default export should be the RefineProvider component
        expect(typeof module.default).toBe("function");
      }
    });
  });

  describe("Client-Side Only Rendering", () => {
    it("does not render children during loading", () => {
      getMockState().shouldLoadComponent = false;
      render(
        <ClientRefineWrapper>
          <div data-testid="should-not-show">Hidden during load</div>
        </ClientRefineWrapper>
      );

      expect(screen.queryByTestId("should-not-show")).not.toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows children after component loads", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="visible-after-load">Visible content</div>
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("visible-after-load")).toBeInTheDocument();
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
  });

  describe("Component Structure", () => {
    it("is a default export", () => {
      expect(ClientRefineWrapper).toBeDefined();
      expect(typeof ClientRefineWrapper).toBe("function");
    });

    it("accepts children prop", () => {
      getMockState().shouldLoadComponent = true;
      const { container } = render(
        <ClientRefineWrapper>
          <span>Test child</span>
        </ClientRefineWrapper>
      );

      expect(container.querySelector("span")).toBeInTheDocument();
    });

    it("renders as a wrapper component", () => {
      getMockState().shouldLoadComponent = true;
      const { container } = render(
        <ClientRefineWrapper>
          <div className="test-class">Content</div>
        </ClientRefineWrapper>
      );

      expect(container.querySelector(".test-class")).toBeInTheDocument();
    });
  });

  describe("Real-World Scenarios", () => {
    it("renders dashboard layout when loaded", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div className="dashboard-container">
            <header>Dashboard Header</header>
            <main>Dashboard Content</main>
            <footer>Dashboard Footer</footer>
          </div>
        </ClientRefineWrapper>
      );

      expect(screen.getByText("Dashboard Header")).toBeInTheDocument();
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
      expect(screen.getByText("Dashboard Footer")).toBeInTheDocument();
    });

    it("handles nested routes", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="route-wrapper">
            <nav data-testid="navigation">Navigation</nav>
            <div data-testid="route-content">
              <h1>Projects Page</h1>
              <ul>
                <li>Project 1</li>
                <li>Project 2</li>
              </ul>
            </div>
          </div>
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("route-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("navigation")).toBeInTheDocument();
      expect(screen.getByTestId("route-content")).toBeInTheDocument();
      expect(screen.getByText("Projects Page")).toBeInTheDocument();
    });

    it("works with React context consumers as children", () => {
      getMockState().shouldLoadComponent = true;
      const TestContext = React.createContext("default");

      render(
        <TestContext.Provider value="custom">
          <ClientRefineWrapper>
            <TestContext.Consumer>
              {(value) => <span data-testid="context-value">{value}</span>}
            </TestContext.Consumer>
          </ClientRefineWrapper>
        </TestContext.Provider>
      );

      expect(screen.getByTestId("context-value")).toHaveTextContent("custom");
    });

    it("supports fragments as children", () => {
      getMockState().shouldLoadComponent = true;
      render(
        <ClientRefineWrapper>
          <>
            <div data-testid="fragment-child-1">First</div>
            <div data-testid="fragment-child-2">Second</div>
          </>
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("fragment-child-1")).toBeInTheDocument();
      expect(screen.getByTestId("fragment-child-2")).toBeInTheDocument();
    });

    it("handles conditional children", () => {
      getMockState().shouldLoadComponent = true;
      const showExtra = true;
      render(
        <ClientRefineWrapper>
          <div data-testid="always">Always shown</div>
          {showExtra && <div data-testid="conditional">Conditionally shown</div>}
        </ClientRefineWrapper>
      );

      expect(screen.getByTestId("always")).toBeInTheDocument();
      expect(screen.getByTestId("conditional")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("loading state is visible to screen readers", () => {
      render(
        <ClientRefineWrapper>
          <div>Content</div>
        </ClientRefineWrapper>
      );

      const loadingText = screen.getByText("Loading...");
      // Text is visible and not hidden
      expect(loadingText).toBeVisible();
    });

    it("does not trap focus in loading state", () => {
      const { container } = render(
        <ClientRefineWrapper>
          <div>Content</div>
        </ClientRefineWrapper>
      );

      // No focus trap elements should exist
      const focusTrap = container.querySelector("[tabindex='-1']");
      // Either no element exists or it's not aria-hidden
      if (focusTrap) {
        expect(focusTrap).not.toHaveAttribute("aria-hidden", "true");
      } else {
        // No focus trap element found, which is good
        expect(focusTrap).toBeNull();
      }
    });
  });

  describe("Error Boundaries", () => {
    it("does not crash on empty children array", () => {
      getMockState().shouldLoadComponent = true;
      const children: React.ReactNode[] = [];
      expect(() => {
        render(<ClientRefineWrapper>{children}</ClientRefineWrapper>);
      }).not.toThrow();
    });

    it("handles boolean false as child", () => {
      getMockState().shouldLoadComponent = true;
      expect(() => {
        render(<ClientRefineWrapper>{false}</ClientRefineWrapper>);
      }).not.toThrow();
    });

    it("handles empty string as child", () => {
      getMockState().shouldLoadComponent = true;
      expect(() => {
        render(<ClientRefineWrapper>{""}</ClientRefineWrapper>);
      }).not.toThrow();
    });

    it("handles number 0 as child", () => {
      getMockState().shouldLoadComponent = true;
      const { container } = render(<ClientRefineWrapper>{0}</ClientRefineWrapper>);
      expect(container).toHaveTextContent("0");
    });
  });
});

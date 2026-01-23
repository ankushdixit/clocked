/**
 * @jest-environment @stryker-mutator/jest-runner/jest-env/jsdom
 */
import { render, screen } from "@testing-library/react";
import { ProjectRowStats } from "../ProjectRowStats";
import type { Project } from "@/types/electron";
import * as timeFormatters from "@/lib/formatters/time";
import * as activityUtils from "@/lib/projects/activity";

// Mock the formatters and activity modules
jest.mock("@/lib/formatters/time", () => ({
  formatDuration: jest.fn(),
  formatLastActivity: jest.fn(),
}));

jest.mock("@/lib/projects/activity", () => ({
  generateActivityData: jest.fn(),
}));

const mockFormatDuration = timeFormatters.formatDuration as jest.MockedFunction<
  typeof timeFormatters.formatDuration
>;
const mockFormatLastActivity = timeFormatters.formatLastActivity as jest.MockedFunction<
  typeof timeFormatters.formatLastActivity
>;
const mockGenerateActivityData = activityUtils.generateActivityData as jest.MockedFunction<
  typeof activityUtils.generateActivityData
>;

const createMockProject = (overrides?: Partial<Project>): Project => ({
  path: "/Users/test/my-project",
  name: "my-project",
  firstActivity: "2024-01-01T10:00:00Z",
  lastActivity: "2024-01-15T15:30:00Z",
  sessionCount: 12,
  messageCount: 150,
  totalTime: 7200000, // 2 hours in ms
  isHidden: false,
  groupId: null,
  mergedInto: null,
  ...overrides,
});

describe("ProjectRowStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set default mock return values
    mockFormatDuration.mockReturnValue("2h 0m");
    mockFormatLastActivity.mockReturnValue("Today");
    mockGenerateActivityData.mockReturnValue([1, 2, 0, 3, 1, 4, 2]);
  });

  describe("Session count rendering", () => {
    it("renders the session count correctly", () => {
      const project = createMockProject({ sessionCount: 12 });
      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("sessions")).toBeInTheDocument();
    });

    it("renders session count of zero", () => {
      const project = createMockProject({ sessionCount: 0 });
      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("0")).toBeInTheDocument();
      expect(screen.getByText("sessions")).toBeInTheDocument();
    });

    it("renders large session counts", () => {
      const project = createMockProject({ sessionCount: 999 });
      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("999")).toBeInTheDocument();
    });
  });

  describe("Duration formatting", () => {
    it("renders formatted duration using formatDuration", () => {
      const project = createMockProject({ totalTime: 7200000 });
      mockFormatDuration.mockReturnValue("2h 0m");

      render(<ProjectRowStats project={project} />);

      expect(mockFormatDuration).toHaveBeenCalledWith(7200000);
      expect(screen.getByText("2h 0m")).toBeInTheDocument();
    });

    it("renders short duration format", () => {
      const project = createMockProject({ totalTime: 1800000 });
      mockFormatDuration.mockReturnValue("30m");

      render(<ProjectRowStats project={project} />);

      expect(mockFormatDuration).toHaveBeenCalledWith(1800000);
      expect(screen.getByText("30m")).toBeInTheDocument();
    });

    it("renders long duration format", () => {
      const project = createMockProject({ totalTime: 86400000 });
      mockFormatDuration.mockReturnValue("24h 0m");

      render(<ProjectRowStats project={project} />);

      expect(mockFormatDuration).toHaveBeenCalledWith(86400000);
      expect(screen.getByText("24h 0m")).toBeInTheDocument();
    });
  });

  describe("Last activity date rendering", () => {
    it("renders formatted last activity using formatLastActivity", () => {
      const project = createMockProject({ lastActivity: "2024-01-15T15:30:00Z" });
      mockFormatLastActivity.mockReturnValue("Today");

      render(<ProjectRowStats project={project} />);

      expect(mockFormatLastActivity).toHaveBeenCalledWith("2024-01-15T15:30:00Z");
      expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("renders 'Yesterday' for yesterday's activity", () => {
      const project = createMockProject({ lastActivity: "2024-01-14T10:00:00Z" });
      mockFormatLastActivity.mockReturnValue("Yesterday");

      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("Yesterday")).toBeInTheDocument();
    });

    it("renders relative days ago", () => {
      const project = createMockProject({ lastActivity: "2024-01-10T10:00:00Z" });
      mockFormatLastActivity.mockReturnValue("5d ago");

      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("5d ago")).toBeInTheDocument();
    });

    it("renders formatted date for older activity", () => {
      const project = createMockProject({ lastActivity: "2023-12-01T10:00:00Z" });
      mockFormatLastActivity.mockReturnValue("Dec 1");

      render(<ProjectRowStats project={project} />);

      expect(screen.getByText("Dec 1")).toBeInTheDocument();
    });
  });

  describe("Sparkline rendering", () => {
    it("renders 7 sparkline bars for 7 days", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([1, 2, 0, 3, 1, 4, 2]);

      const { container } = render(<ProjectRowStats project={project} />);

      // Find the sparkline container by its title attribute
      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      expect(sparklineContainer).toBeInTheDocument();

      // Find all bars within the sparkline
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");
      expect(bars?.length).toBe(7);
    });

    it("calls generateActivityData with the project", () => {
      const project = createMockProject();
      render(<ProjectRowStats project={project} />);

      expect(mockGenerateActivityData).toHaveBeenCalledWith(project);
    });

    it("renders sparkline bars with varying heights based on activity", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([0, 5, 2, 10, 1, 8, 3]);

      const { container } = render(<ProjectRowStats project={project} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      // Bars should have different heights - check that style heights vary
      const heights = Array.from(bars || []).map((bar) => {
        const style = (bar as HTMLElement).style;
        return style.height;
      });

      // At least some bars should have different heights
      const uniqueHeights = new Set(heights);
      expect(uniqueHeights.size).toBeGreaterThan(1);
    });

    it("handles all-zero activity data", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([0, 0, 0, 0, 0, 0, 0]);

      const { container } = render(<ProjectRowStats project={project} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      expect(bars?.length).toBe(7);
      // All bars should have minimum height (15%)
      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.height).toBe("15%");
      });
    });
  });

  describe("Sparkline color with accent color", () => {
    it("uses accent color when provided", () => {
      const project = createMockProject();
      const accentColor = "#ff5500";
      mockGenerateActivityData.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);

      const { container } = render(<ProjectRowStats project={project} accentColor={accentColor} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      // All bars should use the accent color
      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.backgroundColor).toBe("rgb(255, 85, 0)"); // #ff5500 in rgb
      });
    });

    it("uses custom green accent color", () => {
      const project = createMockProject();
      const accentColor = "#00ff00";
      mockGenerateActivityData.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);

      const { container } = render(<ProjectRowStats project={project} accentColor={accentColor} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.backgroundColor).toBe("rgb(0, 255, 0)");
      });
    });
  });

  describe("Sparkline default color when no accent color", () => {
    it("uses default blue color (#3b82f6) when no accent color provided", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);

      const { container } = render(<ProjectRowStats project={project} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      // All bars should use the default blue color
      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.backgroundColor).toBe("rgb(59, 130, 246)"); // #3b82f6 in rgb
      });
    });

    it("uses default color when accent color is null", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);

      const { container } = render(<ProjectRowStats project={project} accentColor={null} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.backgroundColor).toBe("rgb(59, 130, 246)");
      });
    });

    it("uses default color when accent color is undefined", () => {
      const project = createMockProject();
      mockGenerateActivityData.mockReturnValue([1, 2, 3, 4, 5, 6, 7]);

      const { container } = render(<ProjectRowStats project={project} accentColor={undefined} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      const bars = sparklineContainer?.querySelectorAll(".flex-1.rounded-sm");

      Array.from(bars || []).forEach((bar) => {
        const style = (bar as HTMLElement).style;
        expect(style.backgroundColor).toBe("rgb(59, 130, 246)");
      });
    });
  });

  describe("Component structure", () => {
    it("renders all stat sections in the correct layout", () => {
      const project = createMockProject({ sessionCount: 5 });
      mockFormatDuration.mockReturnValue("1h 30m");
      mockFormatLastActivity.mockReturnValue("3d ago");

      render(<ProjectRowStats project={project} />);

      // All elements should be present
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("sessions")).toBeInTheDocument();
      expect(screen.getByText("1h 30m")).toBeInTheDocument();
      expect(screen.getByText("3d ago")).toBeInTheDocument();
    });

    it("has accessible title on sparkline container", () => {
      const project = createMockProject();
      const { container } = render(<ProjectRowStats project={project} />);

      const sparklineContainer = container.querySelector('[title="Last 7 days activity"]');
      expect(sparklineContainer).toBeInTheDocument();
    });
  });
});

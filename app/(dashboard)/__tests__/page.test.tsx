import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";

// Mock window.electron
const mockElectron = {
  getAppVersion: jest.fn(),
  getHealth: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
  // New API properties added for session/project data
  projects: {
    getAll: jest.fn(),
    getByPath: jest.fn(),
    getCount: jest.fn(),
    setHidden: jest.fn(),
    setGroup: jest.fn(),
    setDefault: jest.fn(),
    getDefault: jest.fn(),
  },
  groups: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  sessions: {
    getAll: jest.fn(),
    getByProject: jest.fn(),
    getByDateRange: jest.fn(),
    getCount: jest.fn(),
  },
  data: {
    sync: jest.fn(),
    status: jest.fn(),
  },
};

describe("DashboardPage Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing electron property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron;
  });

  it("renders main heading", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Clocked")).toBeInTheDocument();
  });

  it("renders tagline", () => {
    render(<DashboardPage />);
    expect(
      screen.getByText("Time tracking for Claude Code development sessions")
    ).toBeInTheDocument();
  });

  it("renders Electron Connection card", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Electron Connection")).toBeInTheDocument();
  });

  it("renders Health Status card", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Health Status")).toBeInTheDocument();
  });

  it("shows browser mode when not in Electron", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Running in browser mode")).toBeInTheDocument();
    });
  });

  it("shows health unavailable when not in Electron", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Health check unavailable")).toBeInTheDocument();
    });
  });

  it("shows no default project when not in Electron", async () => {
    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("No Default Project")).toBeInTheDocument();
    });
  });

  describe("when in Electron", () => {
    beforeEach(() => {
      window.electron = mockElectron;
      // Default mock for getDefault - no default project
      mockElectron.projects.getDefault.mockResolvedValue({ project: null });
    });

    it("shows connected status when Electron API responds", async () => {
      mockElectron.getAppVersion.mockResolvedValue("0.1.0");
      mockElectron.getHealth.mockResolvedValue({
        status: "ok",
        timestamp: new Date().toISOString(),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Connected to Electron")).toBeInTheDocument();
      });
    });

    it("displays app version from Electron", async () => {
      mockElectron.getAppVersion.mockResolvedValue("0.1.0");
      mockElectron.getHealth.mockResolvedValue({
        status: "ok",
        timestamp: new Date().toISOString(),
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Version: 0.1.0")).toBeInTheDocument();
      });
    });

    it("displays health status from Electron", async () => {
      mockElectron.getAppVersion.mockResolvedValue("0.1.0");
      mockElectron.getHealth.mockResolvedValue({
        status: "ok",
        timestamp: "2026-01-21T12:00:00.000Z",
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Status: ok")).toBeInTheDocument();
      });
    });

    it("shows error when Electron API fails", async () => {
      mockElectron.getAppVersion.mockRejectedValue(new Error("Connection failed"));
      mockElectron.getHealth.mockRejectedValue(new Error("Connection failed"));

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("Error: Connection failed")).toBeInTheDocument();
      });
    });

    it("shows default project when one is set", async () => {
      mockElectron.getAppVersion.mockResolvedValue("0.1.0");
      mockElectron.getHealth.mockResolvedValue({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
      mockElectron.projects.getDefault.mockResolvedValue({
        project: {
          path: "/Users/test/my-project",
          name: "my-project",
          firstActivity: "2024-01-01T10:00:00Z",
          lastActivity: "2024-01-15T15:30:00Z",
          sessionCount: 5,
          messageCount: 100,
          totalTime: 3600000,
          isHidden: false,
          groupId: null,
          isDefault: true,
        },
      });

      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByText("my-project")).toBeInTheDocument();
        expect(screen.getByText("View Project")).toBeInTheDocument();
      });
    });
  });

  it("has grid layout for cards", () => {
    const { container } = render(<DashboardPage />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("renders heading as h1", () => {
    render(<DashboardPage />);
    const heading = screen.getByText("Clocked");
    expect(heading.tagName).toBe("H1");
  });

  it("has proper spacing between sections", () => {
    const { container } = render(<DashboardPage />);
    const wrapper = container.querySelector(".space-y-6");
    expect(wrapper).toBeInTheDocument();
  });
});

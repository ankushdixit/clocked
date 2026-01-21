/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "../page";

// Mock window.electron
const mockElectron = {
  getAppVersion: jest.fn(),
  getHealth: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
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
    expect(screen.getByText("Clocked is ready")).toBeInTheDocument();
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

  describe("when in Electron", () => {
    beforeEach(() => {
      window.electron = mockElectron;
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
  });

  it("has grid layout for cards", () => {
    const { container } = render(<DashboardPage />);
    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
  });

  it("renders heading as h1", () => {
    render(<DashboardPage />);
    const heading = screen.getByText("Clocked is ready");
    expect(heading.tagName).toBe("H1");
  });

  it("has proper spacing between sections", () => {
    const { container } = render(<DashboardPage />);
    const wrapper = container.querySelector(".space-y-6");
    expect(wrapper).toBeInTheDocument();
  });
});

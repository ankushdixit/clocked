import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WindowControls } from "../window-controls";

// Mock window.electron
const mockMinimize = jest.fn();
const mockMaximize = jest.fn();
const mockClose = jest.fn();
const mockIsMaximized = jest.fn();

describe("WindowControls Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsMaximized.mockResolvedValue(false);
  });

  describe("on Windows/Linux", () => {
    beforeEach(() => {
      // Mock window.electron for Windows
      Object.defineProperty(window, "electron", {
        value: {
          platform: "win32",
          window: {
            minimize: mockMinimize,
            maximize: mockMaximize,
            close: mockClose,
            isMaximized: mockIsMaximized,
          },
        },
        writable: true,
        configurable: true,
      });
    });

    it("renders window controls on Windows", async () => {
      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Minimize window")).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Maximize window")).toBeInTheDocument();
      expect(screen.getByLabelText("Close window")).toBeInTheDocument();
    });

    it("renders window controls on Linux", async () => {
      Object.defineProperty(window, "electron", {
        value: {
          platform: "linux",
          window: {
            minimize: mockMinimize,
            maximize: mockMaximize,
            close: mockClose,
            isMaximized: mockIsMaximized,
          },
        },
        writable: true,
        configurable: true,
      });

      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Minimize window")).toBeInTheDocument();
      });
    });

    it("calls minimize when minimize button is clicked", async () => {
      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Minimize window")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Minimize window"));
      expect(mockMinimize).toHaveBeenCalledTimes(1);
    });

    it("calls maximize when maximize button is clicked", async () => {
      mockMaximize.mockResolvedValue(undefined);
      // Start with non-maximized state
      mockIsMaximized.mockResolvedValue(false);

      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Maximize window")).toBeInTheDocument();
      });

      // After clicking, window becomes maximized
      mockIsMaximized.mockResolvedValue(true);
      fireEvent.click(screen.getByLabelText("Maximize window"));
      expect(mockMaximize).toHaveBeenCalledTimes(1);
    });

    it("calls close when close button is clicked", async () => {
      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Close window")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByLabelText("Close window"));
      expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("shows restore label when window is maximized", async () => {
      mockIsMaximized.mockResolvedValue(true);

      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Restore window")).toBeInTheDocument();
      });
    });

    it("has correct styling classes", async () => {
      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Minimize window")).toBeInTheDocument();
      });

      const container = screen.getByLabelText("Minimize window").parentElement;
      expect(container).toHaveClass("fixed", "top-0", "right-0");
    });

    it("close button has red hover styling", async () => {
      render(<WindowControls />);

      await waitFor(() => {
        expect(screen.getByLabelText("Close window")).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Close window");
      expect(closeButton).toHaveClass("hover:bg-red-500", "hover:text-white");
    });
  });

  describe("on macOS", () => {
    beforeEach(() => {
      // Mock window.electron for macOS
      Object.defineProperty(window, "electron", {
        value: {
          platform: "darwin",
          window: {
            minimize: mockMinimize,
            maximize: mockMaximize,
            close: mockClose,
            isMaximized: mockIsMaximized,
          },
        },
        writable: true,
        configurable: true,
      });
    });

    it("does not render window controls on macOS", async () => {
      render(<WindowControls />);

      // Wait for any potential render
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.queryByLabelText("Minimize window")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Maximize window")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Close window")).not.toBeInTheDocument();
    });
  });

  describe("when electron is not available", () => {
    beforeEach(() => {
      // Remove window.electron
      Object.defineProperty(window, "electron", {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it("does not render window controls", async () => {
      render(<WindowControls />);

      // Wait for any potential render
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(screen.queryByLabelText("Minimize window")).not.toBeInTheDocument();
    });
  });
});

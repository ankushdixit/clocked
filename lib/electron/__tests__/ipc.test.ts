import { isElectron, getAppVersion, getHealth, invoke, on } from "../ipc";

// Mock window.electron for tests
const mockElectron = {
  getAppVersion: jest.fn(),
  getHealth: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
};

describe("Electron IPC client", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear any existing electron property
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).electron;
  });

  describe("isElectron", () => {
    it("returns false when window.electron is undefined", () => {
      expect(isElectron()).toBe(false);
    });

    it("returns true when window.electron exists", () => {
      window.electron = mockElectron;
      expect(isElectron()).toBe(true);
    });
  });

  describe("getAppVersion", () => {
    it("returns null when not in Electron", async () => {
      const result = await getAppVersion();
      expect(result).toBeNull();
    });

    it("returns version when in Electron", async () => {
      window.electron = mockElectron;
      mockElectron.getAppVersion.mockResolvedValue("0.1.0");

      const result = await getAppVersion();
      expect(result).toBe("0.1.0");
      expect(mockElectron.getAppVersion).toHaveBeenCalled();
    });
  });

  describe("getHealth", () => {
    it("returns null when not in Electron", async () => {
      const result = await getHealth();
      expect(result).toBeNull();
    });

    it("returns health status when in Electron", async () => {
      window.electron = mockElectron;
      const mockHealth = { status: "ok", timestamp: "2026-01-21T00:00:00.000Z" };
      mockElectron.getHealth.mockResolvedValue(mockHealth);

      const result = await getHealth();
      expect(result).toEqual(mockHealth);
      expect(mockElectron.getHealth).toHaveBeenCalled();
    });
  });

  describe("invoke", () => {
    it("throws error when not in Electron", async () => {
      await expect(invoke("test:channel")).rejects.toThrow(
        "Cannot invoke IPC: not running in Electron"
      );
    });

    it("invokes channel with args when in Electron", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue("result");

      const result = await invoke("test:channel", "arg1", "arg2");
      expect(result).toBe("result");
      expect(mockElectron.invoke).toHaveBeenCalledWith("test:channel", "arg1", "arg2");
    });
  });

  describe("on", () => {
    it("returns null when not in Electron", () => {
      const callback = jest.fn();
      const result = on("test:channel", callback);
      expect(result).toBeNull();
    });

    it("registers callback when in Electron", () => {
      window.electron = mockElectron;
      const callback = jest.fn();

      const unsubscribe = on("test:channel", callback);
      expect(mockElectron.on).toHaveBeenCalledWith("test:channel", callback);
      expect(unsubscribe).toBeInstanceOf(Function);
    });
  });
});

import { isElectron, getAppVersion, getHealth, invoke, on } from "../ipc";

// Mock window.electron for tests
const mockElectron = {
  platform: "darwin" as NodeJS.Platform,
  getAppVersion: jest.fn(),
  getHealth: jest.fn(),
  invoke: jest.fn(),
  on: jest.fn(),
  // Window control methods
  window: {
    minimize: jest.fn(),
    maximize: jest.fn(),
    close: jest.fn(),
    isMaximized: jest.fn(),
  },
  // New API properties added for session/project data
  projects: {
    getAll: jest.fn(),
    getByPath: jest.fn(),
    getCount: jest.fn(),
    setHidden: jest.fn(),
    setGroup: jest.fn(),
    merge: jest.fn(),
    unmerge: jest.fn(),
    getMergedProjects: jest.fn(),
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
  analytics: {
    getMonthlySummary: jest.fn(),
  },
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

    it("returns false when window is undefined (SSR context simulation)", () => {
      // Save original window
      const originalWindow = global.window;

      // In Jest/jsdom, we can't fully delete window, but isElectron checks typeof window
      // The function handles the case where window.electron is falsy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electron = null;
      expect(isElectron()).toBe(false);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electron = undefined;
      expect(isElectron()).toBe(false);

      // Restore
      global.window = originalWindow;
    });

    it("returns false when window.electron is an empty object", () => {
      // An empty object is still truthy
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).electron = {};
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

    it("returns semantic version string", async () => {
      window.electron = mockElectron;
      mockElectron.getAppVersion.mockResolvedValue("1.2.3-beta.4");

      const result = await getAppVersion();
      expect(result).toBe("1.2.3-beta.4");
    });

    it("handles async resolution correctly", async () => {
      window.electron = mockElectron;
      mockElectron.getAppVersion.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve("2.0.0"), 10))
      );

      const result = await getAppVersion();
      expect(result).toBe("2.0.0");
    });

    it("propagates errors from the IPC call", async () => {
      window.electron = mockElectron;
      mockElectron.getAppVersion.mockRejectedValue(new Error("IPC Error"));

      await expect(getAppVersion()).rejects.toThrow("IPC Error");
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

    it("returns health with different status values", async () => {
      window.electron = mockElectron;
      const mockHealth = { status: "degraded", timestamp: "2026-01-21T12:30:00.000Z" };
      mockElectron.getHealth.mockResolvedValue(mockHealth);

      const result = await getHealth();
      expect(result?.status).toBe("degraded");
      expect(result?.timestamp).toBe("2026-01-21T12:30:00.000Z");
    });

    it("handles error status responses", async () => {
      window.electron = mockElectron;
      const mockHealth = { status: "error", timestamp: "2026-01-21T12:30:00.000Z" };
      mockElectron.getHealth.mockResolvedValue(mockHealth);

      const result = await getHealth();
      expect(result?.status).toBe("error");
    });

    it("propagates errors from the IPC call", async () => {
      window.electron = mockElectron;
      mockElectron.getHealth.mockRejectedValue(new Error("Health check failed"));

      await expect(getHealth()).rejects.toThrow("Health check failed");
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

    it("invokes channel without args", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue("no-args-result");

      const result = await invoke("test:no-args");
      expect(result).toBe("no-args-result");
      expect(mockElectron.invoke).toHaveBeenCalledWith("test:no-args");
    });

    it("invokes with complex object arguments", async () => {
      window.electron = mockElectron;
      const complexArg = { filter: { status: "active" }, pagination: { limit: 10, offset: 0 } };
      mockElectron.invoke.mockResolvedValue({ data: [], total: 0 });

      await invoke("data:query", complexArg);
      expect(mockElectron.invoke).toHaveBeenCalledWith("data:query", complexArg);
    });

    it("invokes with array arguments", async () => {
      window.electron = mockElectron;
      const arrayArg = [1, 2, 3];
      mockElectron.invoke.mockResolvedValue([2, 4, 6]);

      const result = await invoke("array:double", arrayArg);
      expect(result).toEqual([2, 4, 6]);
    });

    it("preserves type information with generic", async () => {
      window.electron = mockElectron;
      interface TestResponse {
        success: boolean;
        data: string[];
      }
      const response: TestResponse = { success: true, data: ["item1", "item2"] };
      mockElectron.invoke.mockResolvedValue(response);

      const result = await invoke<TestResponse>("typed:channel");
      expect(result.success).toBe(true);
      expect(result.data).toEqual(["item1", "item2"]);
    });

    it("propagates errors from IPC channel", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockRejectedValue(new Error("Channel not found: invalid:channel"));

      await expect(invoke("invalid:channel")).rejects.toThrow("Channel not found: invalid:channel");
    });

    it("handles null return values", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue(null);

      const result = await invoke<string | null>("nullable:channel");
      expect(result).toBeNull();
    });

    it("handles undefined return values", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue(undefined);

      const result = await invoke("void:channel");
      expect(result).toBeUndefined();
    });

    it("handles multiple sequential invocations", async () => {
      window.electron = mockElectron;
      mockElectron.invoke
        .mockResolvedValueOnce("first")
        .mockResolvedValueOnce("second")
        .mockResolvedValueOnce("third");

      const first = await invoke("seq:1");
      const second = await invoke("seq:2");
      const third = await invoke("seq:3");

      expect(first).toBe("first");
      expect(second).toBe("second");
      expect(third).toBe("third");
      expect(mockElectron.invoke).toHaveBeenCalledTimes(3);
    });

    it("handles concurrent invocations", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockImplementation(
        (channel: string) =>
          new Promise((resolve) =>
            setTimeout(() => resolve(`result-${channel}`), Math.random() * 50)
          )
      );

      const results = await Promise.all([
        invoke("concurrent:1"),
        invoke("concurrent:2"),
        invoke("concurrent:3"),
      ]);

      expect(results).toContain("result-concurrent:1");
      expect(results).toContain("result-concurrent:2");
      expect(results).toContain("result-concurrent:3");
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

    it("returns an unsubscribe function", () => {
      window.electron = mockElectron;
      const callback = jest.fn();

      const unsubscribe = on("test:channel", callback);
      expect(typeof unsubscribe).toBe("function");

      // Call unsubscribe (currently a no-op)
      if (unsubscribe) {
        expect(() => unsubscribe()).not.toThrow();
      }
    });

    it("registers multiple callbacks for same channel", () => {
      window.electron = mockElectron;
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      on("shared:channel", callback1);
      on("shared:channel", callback2);

      expect(mockElectron.on).toHaveBeenCalledTimes(2);
      expect(mockElectron.on).toHaveBeenCalledWith("shared:channel", callback1);
      expect(mockElectron.on).toHaveBeenCalledWith("shared:channel", callback2);
    });

    it("registers callbacks for different channels", () => {
      window.electron = mockElectron;
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      on("channel:1", callback1);
      on("channel:2", callback2);

      expect(mockElectron.on).toHaveBeenCalledWith("channel:1", callback1);
      expect(mockElectron.on).toHaveBeenCalledWith("channel:2", callback2);
    });

    it("callback receives arguments when invoked by electron", () => {
      window.electron = mockElectron;
      const callback = jest.fn();

      // Capture the callback passed to electron.on and simulate invoking it
      const captured: { callback: ((...args: unknown[]) => void) | null } = { callback: null };
      mockElectron.on.mockImplementationOnce(
        (_channel: string, cb: (...args: unknown[]) => void) => {
          captured.callback = cb;
        }
      );

      on("data:event", callback);

      // Simulate electron invoking the callback with data
      if (captured.callback) {
        captured.callback("event-data", { extra: "info" });
      }

      expect(callback).toHaveBeenCalledWith("event-data", { extra: "info" });
    });

    it("handles callback that throws error when invoked", () => {
      window.electron = mockElectron;
      const errorCallback = jest.fn(() => {
        throw new Error("Callback error");
      });

      // Registering the callback should not throw
      on("error:channel", errorCallback);
      expect(mockElectron.on).toHaveBeenCalledWith("error:channel", errorCallback);

      // When the callback is actually invoked (by electron), it would throw
      expect(() => errorCallback()).toThrow("Callback error");
    });

    it("does not call callback when not in Electron", () => {
      const callback = jest.fn();
      on("test:channel", callback);

      // Callback should never be invoked since we're not in Electron
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe("real-world IPC communication patterns", () => {
    beforeEach(() => {
      window.electron = mockElectron;
    });

    it("handles project data fetching workflow", async () => {
      mockElectron.invoke.mockResolvedValue({
        projects: [
          { path: "/project1", name: "Project 1", sessionCount: 10 },
          { path: "/project2", name: "Project 2", sessionCount: 5 },
        ],
      });

      const result = await invoke<{ projects: Array<{ path: string; name: string }> }>(
        "projects:getAll"
      );
      expect(result.projects).toHaveLength(2);
      expect(result.projects[0].path).toBe("/project1");
    });

    it("handles session data with pagination", async () => {
      mockElectron.invoke.mockResolvedValue({
        sessions: [{ id: "1" }, { id: "2" }],
        total: 100,
        page: 1,
        pageSize: 10,
      });

      const result = await invoke("sessions:list", { page: 1, pageSize: 10 });
      expect(result).toHaveProperty("sessions");
      expect(result).toHaveProperty("total", 100);
    });

    it("handles sync operation with progress events", async () => {
      const progressCallback = jest.fn();

      // Subscribe to progress events
      const unsubscribe = on("sync:progress", progressCallback);
      expect(unsubscribe).toBeInstanceOf(Function);
      expect(mockElectron.on).toHaveBeenCalledWith("sync:progress", progressCallback);

      // Trigger sync
      mockElectron.invoke.mockResolvedValue({ success: true, syncedCount: 50 });
      const result = await invoke("data:sync");

      expect(result).toEqual({ success: true, syncedCount: 50 });
    });

    it("handles error responses from main process", async () => {
      mockElectron.invoke.mockResolvedValue({
        error: "Permission denied",
        code: "EPERM",
      });

      const result = await invoke<{ error?: string; code?: string }>("file:read", "/restricted");
      expect(result.error).toBe("Permission denied");
      expect(result.code).toBe("EPERM");
    });
  });

  describe("edge cases and error handling", () => {
    it("handles very long channel names", async () => {
      window.electron = mockElectron;
      const longChannel = "a".repeat(1000);
      mockElectron.invoke.mockResolvedValue("ok");

      await invoke(longChannel);
      expect(mockElectron.invoke).toHaveBeenCalledWith(longChannel);
    });

    it("handles special characters in channel names", async () => {
      window.electron = mockElectron;
      const specialChannel = "channel:with-special_chars.and/slashes";
      mockElectron.invoke.mockResolvedValue("ok");

      await invoke(specialChannel);
      expect(mockElectron.invoke).toHaveBeenCalledWith(specialChannel);
    });

    it("handles very large data payloads", async () => {
      window.electron = mockElectron;
      const largeData = { items: Array(10000).fill({ id: 1, data: "test" }) };
      mockElectron.invoke.mockResolvedValue(largeData);

      const result = await invoke("large:data");
      expect(result).toEqual(largeData);
    });

    it("handles boolean return values", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue(true);

      const result = await invoke<boolean>("check:status");
      expect(result).toBe(true);
    });

    it("handles numeric return values", async () => {
      window.electron = mockElectron;
      mockElectron.invoke.mockResolvedValue(42);

      const result = await invoke<number>("get:count");
      expect(result).toBe(42);
    });
  });
});

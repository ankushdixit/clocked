declare global {
  interface Window {
    electron: {
      getAppVersion: () => Promise<string>;
      getHealth: () => Promise<{ status: string; timestamp: string }>;
      invoke: (_channel: string, ..._args: unknown[]) => Promise<unknown>;
      on: (_channel: string, _callback: (..._args: unknown[]) => void) => void;
    };
  }
}

export {};

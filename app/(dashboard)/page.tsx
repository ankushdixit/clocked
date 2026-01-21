"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ElectronStatus {
  connected: boolean;
  version: string | null;
  health: { status: string; timestamp: string } | null;
  loading: boolean;
  error: string | null;
}

function useElectronStatus(): ElectronStatus {
  const [status, setStatus] = useState<ElectronStatus>({
    connected: false,
    version: null,
    health: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function check() {
      if (typeof window !== "undefined" && window.electron) {
        try {
          const [version, health] = await Promise.all([
            window.electron.getAppVersion(),
            window.electron.getHealth(),
          ]);
          setStatus({ connected: true, version, health, loading: false, error: null });
        } catch (err) {
          const error = err instanceof Error ? err.message : "Unknown error";
          setStatus({ connected: false, version: null, health: null, loading: false, error });
        }
      } else {
        setStatus({ connected: false, version: null, health: null, loading: false, error: null });
      }
    }
    check();
  }, []);

  return status;
}

export default function DashboardPage() {
  const electronStatus = useElectronStatus();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clocked is ready</h1>
        <p className="text-muted-foreground">Time tracking for Claude Code development sessions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Electron Connection</CardTitle>
            {electronStatus.loading ? (
              <Loader2 className="ml-auto h-5 w-5 animate-spin text-muted-foreground" />
            ) : electronStatus.connected ? (
              <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="ml-auto h-5 w-5 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {electronStatus.loading ? (
              <p className="text-muted-foreground">Checking connection...</p>
            ) : electronStatus.connected ? (
              <>
                <p className="text-green-600 font-medium">Connected to Electron</p>
                <p className="text-muted-foreground">Version: {electronStatus.version}</p>
              </>
            ) : (
              <p className="text-muted-foreground">
                {electronStatus.error
                  ? `Error: ${electronStatus.error}`
                  : "Running in browser mode"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Health Status</CardTitle>
            {electronStatus.health?.status === "ok" && (
              <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
            )}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {electronStatus.loading ? (
              <p className="text-muted-foreground">Checking health...</p>
            ) : electronStatus.health ? (
              <>
                <p className="text-green-600 font-medium">Status: {electronStatus.health.status}</p>
                <p className="text-muted-foreground">
                  Last check: {new Date(electronStatus.health.timestamp).toLocaleTimeString()}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground">Health check unavailable</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

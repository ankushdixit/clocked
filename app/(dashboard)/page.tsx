"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Star,
  Clock,
  MessageSquare,
  FolderKanban,
} from "lucide-react";
import { formatDuration } from "@/lib/formatters/time";
import type { Project, ProjectResponse } from "@/types/electron";

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

function useDefaultProject(): { project: Project | null; loading: boolean } {
  const [state, setState] = useState<{ project: Project | null; loading: boolean }>({
    project: null,
    loading: true,
  });

  useEffect(() => {
    async function fetchDefaultProject() {
      if (typeof window !== "undefined" && window.electron) {
        try {
          const response = (await window.electron.projects.getDefault()) as ProjectResponse;
          setState({ project: response.project ?? null, loading: false });
        } catch {
          setState({ project: null, loading: false });
        }
      } else {
        setState({ project: null, loading: false });
      }
    }
    fetchDefaultProject();
  }, []);

  return state;
}

function DefaultProjectCard({ project, loading }: { project: Project | null; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Default Project
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (project) {
    return (
      <Card className="border-yellow-500/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            Default Project
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">{project.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{project.path}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{project.sessionCount}</p>
                <p className="text-xs text-muted-foreground">Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(project.totalTime)}</p>
                <p className="text-xs text-muted-foreground">Total Time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{project.messageCount}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button asChild>
              <Link href={`/projects/${encodeURIComponent(project.path)}`}>View Project</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-muted-foreground">
          <Star className="h-5 w-5" />
          No Default Project
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Set a default project from the Projects page to see it highlighted here.
        </p>
        <Button asChild variant="outline">
          <Link href="/projects">View Projects</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ElectronStatusCard({ status }: { status: ElectronStatus }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Electron Connection</CardTitle>
        {status.loading ? (
          <Loader2 className="ml-auto h-5 w-5 animate-spin text-muted-foreground" />
        ) : status.connected ? (
          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="ml-auto h-5 w-5 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {status.loading ? (
          <p className="text-muted-foreground">Checking connection...</p>
        ) : status.connected ? (
          <>
            <p className="text-green-600 font-medium">Connected to Electron</p>
            <p className="text-muted-foreground">Version: {status.version}</p>
          </>
        ) : (
          <p className="text-muted-foreground">
            {status.error ? `Error: ${status.error}` : "Running in browser mode"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function HealthStatusCard({ status }: { status: ElectronStatus }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">Health Status</CardTitle>
        {status.health?.status === "ok" && (
          <CheckCircle2 className="ml-auto h-5 w-5 text-green-500" />
        )}
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {status.loading ? (
          <p className="text-muted-foreground">Checking health...</p>
        ) : status.health ? (
          <>
            <p className="text-green-600 font-medium">Status: {status.health.status}</p>
            <p className="text-muted-foreground">
              Last check: {new Date(status.health.timestamp).toLocaleTimeString()}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Health check unavailable</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const electronStatus = useElectronStatus();
  const { project: defaultProject, loading: defaultLoading } = useDefaultProject();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clocked</h1>
        <p className="text-muted-foreground">Time tracking for Claude Code development sessions</p>
      </div>

      <DefaultProjectCard project={defaultProject} loading={defaultLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        <ElectronStatusCard status={electronStatus} />
        <HealthStatusCard status={electronStatus} />
      </div>
    </div>
  );
}

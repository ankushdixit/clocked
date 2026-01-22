import { Sidebar } from "@/components/layout/sidebar";
import { WindowControls } from "@/components/layout/window-controls";

/**
 * Dashboard layout
 * Frameless window with sidebar navigation and optional window controls
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6">{children}</main>
      <WindowControls />
    </div>
  );
}

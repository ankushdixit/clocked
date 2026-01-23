"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FolderKanban, Settings } from "lucide-react";

/**
 * Dashboard sidebar navigation
 *
 * Features:
 * - Logo branding below traffic lights
 * - Drag region for window movement (frameless window)
 * - Traffic lights area separate from logo on macOS
 *
 * Add navigation items as you build your resources.
 * See ARCHITECTURE.md for patterns on adding resources.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Check platform on mount (client-side only)
    if (typeof window !== "undefined" && window.electron?.platform) {
      setIsMac(window.electron.platform === "darwin");
    }
  }, []);

  const routes = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/",
      active: pathname === "/",
    },
    {
      label: "Projects",
      icon: FolderKanban,
      href: "/projects",
      active: pathname === "/projects" || pathname.startsWith("/projects/"),
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/settings",
      active: pathname === "/settings",
    },
  ];

  return (
    <aside className="hidden md:flex w-52 flex-col border-r bg-background">
      {/* Traffic lights area - only visible space on macOS */}
      {isMac && <div className="h-8 app-drag-region flex-shrink-0" />}

      {/* Logo area */}
      <div
        className={cn(
          "flex items-center border-b app-drag-region px-4 pb-4",
          !isMac && "pt-3" // Extra top padding on Windows/Linux since no traffic light area
        )}
      >
        <Link href="/" className="app-no-drag">
          <Image src="/logo-lockup.svg" alt="Clocked" width={160} height={32} priority />
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent",
              route.active ? "bg-accent text-accent-foreground" : "text-muted-foreground"
            )}
            aria-current={route.active ? "page" : undefined}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Square, X, Copy } from "lucide-react";

/**
 * Custom window controls for Windows and Linux
 *
 * On macOS, the native traffic lights are used (configured via titleBarStyle: 'hiddenInset')
 * On Windows/Linux, this component provides custom minimize/maximize/close buttons
 */
export function WindowControls() {
  const [showControls, setShowControls] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Only show controls on non-macOS platforms
    if (typeof window !== "undefined" && window.electron?.platform) {
      setShowControls(window.electron.platform !== "darwin");
    }

    // Check initial maximized state
    const checkMaximized = async () => {
      if (typeof window !== "undefined" && window.electron?.window?.isMaximized) {
        const maximized = await window.electron.window.isMaximized();
        setIsMaximized(maximized);
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = useCallback(() => {
    window.electron?.window?.minimize();
  }, []);

  const handleMaximize = useCallback(async () => {
    await window.electron?.window?.maximize();
    // Update state after toggling
    const maximized = await window.electron?.window?.isMaximized();
    setIsMaximized(maximized ?? false);
  }, []);

  const handleClose = useCallback(() => {
    window.electron?.window?.close();
  }, []);

  // Don't render on macOS or if electron is not available
  if (!showControls) {
    return null;
  }

  return (
    <div className="fixed top-0 right-0 flex h-8 z-50 app-no-drag">
      {/* Minimize button */}
      <button
        onClick={handleMinimize}
        className="w-12 h-8 hover:bg-muted flex items-center justify-center transition-colors"
        aria-label="Minimize window"
      >
        <Minus className="h-4 w-4" />
      </button>

      {/* Maximize/Restore button */}
      <button
        onClick={handleMaximize}
        className="w-12 h-8 hover:bg-muted flex items-center justify-center transition-colors"
        aria-label={isMaximized ? "Restore window" : "Maximize window"}
      >
        {isMaximized ? (
          <Copy className="h-3 w-3" /> // Restore icon (overlapping squares)
        ) : (
          <Square className="h-3 w-3" /> // Maximize icon
        )}
      </button>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="w-12 h-8 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
        aria-label="Close window"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

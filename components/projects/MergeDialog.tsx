"use client";

/**
 * Merge projects dialog component
 * Allows selecting which project should be the primary for merging
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GitMerge } from "lucide-react";
import type { Project } from "@/types/electron";

interface MergeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPaths: Set<string>;
  projects: Project[];
  selectedPrimary: string | null;
  onSelectPrimary: (path: string) => void;
  onConfirm: () => void;
}

export function MergeDialog({
  open,
  onOpenChange,
  selectedPaths,
  projects,
  selectedPrimary,
  onSelectPrimary,
  onConfirm,
}: MergeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Merge Projects</DialogTitle>
          <DialogDescription>
            Select which project should be the primary. Other projects will be merged into it and
            their stats will be aggregated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {Array.from(selectedPaths).map((path) => {
            const project = projects.find((p) => p.path === path);
            if (!project) return null;
            return (
              <label
                key={path}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedPrimary === path ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <input
                  type="radio"
                  name="primaryProject"
                  value={path}
                  checked={selectedPrimary === path}
                  onChange={() => onSelectPrimary(path)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    selectedPrimary === path ? "border-primary" : "border-muted-foreground"
                  }`}
                >
                  {selectedPrimary === path && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{project.path}</p>
                </div>
                {selectedPrimary === path && (
                  <span className="text-xs font-medium text-primary">Primary</span>
                )}
              </label>
            );
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={!selectedPrimary}>
            <GitMerge className="mr-2 h-4 w-4" />
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

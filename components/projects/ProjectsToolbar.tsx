"use client";

/**
 * Projects toolbar component
 * Sort dropdown, hidden toggle, and merge mode controls
 */

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUp, ArrowDown, Check, GitMerge, X } from "lucide-react";
import type { SortField, SortOrder } from "./types";

// Helper function to get sort label - moved outside component
function getSortLabel(field: SortField): string {
  switch (field) {
    case "lastActivity":
      return "Activity";
    case "sessionCount":
      return "Sessions";
    case "totalTime":
      return "Time";
    default:
      return "Name";
  }
}

interface ProjectsToolbarProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
  hiddenCount: number;
  isSelectMode: boolean;
  selectedCount: number;
  onMergeClick: () => void;
  onEnterSelectMode: () => void;
  onCancelSelectMode: () => void;
}

export function ProjectsToolbar({
  sortField,
  sortOrder,
  onSort,
  showHidden,
  onShowHiddenChange,
  hiddenCount,
  isSelectMode,
  selectedCount,
  onMergeClick,
  onEnterSelectMode,
  onCancelSelectMode,
}: ProjectsToolbarProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SortDropdown sortField={sortField} sortOrder={sortOrder} onSort={onSort} />
        <HiddenToggle
          hiddenCount={hiddenCount}
          showHidden={showHidden}
          onShowHiddenChange={onShowHiddenChange}
        />
      </div>
      <MergeModeControls
        isSelectMode={isSelectMode}
        selectedCount={selectedCount}
        onMergeClick={onMergeClick}
        onEnterSelectMode={onEnterSelectMode}
        onCancelSelectMode={onCancelSelectMode}
      />
    </div>
  );
}

// Sort dropdown sub-component
interface SortDropdownProps {
  sortField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
}

function SortDropdown({ sortField, sortOrder, onSort }: SortDropdownProps) {
  // For "name", flip arrow: down = A-Z (asc), up = Z-A (desc)
  const showDownArrow = sortField === "name" ? sortOrder === "asc" : sortOrder === "desc";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          {showDownArrow ? (
            <ArrowDown className="mr-2 h-3.5 w-3.5" />
          ) : (
            <ArrowUp className="mr-2 h-3.5 w-3.5" />
          )}
          <span className="sm:hidden">Sort</span>
          <span className="hidden sm:inline">Sort by {getSortLabel(sortField)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <SortMenuItem
          label="Last Activity"
          field="lastActivity"
          currentField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <SortMenuItem
          label="Sessions"
          field="sessionCount"
          currentField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <SortMenuItem
          label="Total Time"
          field="totalTime"
          currentField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
        />
        <SortMenuItem
          label="Name"
          field="name"
          currentField={sortField}
          sortOrder={sortOrder}
          onSort={onSort}
          flipArrow
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hidden toggle sub-component
interface HiddenToggleProps {
  hiddenCount: number;
  showHidden: boolean;
  onShowHiddenChange: (show: boolean) => void;
}

function HiddenToggle({ hiddenCount, showHidden, onShowHiddenChange }: HiddenToggleProps) {
  if (hiddenCount === 0) return null;

  return (
    <div className="flex items-center space-x-2">
      <Switch id="show-hidden" checked={showHidden} onCheckedChange={onShowHiddenChange} />
      <Label htmlFor="show-hidden" className="text-sm text-muted-foreground">
        Show hidden ({hiddenCount})
      </Label>
    </div>
  );
}

// Merge mode controls sub-component
interface MergeModeControlsProps {
  isSelectMode: boolean;
  selectedCount: number;
  onMergeClick: () => void;
  onEnterSelectMode: () => void;
  onCancelSelectMode: () => void;
}

function MergeModeControls({
  isSelectMode,
  selectedCount,
  onMergeClick,
  onEnterSelectMode,
  onCancelSelectMode,
}: MergeModeControlsProps) {
  if (!isSelectMode) {
    return (
      <div className="flex items-center gap-2">
        <Button onClick={onEnterSelectMode} size="sm" variant="outline">
          <GitMerge className="mr-2 h-4 w-4 hidden sm:inline" />
          <span className="sm:hidden">Merge</span>
          <span className="hidden sm:inline">Merge Projects</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground mr-2">
        <span className="sm:hidden">{selectedCount}</span>
        <span className="hidden sm:inline">{selectedCount} selected</span>
      </span>
      <Button onClick={onMergeClick} size="sm" disabled={selectedCount < 2}>
        <GitMerge className="mr-2 h-4 w-4 hidden sm:inline" />
        Merge
      </Button>
      <Button onClick={onCancelSelectMode} size="sm" variant="outline">
        <X className="mr-2 h-4 w-4 hidden sm:inline" />
        Cancel
      </Button>
    </div>
  );
}

// Sort menu item sub-component
interface SortMenuItemProps {
  label: string;
  field: SortField;
  currentField: SortField;
  sortOrder: SortOrder;
  onSort: (field: SortField) => void;
  flipArrow?: boolean;
}

function SortMenuItem({
  label,
  field,
  currentField,
  sortOrder,
  onSort,
  flipArrow,
}: SortMenuItemProps) {
  const isActive = currentField === field;
  // For name field, flip the arrow direction
  const showDownArrow = flipArrow ? sortOrder === "asc" : sortOrder === "desc";

  return (
    <DropdownMenuItem onClick={() => onSort(field)}>
      {label}
      {isActive && (
        <span className="ml-auto flex items-center gap-1">
          {showDownArrow ? (
            <ArrowDown className="h-3.5 w-3.5" />
          ) : (
            <ArrowUp className="h-3.5 w-3.5" />
          )}
          <Check className="h-4 w-4" />
        </span>
      )}
    </DropdownMenuItem>
  );
}

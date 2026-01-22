"use client";

import { useState } from "react";
import { useList, useUpdate, useCreate, useDelete, useInvalidate } from "@refinedev/core";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Eye, Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Project, ProjectGroup } from "@/types/electron";

const GROUP_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export default function SettingsPage() {
  const invalidate = useInvalidate();

  // Fetch hidden projects
  const { query: projectsQuery, result: projectsResult } = useList<Project>({
    resource: "projects",
    pagination: { pageSize: 1000 },
  });

  // Fetch groups
  const { query: groupsQuery, result: groupsResult } = useList<ProjectGroup>({
    resource: "groups",
  });

  const updateProjectMutation = useUpdate<Project>();
  const createGroupMutation = useCreate<ProjectGroup>();
  const updateGroupMutation = useUpdate<ProjectGroup>();
  const deleteGroupMutation = useDelete<ProjectGroup>();

  const isUpdatingProject = updateProjectMutation.mutation.isPending;
  const isCreatingGroup = createGroupMutation.mutation.isPending;
  const isUpdatingGroup = updateGroupMutation.mutation.isPending;
  const isDeletingGroup = deleteGroupMutation.mutation.isPending;

  const hiddenProjects: Project[] = (projectsResult.data ?? []).filter((p) => p.isHidden);
  const groups: ProjectGroup[] = groupsResult.data ?? [];

  const handleUnhideProject = (project: Project) => {
    updateProjectMutation.mutate(
      {
        resource: "projects",
        id: project.path,
        values: { isHidden: false },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  const handleCreateGroup = (name: string, color: string | null) => {
    createGroupMutation.mutate(
      {
        resource: "groups",
        values: { name, color },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "groups", invalidates: ["list"] });
        },
      }
    );
  };

  const handleUpdateGroup = (id: string, name: string, color: string | null) => {
    updateGroupMutation.mutate(
      {
        resource: "groups",
        id,
        values: { name, color },
      },
      {
        onSuccess: () => {
          invalidate({ resource: "groups", invalidates: ["list"] });
        },
      }
    );
  };

  const handleDeleteGroup = (id: string) => {
    deleteGroupMutation.mutate(
      {
        resource: "groups",
        id,
      },
      {
        onSuccess: () => {
          invalidate({ resource: "groups", invalidates: ["list"] });
          invalidate({ resource: "projects", invalidates: ["list"] });
        },
      }
    );
  };

  const isLoading = projectsQuery.isLoading || groupsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your project settings</p>
      </div>

      <div className="grid gap-6">
        {/* Hidden Projects Section */}
        <Card>
          <CardHeader>
            <CardTitle>Hidden Projects</CardTitle>
            <CardDescription>
              Projects you&apos;ve hidden from the main list. Click unhide to show them again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hiddenProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No hidden projects</p>
            ) : (
              <div className="space-y-2">
                {hiddenProjects.map((project) => (
                  <div
                    key={project.path}
                    className="flex items-center justify-between py-2 px-3 rounded-md border"
                  >
                    <div>
                      <div className="font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-md">
                        {project.path}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnhideProject(project)}
                      disabled={isUpdatingProject}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Unhide
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Project Groups Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Project Groups</CardTitle>
              <CardDescription>Organize your projects into groups</CardDescription>
            </div>
            <CreateGroupDialog onSubmit={handleCreateGroup} isLoading={isCreatingGroup} />
          </CardHeader>
          <CardContent>
            {groups.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No groups yet. Create one to organize your projects.
              </p>
            ) : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between py-2 px-3 rounded-md border"
                  >
                    <div className="flex items-center gap-3">
                      {group.color && (
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: group.color }}
                        />
                      )}
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <EditGroupDialog
                        group={group}
                        onSubmit={(name, color) => handleUpdateGroup(group.id, name, color)}
                        isLoading={isUpdatingGroup}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteGroup(group.id)}
                        disabled={isDeletingGroup}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete group</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface CreateGroupDialogProps {
  onSubmit: (name: string, color: string | null) => void;
  isLoading: boolean;
}

function CreateGroupDialog({ onSubmit, isLoading }: CreateGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string | null>(GROUP_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
      setName("");
      setColor(GROUP_COLORS[0]);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Project Group</DialogTitle>
            <DialogDescription>Create a new group to organize your projects.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <button
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    color === null ? "border-foreground scale-110" : "border-muted"
                  }`}
                  onClick={() => setColor(null)}
                >
                  <span className="text-xs text-muted-foreground">None</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EditGroupDialogProps {
  group: ProjectGroup;
  onSubmit: (name: string, color: string | null) => void;
  isLoading: boolean;
}

function EditGroupDialog({ group, onSubmit, isLoading }: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(group.name);
  const [color, setColor] = useState<string | null>(group.color);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), color);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit group</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Project Group</DialogTitle>
            <DialogDescription>Update the group name and color.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Group name"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {GROUP_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
                <button
                  type="button"
                  className={`h-8 w-8 rounded-full border-2 transition-all flex items-center justify-center ${
                    color === null ? "border-foreground scale-110" : "border-muted"
                  }`}
                  onClick={() => setColor(null)}
                >
                  <span className="text-xs text-muted-foreground">None</span>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

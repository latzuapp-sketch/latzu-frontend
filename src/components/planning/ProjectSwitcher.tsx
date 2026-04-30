"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectBoardProject } from "@/types/planning";
import { FolderKanban, Plus } from "lucide-react";
import { useState } from "react";

interface ProjectSwitcherProps {
  projects: ProjectBoardProject[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: (name: string) => Promise<void>;
}

export function ProjectSwitcher({ projects, selectedProjectId, onSelectProject, onCreateProject }: ProjectSwitcherProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2">
      <FolderKanban className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedProjectId ?? ""}
        onChange={(event) => onSelectProject(event.target.value)}
        className="h-8 rounded-md border border-border/50 bg-background px-2 text-xs font-medium"
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.key} · {project.name}
          </option>
        ))}
      </select>
      {creating ? (
        <form
          className="flex items-center gap-1"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            await onCreateProject(name.trim());
            setName("");
            setCreating(false);
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Proyecto" className="h-8 w-32 text-xs" />
        </form>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setCreating(true)} className="h-8 w-8 p-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

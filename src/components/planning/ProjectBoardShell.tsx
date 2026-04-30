"use client";

import { BoardMembersMenu } from "@/components/planning/BoardMembersMenu";
import { BoardSwitcher } from "@/components/planning/BoardSwitcher";
import { ProjectSwitcher } from "@/components/planning/ProjectSwitcher";
import type { ProjectBoard, ProjectBoardProject } from "@/types/planning";

interface ProjectBoardShellProps {
  projects: ProjectBoardProject[];
  boards: ProjectBoard[];
  selectedProject: ProjectBoardProject | null;
  selectedBoard: ProjectBoard | null;
  onSelectProject: (projectId: string) => void;
  onSelectBoard: (boardId: string) => void;
  onCreateProject: (name: string) => Promise<void>;
  onCreateBoard: (name: string) => Promise<void>;
  onAddMember: (name: string) => Promise<void>;
}

export function ProjectBoardShell({
  projects,
  boards,
  selectedProject,
  selectedBoard,
  onSelectProject,
  onSelectBoard,
  onCreateProject,
  onCreateBoard,
  onAddMember,
}: ProjectBoardShellProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ProjectSwitcher
        projects={projects}
        selectedProjectId={selectedProject?.id ?? null}
        onSelectProject={onSelectProject}
        onCreateProject={onCreateProject}
      />
      <BoardSwitcher
        boards={boards}
        selectedBoardId={selectedBoard?.id ?? null}
        onSelectBoard={onSelectBoard}
        onCreateBoard={onCreateBoard}
      />
      <BoardMembersMenu project={selectedProject} onAddMember={onAddMember} />
    </div>
  );
}

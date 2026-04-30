"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectBoardProject } from "@/types/planning";
import { UsersRound } from "lucide-react";
import { useState } from "react";

interface BoardMembersMenuProps {
  project: ProjectBoardProject | null;
  onAddMember: (name: string) => Promise<void>;
}

export function BoardMembersMenu({ project, onAddMember }: BoardMembersMenuProps) {
  const [name, setName] = useState("");
  const members = project?.members?.length
    ? project.members.map((member) => member.name)
    : project?.memberNames ?? [];

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/50 px-2 py-1">
      <UsersRound className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="hidden max-w-[180px] truncate text-xs text-muted-foreground md:block">
        {members.length ? members.join(", ") : "Sin miembros"}
      </div>
      <form
        className="flex items-center gap-1"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!name.trim()) return;
          await onAddMember(name.trim());
          setName("");
        }}
      >
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Invitar" className="h-7 w-24 text-xs" />
        <Button type="submit" variant="ghost" size="sm" className="h-7 px-2 text-xs">
          Añadir
        </Button>
      </form>
    </div>
  );
}

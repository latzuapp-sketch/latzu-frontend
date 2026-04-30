"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProjectBoard } from "@/types/planning";
import { Columns3, Plus } from "lucide-react";
import { useState } from "react";

interface BoardSwitcherProps {
  boards: ProjectBoard[];
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
  onCreateBoard: (name: string) => Promise<void>;
}

export function BoardSwitcher({ boards, selectedBoardId, onSelectBoard, onCreateBoard }: BoardSwitcherProps) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="flex items-center gap-2">
      <Columns3 className="h-4 w-4 text-muted-foreground" />
      <select
        value={selectedBoardId ?? ""}
        onChange={(event) => onSelectBoard(event.target.value)}
        className="h-8 rounded-md border border-border/50 bg-background px-2 text-xs font-medium"
      >
        {boards.map((board) => (
          <option key={board.id} value={board.id}>{board.name}</option>
        ))}
      </select>
      {creating ? (
        <form
          className="flex items-center gap-1"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!name.trim()) return;
            await onCreateBoard(name.trim());
            setName("");
            setCreating(false);
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tablero" className="h-8 w-32 text-xs" />
        </form>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => setCreating(true)} className="h-8 w-8 p-0">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

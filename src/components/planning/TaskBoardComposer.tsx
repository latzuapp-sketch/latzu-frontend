"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BoardList, CreateTaskInput, TaskPriority } from "@/types/planning";
import { CalendarDays, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

const priorityClasses: Record<TaskPriority, string> = {
  high:   "border-red-500/40 bg-red-500/10 text-red-400",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  low:    "border-sky-500/40 bg-sky-500/10 text-sky-400",
};

interface TaskBoardComposerProps {
  list: BoardList;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
}

export function TaskBoardComposer({ list, onSubmit, onClose }: TaskBoardComposerProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      status: list.mapsToTaskStatus,
      source: "manual",
      projectId: list.projectId,
      boardId: list.boardId,
      listId: list.id,
      priority,
      dueDate: dueDate || null,
      category: "task",
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <div
      className="rounded-xl border border-primary/40 bg-card/95 p-3 space-y-2.5 shadow-sm ring-1 ring-primary/10"
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void submit();
      }}
    >
      <Textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void submit();
          }
        }}
        placeholder="¿Qué hay que hacer?"
        className="min-h-0 resize-none border-0 bg-transparent p-0 text-sm font-medium leading-snug shadow-none focus-visible:ring-0"
        rows={2}
      />

      {/* Quick metadata */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(["high", "medium", "low"] as TaskPriority[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPriority(p)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium transition-all",
              priority === p ? priorityClasses[p] : "border-border/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {{ high: "Alta", medium: "Media", low: "Baja" }[p]}
          </button>
        ))}

        <label className="inline-flex items-center gap-1 text-[11px] text-muted-foreground ml-1">
          <CalendarDays className="h-3 w-3" />
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-5 w-28 border-0 bg-transparent p-0 text-[11px] shadow-none focus-visible:ring-0"
          />
        </label>
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <Button
          type="button"
          size="sm"
          disabled={!title.trim() || submitting}
          className="h-7 gap-1.5 text-xs"
          onClick={submit}
        >
          <Plus className="h-3.5 w-3.5" />
          {submitting ? "Creando..." : "Crear tarea"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-7 text-xs"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
        <span className="ml-auto text-[10px] text-muted-foreground hidden sm:inline">
          Enter · Ctrl+Enter
        </span>
      </div>
    </div>
  );
}

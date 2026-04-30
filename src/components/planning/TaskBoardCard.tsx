"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanningTask } from "@/types/planning";
import { Bot, CalendarDays, Clock, GripVertical, Tag, UserRound } from "lucide-react";

const priorityClasses: Record<PlanningTask["priority"], string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

const priorityLabels: Record<PlanningTask["priority"], string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  const due = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${Math.abs(diff)} días`;
  return due.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

interface TaskBoardCardProps {
  task: PlanningTask;
  onOpen: () => void;
  onDragStart: (taskId: string) => void;
}

export function TaskBoardCard({ task, onOpen, onDragStart }: TaskBoardCardProps) {
  const due = formatDueDate(task.dueDate);
  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(`${task.dueDate}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <button
      type="button"
      draggable
      onClick={onOpen}
      onDragStart={() => onDragStart(task.id)}
      className="group w-full rounded-xl border border-border/50 bg-card/80 p-3 text-left shadow-sm transition-all hover:border-primary/40 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className={cn("text-sm font-medium leading-snug", task.status === "done" && "text-muted-foreground line-through")}>
              {task.title}
            </p>
            {task.createdBy === "ai" || task.source === "ai" ? (
              <Bot className="h-3.5 w-3.5 shrink-0 text-violet-400" />
            ) : null}
          </div>

          {task.description && (
            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className={cn("border text-[10px]", priorityClasses[task.priority])}>
              {priorityLabels[task.priority]}
            </Badge>
            {due && (
              <span className={cn("inline-flex items-center gap-1 text-[11px]", isOverdue ? "text-red-400" : "text-muted-foreground")}>
                <CalendarDays className="h-3 w-3" />
                {due}
              </span>
            )}
            {task.estimateMinutes ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="h-3 w-3" />
                {task.estimateMinutes}m
              </span>
            ) : null}
            {task.assigneeName ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                <UserRound className="h-3 w-3" />
                {task.assigneeName}
              </span>
            ) : null}
          </div>

          {task.labels && task.labels.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.labels.slice(0, 4).map((label) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Tag className="h-2.5 w-2.5" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { PlanningTask } from "@/types/planning";
import { Bot, CalendarDays, Clock, GitBranch, GripVertical, UserRound } from "lucide-react";

const priorityDot: Record<PlanningTask["priority"], string> = {
  high:   "bg-red-500",
  medium: "bg-amber-400",
  low:    "bg-sky-400",
};

const priorityLabel: Record<PlanningTask["priority"], string> = {
  high:   "Alta",
  medium: "Media",
  low:    "Baja",
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
  if (diff < 0) return `Hace ${Math.abs(diff)}d`;
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

  const hasSubtasks = false; // subtask count requires allTasks — shown in modal

  return (
    <button
      type="button"
      draggable
      onClick={onOpen}
      onDragStart={() => onDragStart(task.id)}
      className="group w-full rounded-xl border border-border/50 bg-card/80 p-3 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      {/* Top row: issue key + AI badge + drag handle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {task.issueKey && (
            <span className="font-mono text-[10px] text-muted-foreground/60 font-medium">
              {task.issueKey}
            </span>
          )}
          {(task.createdBy === "ai" || task.source === "ai") && (
            <Bot className="h-3 w-3 text-violet-400/70" />
          )}
        </div>
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
      </div>

      {/* Title */}
      <p
        className={cn(
          "text-sm font-medium leading-snug mb-2",
          task.status === "done" && "text-muted-foreground line-through"
        )}
      >
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground mb-2">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded-full bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] text-primary/70"
            >
              {label}
            </span>
          ))}
          {task.labels.length > 3 && (
            <span className="rounded-full bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: metadata chips */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
        {/* Priority dot */}
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <span className={cn("w-2 h-2 rounded-full shrink-0", priorityDot[task.priority])} />
          {priorityLabel[task.priority]}
        </span>

        {due && (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px]",
              isOverdue ? "text-red-400 font-medium" : "text-muted-foreground"
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {due}
          </span>
        )}

        {task.estimateMinutes ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {task.estimateMinutes}m
          </span>
        ) : null}

        {task.assigneeName ? (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <UserRound className="h-3 w-3" />
            {task.assigneeName}
          </span>
        ) : null}
      </div>
    </button>
  );
}

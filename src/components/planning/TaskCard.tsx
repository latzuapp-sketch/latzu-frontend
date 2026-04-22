"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlanningTask } from "@/types/planning";
import {
  CheckCircle2,
  Circle,
  Clock,
  CalendarDays,
  Trash2,
  ExternalLink,
  Loader2,
  BookOpen,
  Bell,
  ArrowUpCircle,
  Brain,
  FileText,
  CheckSquare,
  Play,
  Code,
} from "lucide-react";
import type { TaskCategory } from "@/types/planning";

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig = {
  todo: {
    label: "Pendiente",
    icon: Circle,
    classes: "text-muted-foreground",
    ring: "",
  },
  in_progress: {
    label: "En progreso",
    icon: Clock,
    classes: "text-amber-400",
    ring: "ring-1 ring-amber-500/30",
  },
  done: {
    label: "Hecho",
    icon: CheckCircle2,
    classes: "text-emerald-500",
    ring: "ring-1 ring-emerald-500/30",
  },
};

const priorityConfig = {
  high: { label: "Alta", classes: "text-red-400 border-red-500/30 bg-red-500/10" },
  medium: { label: "Media", classes: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  low: { label: "Baja", classes: "text-sky-400 border-sky-500/30 bg-sky-500/10" },
};

const categoryIcons: Record<TaskCategory, typeof ArrowUpCircle> = {
  task:      ArrowUpCircle,
  lesson:    BookOpen,
  reminder:  Bell,
  flashcard: Brain,
  reading:   FileText,
  quiz:      CheckSquare,
  video:     Play,
  practice:  Code,
};

function formatDueDate(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${-diff} días`;
  return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
};

// ── Component ─────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: PlanningTask;
  onStatusChange: (status: PlanningTask["status"]) => void;
  onDelete: () => void;
  onPushToCalendar?: () => Promise<void>;
  canPushToCalendar?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onPushToCalendar,
  canPushToCalendar,
  compact = false,
}: TaskCardProps) {
  const [pushing, setPushing] = useState(false);
  const [justPushed, setJustPushed] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const status = statusConfig[task.status];
  const priority = priorityConfig[task.priority];
  const CatIcon = categoryIcons[task.category] ?? ArrowUpCircle;
  const StatusIcon = status.icon;

  const dueDateStr = formatDueDate(task.dueDate);
  const isOverdue =
    task.dueDate &&
    task.status !== "done" &&
    new Date(task.dueDate + "T00:00:00") < new Date(new Date().setHours(0, 0, 0, 0));

  const handlePush = async () => {
    if (!onPushToCalendar || pushing || justPushed) return;
    setPushing(true);
    await onPushToCalendar();
    setPushing(false);
    setJustPushed(true);
    setTimeout(() => setJustPushed(false), 3000);
  };

  const cycleStatus = () => {
    const next: Record<PlanningTask["status"], PlanningTask["status"]> = {
      todo: "in_progress",
      in_progress: "done",
      done: "todo",
    };
    onStatusChange(next[task.status]);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group rounded-xl border transition-all",
        task.status === "done"
          ? "border-border/30 bg-muted/20 opacity-60"
          : "border-border/50 bg-card/70 hover:border-border",
        status.ring,
        compact ? "p-2.5" : "p-4"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Status toggle */}
        <button
          onClick={cycleStatus}
          title={`Estado: ${status.label}`}
          className={cn(
            "mt-0.5 shrink-0 transition-transform hover:scale-110 p-0.5 -m-0.5 rounded",
            status.classes
          )}
        >
          <StatusIcon className={compact ? "w-4 h-4" : "w-5 h-5"} />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium leading-snug",
              compact ? "text-xs" : "text-sm",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>

          {!compact && task.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center flex-wrap gap-2 mt-1.5">
            {/* Due date */}
            {dueDateStr && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  isOverdue ? "text-red-400" : "text-muted-foreground"
                )}
              >
                <CalendarDays className="w-3 h-3" />
                {dueDateStr}
                {task.dueTime && (
                  <span className="flex items-center gap-0.5">
                    <Clock className="w-3 h-3" />
                    {task.dueTime}
                  </span>
                )}
              </span>
            )}

            {/* Category */}
            {!compact && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <CatIcon className="w-3 h-3" />
              </span>
            )}

            {/* Priority */}
            {!compact && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded-full border font-medium",
                  priority.classes
                )}
              >
                {priority.label}
              </span>
            )}

            {/* GCal synced */}
            {task.googleEventId && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {compact ? "" : "Calendar"}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {!compact && (
          <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
            {canPushToCalendar && !task.googleEventId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePush}
                disabled={pushing || justPushed || !task.dueDate}
                title="Añadir a Google Calendar"
                className="h-8 w-8 md:h-7 md:w-7 p-0 text-muted-foreground hover:text-blue-400"
              >
                {pushing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : justPushed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <CalendarDays className="w-3.5 h-3.5" />
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirmDel) { setConfirmDel(true); return; }
                onDelete();
              }}
              onBlur={() => setConfirmDel(false)}
              title={confirmDel ? "Confirmar eliminación" : "Eliminar"}
              className={cn(
                "h-8 w-8 md:h-7 md:w-7 p-0 transition-colors",
                confirmDel
                  ? "text-destructive hover:text-destructive"
                  : "text-muted-foreground hover:text-destructive"
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

/**
 * BrainNoteCard / BrainTaskCard / BrainPageCard
 *
 * Visual variants for the non-knowledge content the brain holds:
 * notes (Google-Keep style), tasks (with status + priority), and
 * workspace pages (Notion-like document chips).
 */

import { motion } from "framer-motion";
import {
  StickyNote, ListTodo, FileText, CheckCircle2, Circle, Clock,
  Pin, Layers, Target, Sparkles, AlertTriangle,
} from "lucide-react";
import type { Flashcard } from "@/types/flashcards";
import type { PlanningTask, ABCDEPriority, TaskStatus, ActionPlan } from "@/types/planning";
import type { WorkspaceDoc } from "@/types/workspace";
import type { PlanHealth, PlanHealthStatus } from "@/graphql/types";
import { NOTE_COLORS } from "@/types/flashcards";
import { cn } from "@/lib/utils";

// ─── Note card ───────────────────────────────────────────────────────────────

interface NoteCardProps {
  note: Flashcard;
  isSelected?: boolean;
  onClick: () => void;
  onToggleStatus?: (noteId: string) => void;
}

const NOTE_BG: Record<string, string> = Object.fromEntries(
  NOTE_COLORS.map((c) => [c.value, c.bg])
);

export function BrainNoteCard({ note, isSelected, onClick }: NoteCardProps) {
  const bg = NOTE_BG[note.color] ?? "bg-yellow-500/5";
  const labels = (() => {
    try {
      return JSON.parse(note.labels) as string[];
    } catch {
      return [];
    }
  })();

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border p-3 transition-all",
        bg,
        isSelected
          ? "border-yellow-500/60 ring-1 ring-yellow-500/40"
          : "border-yellow-500/20 hover:border-yellow-500/40"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <StickyNote className="w-3 h-3 text-yellow-300" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-300 flex-1">
          Nota
        </span>
        {note.pinned && <Pin className="w-3 h-3 text-yellow-300" fill="currentColor" />}
      </div>
      <p className="text-sm font-semibold leading-snug line-clamp-2">{note.front || "Sin título"}</p>
      {note.back && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-3 whitespace-pre-line">
          {note.back}
        </p>
      )}
      {labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {labels.slice(0, 3).map((l) => (
            <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-500/15 text-yellow-200/80">
              {l}
            </span>
          ))}
        </div>
      )}
    </motion.button>
  );
}

// ─── Task card ───────────────────────────────────────────────────────────────

interface TaskCardProps {
  task: PlanningTask;
  isSelected?: boolean;
  onClick: () => void;
  onToggle?: (taskId: string, nextStatus: TaskStatus) => void;
}

const ABCDE_BADGE: Record<ABCDEPriority, string> = {
  A: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  B: "bg-orange-500/20 text-orange-300 border-orange-500/40",
  C: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  D: "bg-muted text-muted-foreground border-border/50",
  E: "bg-muted/40 text-muted-foreground/60 border-border/30",
};

const STATUS_ICON: Record<TaskStatus, React.ElementType> = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
};

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: "text-muted-foreground/60",
  in_progress: "text-amber-400",
  done: "text-emerald-400",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / 86_400_000);
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays === -1) return "Ayer";
    if (diffDays < 0) return `Hace ${Math.abs(diffDays)}d`;
    if (diffDays < 7) return `En ${diffDays}d`;
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return iso;
  }
}

export function BrainTaskCard({ task, isSelected, onClick, onToggle }: TaskCardProps) {
  const StatusIcon = STATUS_ICON[task.status];
  const due = formatDate(task.dueDate);
  const isOverdue = task.dueDate && task.status !== "done" && new Date(task.dueDate + "T00:00:00") < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border p-3 transition-all cursor-pointer bg-card/50 hover:bg-card/80",
        isSelected ? "border-primary/60" : "border-border/40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.(task.id, task.status === "done" ? "todo" : "done");
          }}
          className={cn("mt-0.5 shrink-0 transition-colors", STATUS_COLOR[task.status], "hover:text-emerald-400")}
          title={task.status === "done" ? "Marcar como pendiente" : "Marcar como hecha"}
        >
          <StatusIcon className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <ListTodo className="w-3 h-3 text-primary/70" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Tarea</span>
            {task.abcdePriority && (
              <span className={cn("text-[9px] font-bold px-1 py-0 rounded border", ABCDE_BADGE[task.abcdePriority])}>
                {task.abcdePriority}
              </span>
            )}
          </div>
          <p className={cn(
            "text-sm font-semibold leading-snug line-clamp-2",
            task.status === "done" && "line-through text-muted-foreground/60"
          )}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
              {task.description}
            </p>
          )}
          {due && (
            <p className={cn(
              "text-[10px] mt-1.5",
              isOverdue ? "text-rose-400" : "text-muted-foreground/60"
            )}>
              {isOverdue ? "Atrasada · " : ""}{due}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page card ───────────────────────────────────────────────────────────────

interface PageCardProps {
  workspace: WorkspaceDoc;
  onClick: () => void;
}

export function BrainPageCard({ workspace, onClick }: PageCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-primary/30 transition-all p-3 flex items-start gap-3"
    >
      <div className="w-10 h-12 rounded border border-border/50 bg-muted/30 flex items-center justify-center text-lg shrink-0">
        {workspace.icon || <FileText className="w-4 h-4 text-muted-foreground" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <Layers className="w-3 h-3 text-primary/70" />
          <span className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Space</span>
        </div>
        <p className="text-sm font-semibold leading-snug line-clamp-2">{workspace.title}</p>
        {workspace.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
            {workspace.description}
          </p>
        )}
      </div>
    </motion.button>
  );
}

// ─── Plan card ───────────────────────────────────────────────────────────────

interface PlanCardProps {
  plan: ActionPlan;
  health?: PlanHealth | null;
  onClick: () => void;
}

const PLAN_HEALTH_META: Record<PlanHealthStatus, { label: string; color: string; barColor: string; Icon: React.ElementType }> = {
  on_track:  { label: "Al día",        color: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30", barColor: "bg-emerald-500", Icon: CheckCircle2 },
  at_risk:   { label: "En riesgo",     color: "text-amber-300 bg-amber-500/10 border-amber-500/30",       barColor: "bg-amber-500",   Icon: AlertTriangle },
  derailing: { label: "Descarrilando", color: "text-rose-300 bg-rose-500/10 border-rose-500/30",          barColor: "bg-rose-500",    Icon: AlertTriangle },
  abandoned: { label: "Abandonado",    color: "text-muted-foreground bg-muted/40 border-border/40",       barColor: "bg-muted",       Icon: AlertTriangle },
};

export function BrainPlanCard({ plan, health, onClick }: PlanCardProps) {
  const completion = health?.completionPct ?? 0;
  const healthMeta = health?.status ? PLAN_HEALTH_META[health.status] : null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-border/40 bg-card/50 hover:bg-card/80 hover:border-emerald-500/40 transition-all overflow-hidden"
    >
      {/* Top accent: gradient bar showing it's an active plan */}
      <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="p-3.5 space-y-2.5">
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Target className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                {plan.type === "study" ? "Plan de estudio" : "Plan"}
              </span>
              {plan.aiGenerated && (
                <span className="inline-flex items-center gap-0.5 text-[9px] text-violet-300/80">
                  <Sparkles className="w-2.5 h-2.5" /> con IA
                </span>
              )}
            </div>
            <p className="text-sm font-semibold leading-snug line-clamp-2">{plan.title}</p>
            {plan.goal && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1 line-clamp-2">
                {plan.goal}
              </p>
            )}
          </div>
        </div>

        {/* Progress + health */}
        {health && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground">
                {health.doneTasks} / {health.totalTasks} tareas
              </span>
              <span className="font-medium text-foreground/80">{Math.round(completion)}%</span>
            </div>
            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn("h-full transition-all duration-500", healthMeta?.barColor ?? "bg-primary")}
                style={{ width: `${Math.max(2, Math.min(100, completion))}%` }}
              />
            </div>
            {healthMeta && (
              <div className="flex items-center justify-between gap-2">
                <span className={cn("inline-flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded border", healthMeta.color)}>
                  <healthMeta.Icon className="w-2.5 h-2.5" />
                  {healthMeta.label}
                </span>
                {plan.dueDate && (
                  <span className="text-[10px] text-muted-foreground/70">
                    vence {new Date(plan.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.button>
  );
}

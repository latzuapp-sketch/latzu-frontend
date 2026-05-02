"use client";

/**
 * TaskViewer — opens a PlanningTask in the center pane of /brain.
 *
 * Live edit on title, description, status, due date, ABCDE priority.
 * Uses useTasks().updateTask + setStatus.
 */

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Circle, Clock, Loader2 } from "lucide-react";
import { useTasks } from "@/hooks/usePlanning";
import type { PlanningTask, TaskStatus, ABCDEPriority } from "@/types/planning";
import { cn } from "@/lib/utils";

const STATUS_META: Record<TaskStatus, { label: string; Icon: React.ElementType; color: string }> = {
  todo:        { label: "Pendiente", Icon: Circle,         color: "text-muted-foreground" },
  in_progress: { label: "En curso",  Icon: Clock,          color: "text-amber-400" },
  done:        { label: "Hecha",     Icon: CheckCircle2,   color: "text-emerald-400" },
};

const ABCDE_BADGE: Record<ABCDEPriority, string> = {
  A: "bg-rose-500/15 text-rose-300 border-rose-500/40",
  B: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  C: "bg-amber-500/15 text-amber-300 border-amber-500/40",
  D: "bg-muted text-muted-foreground border-border/50",
  E: "bg-muted/40 text-muted-foreground/60 border-border/30",
};
const ABCDE_VALUES: ABCDEPriority[] = ["A", "B", "C", "D", "E"];

interface TaskViewerProps {
  task: PlanningTask;
}

export function TaskViewer({ task: initialTask }: TaskViewerProps) {
  const { updateTask, setStatus } = useTasks();

  const [title, setTitle] = useState(initialTask.title);
  const [description, setDescription] = useState(initialTask.description ?? "");
  const [status, setStatusLocal] = useState<TaskStatus>(initialTask.status);
  const [dueDate, setDueDate] = useState(initialTask.dueDate ?? "");
  const [priority, setPriority] = useState<ABCDEPriority | undefined>(initialTask.abcdePriority);

  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setTitle(initialTask.title);
    setDescription(initialTask.description ?? "");
    setStatusLocal(initialTask.status);
    setDueDate(initialTask.dueDate ?? "");
    setPriority(initialTask.abcdePriority);
  }, [initialTask.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  const queueSave = (patch: Parameters<typeof updateTask>[1]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving("saving");
    debounceRef.current = setTimeout(async () => {
      await updateTask(initialTask.id, patch);
      setSaving("saved");
      setTimeout(() => setSaving((s) => (s === "saved" ? "idle" : s)), 1200);
    }, 600);
  };

  const onTitle = (v: string) => { setTitle(v); queueSave({ title: v }); };
  const onDescription = (v: string) => { setDescription(v); queueSave({ description: v }); };
  const onDue = (v: string) => { setDueDate(v); queueSave({ dueDate: v || null }); };
  const onPriority = (p: ABCDEPriority) => {
    const next = priority === p ? undefined : p;
    setPriority(next);
    queueSave({ abcdePriority: next });
  };
  const onStatus = (s: TaskStatus) => {
    setStatusLocal(s);
    setStatus(initialTask.id, s);
    setSaving("saved");
    setTimeout(() => setSaving((cur) => (cur === "saved" ? "idle" : cur)), 1200);
  };

  return (
    <div className="rounded-2xl border border-border/50 bg-card/40 p-6 space-y-5">
      {/* Title */}
      <input
        value={title}
        onChange={(e) => onTitle(e.target.value)}
        placeholder="Título de la tarea"
        className="w-full bg-transparent text-2xl font-heading font-bold leading-snug outline-none placeholder:text-muted-foreground/40"
      />

      {/* Status pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(Object.keys(STATUS_META) as TaskStatus[]).map((s) => {
          const meta = STATUS_META[s];
          const active = status === s;
          const Icon = meta.Icon;
          return (
            <button
              key={s}
              onClick={() => onStatus(s)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors",
                active
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Icon className={cn("w-3 h-3", active ? "" : meta.color)} />
              {meta.label}
            </button>
          );
        })}

        <span className="ml-auto text-[10px] flex items-center gap-1.5 text-muted-foreground">
          {saving === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Guardando…</>}
          {saving === "saved" && <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Guardado</>}
        </span>
      </div>

      {/* Meta row */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
            Vence
          </p>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => onDue(e.target.value)}
            className="w-full bg-transparent border border-border/40 rounded-md px-2.5 py-1.5 text-xs outline-none focus:border-primary/40"
          />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
            Prioridad ABCDE
          </p>
          <div className="flex items-center gap-1">
            {ABCDE_VALUES.map((p) => (
              <button
                key={p}
                onClick={() => onPriority(p)}
                className={cn(
                  "w-7 h-7 rounded-md text-xs font-bold border transition-all",
                  priority === p
                    ? ABCDE_BADGE[p] + " ring-1 ring-current"
                    : "border-border/40 text-muted-foreground/50 hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
          Notas
        </p>
        <textarea
          value={description}
          onChange={(e) => onDescription(e.target.value)}
          placeholder="Detalles, contexto, sub-pasos…"
          rows={Math.max(6, description.split("\n").length + 2)}
          className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40 border border-border/40 rounded-lg p-3 focus:border-primary/40"
        />
      </div>
    </div>
  );
}

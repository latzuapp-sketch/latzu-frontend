"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Circle, Loader, CheckCircle2, Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainTaskCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useTasks } from "@/hooks/usePlanning";
import type { PlanningTask, TaskStatus } from "@/types/planning";

const COLUMNS: { id: TaskStatus; label: string; icon: typeof Circle; accent: string }[] = [
  { id: "todo",        label: "Por hacer",    icon: Circle,        accent: "text-muted-foreground" },
  { id: "in_progress", label: "En progreso",  icon: Loader,        accent: "text-sky-400" },
  { id: "done",        label: "Hecho",        icon: CheckCircle2,  accent: "text-emerald-400" },
];

/** Tasks — three-column kanban board grouped by status. */
export default function BrainTasksPage() {
  const { tasks, loading, setStatus, refetch } = useTasks();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, PlanningTask[]> = { todo: [], in_progress: [], done: [] };
    for (const t of tasks) map[t.status].push(t);
    for (const k of Object.keys(map) as TaskStatus[]) {
      map[k].sort((a, b) => {
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      });
    }
    return map;
  }, [tasks]);

  const open = (task: PlanningTask) => setViewing({ kind: "task", task });
  const toggle = (id: string, current: TaskStatus) => {
    setStatus(id, current === "done" ? "todo" : "done");
  };

  return (
    <BrainPageShell
      title="Tareas"
      subtitle="Lo que tenés que hacer, agrupado por estado"
      count={tasks.length}
      onCreated={refetch}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {loading && tasks.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay tareas. Usá el botón <span className="text-sky-300 font-medium">Tarea</span> de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {COLUMNS.map((col) => {
            const Icon = col.icon;
            const items = grouped[col.id];
            return (
              <div key={col.id} className="rounded-xl border border-border/40 bg-card/30 p-3 flex flex-col min-h-[200px]">
                <div className="flex items-center gap-2 px-1 pb-2 border-b border-border/30 mb-2">
                  <Icon className={`w-3.5 h-3.5 ${col.accent}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">{col.label}</h3>
                  <span className="ml-auto text-[10px] text-muted-foreground/60">{items.length}</span>
                </div>
                <div className="space-y-2 flex-1">
                  {items.map((t) => (
                    <BrainTaskCard
                      key={t.id}
                      task={t}
                      isSelected={viewing?.kind === "task" && viewing.task.id === t.id}
                      onClick={() => open(t)}
                      onToggle={() => toggle(t.id, t.status)}
                    />
                  ))}
                  {items.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/40 italic px-1">Sin tareas</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BrainPageShell>
  );
}

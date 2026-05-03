"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { Circle, Loader, CheckCircle2, Loader2, Plus } from "lucide-react";
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

/** Tasks — kanban + inline "Quick add" composer at top of "Por hacer". */
export default function BrainTasksPage() {
  const { tasks, loading, setStatus, createTask, refetch } = useTasks();
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
  const toggle = (id: string, current: TaskStatus) =>
    setStatus(id, current === "done" ? "todo" : "done");

  return (
    <BrainPageShell
      title="Tareas"
      subtitle="Lo que tenés que hacer, agrupado por estado"
      count={tasks.length}
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

                {col.id === "todo" && <InlineTaskCreator onCreate={async (title) => { await createTask({ title, status: "todo" }); }} />}

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
                  {items.length === 0 && col.id !== "todo" && (
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

function InlineTaskCreator({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 30); }, [open]);

  const submit = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try { await onCreate(t); setTitle(""); setOpen(false); }
    finally { setBusy(false); }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full mb-2 h-8 rounded-md border border-dashed border-sky-500/40 text-sky-300/70 hover:bg-sky-500/10 hover:text-sky-200 text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Nueva tarea
      </button>
    );
  }
  return (
    <div className="mb-2 rounded-md border border-sky-500/40 bg-sky-500/10 p-2">
      <input
        ref={ref}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
          if (e.key === "Enter") { e.preventDefault(); submit(); }
        }}
        placeholder="Título de la tarea"
        className="w-full bg-transparent text-xs outline-none placeholder:text-sky-300/40"
      />
      <div className="flex items-center justify-end gap-1.5 mt-1">
        <button onClick={() => { setOpen(false); setTitle(""); }} className="text-[10px] px-2 py-0.5 rounded text-muted-foreground hover:text-foreground">
          Esc
        </button>
        <button
          onClick={submit}
          disabled={!title.trim() || busy}
          className="text-[10px] px-2 py-0.5 rounded bg-sky-500/30 text-sky-100 hover:bg-sky-500/40 disabled:opacity-40 inline-flex items-center gap-1"
        >
          {busy ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null}
          Crear
        </button>
      </div>
    </div>
  );
}

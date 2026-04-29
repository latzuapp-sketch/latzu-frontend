"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LifeArea } from "@/types/planning";

const AREA_CONFIG: Record<LifeArea, { label: string; emoji: string; color: string; border: string; bg: string }> = {
  career:        { label: "Carrera",     emoji: "💼", color: "text-blue-400",   border: "border-blue-500/25",   bg: "from-blue-500/10 to-transparent" },
  health:        { label: "Salud",       emoji: "💪", color: "text-emerald-400", border: "border-emerald-500/25", bg: "from-emerald-500/10 to-transparent" },
  relationships: { label: "Relaciones",  emoji: "🤝", color: "text-violet-400",  border: "border-violet-500/25",  bg: "from-violet-500/10 to-transparent" },
  growth:        { label: "Crecimiento", emoji: "🧠", color: "text-amber-400",   border: "border-amber-500/25",   bg: "from-amber-500/10 to-transparent" },
};

const AREAS: LifeArea[] = ["career", "health", "relationships", "growth"];

function AreaCard({ area }: { area: LifeArea }) {
  const cfg = AREA_CONFIG[area];
  const { tasks, setStatus } = useTasks();
  const { plans } = usePlans();

  const today = new Date();

  const areaTasks = useMemo(() => {
    return tasks
      .filter((t) => t.lifeArea === area)
      .sort((a, b) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (b.status === "done" && a.status !== "done") return -1;
        const order = { A: 0, B: 1, C: 2, D: 3, E: 4, undefined: 5 };
        return (order[a.abcdePriority as keyof typeof order] ?? 5) - (order[b.abcdePriority as keyof typeof order] ?? 5);
      })
      .slice(0, 4);
  }, [tasks, area]);

  const areaPlans = useMemo(() => {
    return plans.filter((p) => p.status === "active" && (p.description?.includes(area) || p.goal?.toLowerCase().includes(cfg.label.toLowerCase()))).slice(0, 1);
  }, [plans, area, cfg.label]);

  const todayCount = useMemo(() => {
    return tasks.filter((t) => t.lifeArea === area && t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today) && t.status !== "done").length;
  }, [tasks, area, today]);

  const doneCount = areaTasks.filter(t => t.status === "done").length;
  const totalCount = tasks.filter(t => t.lifeArea === area).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-b p-4 flex flex-col gap-3 min-h-[160px]",
        cfg.border, cfg.bg
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img">{cfg.emoji}</span>
          <div>
            <p className={cn("text-xs font-bold", cfg.color)}>{cfg.label}</p>
            {totalCount > 0 && (
              <p className="text-[10px] text-muted-foreground">
                {doneCount}/{totalCount} tareas
              </p>
            )}
          </div>
        </div>
        {todayCount > 0 && (
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full border", cfg.color, cfg.border, "bg-current/10")}>
            {todayCount} hoy
          </span>
        )}
      </div>

      {/* Tasks */}
      <div className="flex-1 space-y-1.5">
        {areaTasks.length === 0 ? (
          <Link
            href="/planning"
            className="flex items-center gap-2 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
          >
            <Circle className="w-3 h-3" />
            <span>Añadir tarea en {cfg.label.toLowerCase()}…</span>
          </Link>
        ) : (
          areaTasks.map((task) => (
            <button
              key={task.id}
              onClick={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}
              className="w-full flex items-center gap-2 text-left group"
            >
              {task.status === "done"
                ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                : <Circle className={cn("w-3.5 h-3.5 shrink-0 group-hover:text-foreground transition-colors", cfg.color, "opacity-60")} />
              }
              <span className={cn(
                "text-xs truncate flex-1 transition-colors",
                task.status === "done" ? "line-through text-muted-foreground/50" : "text-foreground/80 group-hover:text-foreground"
              )}>
                {task.title}
              </span>
              {task.abcdePriority && (
                <span className={cn(
                  "shrink-0 w-3.5 h-3.5 rounded text-[8px] font-bold flex items-center justify-center",
                  task.abcdePriority === "A" ? "bg-red-500 text-white" :
                  task.abcdePriority === "B" ? "bg-orange-400 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {task.abcdePriority}
                </span>
              )}
            </button>
          ))
        )}
      </div>

      {/* Footer: active plan link */}
      {areaPlans.length > 0 && (
        <Link
          href="/plans"
          className={cn("text-[10px] flex items-center gap-1 hover:underline", cfg.color)}
        >
          <ArrowRight className="w-3 h-3" />
          {areaPlans[0].title}
        </Link>
      )}
    </motion.div>
  );
}

export function LifeAreasWidget() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Áreas de vida
        </p>
        <Link href="/planning" className="text-xs text-primary hover:underline">
          Gestionar →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {AREAS.map((area) => (
          <AreaCard key={area} area={area} />
        ))}
      </div>
    </div>
  );
}

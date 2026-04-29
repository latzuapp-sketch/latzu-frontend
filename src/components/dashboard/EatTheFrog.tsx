"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, Flame, Plus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function EatTheFrog() {
  const { tasks, loading, setStatus } = useTasks();

  const today = new Date();

  // Find today's A-priority tasks, sorted so A comes first, then todo before done
  const todayAbcde = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today))
      .filter((t) => t.abcdePriority)
      .sort((a, b) => {
        const order = { A: 0, B: 1, C: 2, D: 3, E: 4 };
        const ao = order[a.abcdePriority!] ?? 9;
        const bo = order[b.abcdePriority!] ?? 9;
        if (ao !== bo) return ao - bo;
        // todo before done
        if (a.status === "done" && b.status !== "done") return 1;
        if (b.status === "done" && a.status !== "done") return -1;
        return 0;
      });
  }, [tasks, today]);

  const frog = todayAbcde.find((t) => t.abcdePriority === "A" && t.status !== "done")
    ?? todayAbcde.find((t) => t.abcdePriority === "A");

  const remaining = todayAbcde.filter((t) => t.status !== "done").length;
  const done = todayAbcde.filter((t) => t.status === "done").length;

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/60 p-5 animate-pulse space-y-3">
        <div className="h-4 bg-muted/40 rounded w-1/3" />
        <div className="h-8 bg-muted/30 rounded w-2/3" />
        <div className="h-3 bg-muted/20 rounded w-1/2" />
      </div>
    );
  }

  if (!frog && todayAbcde.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
          🐸
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading font-bold text-sm">Come la rana primero</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Asigna prioridad A a tu tarea más importante de hoy.
          </p>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0 gap-1.5">
          <Link href="/planning">
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </Link>
        </Button>
      </div>
    );
  }

  const abcdeColor: Record<string, string> = {
    A: "from-red-500/20 to-orange-500/10 border-red-500/30",
    B: "from-orange-400/15 to-amber-400/5 border-orange-400/25",
    C: "from-amber-300/15 to-yellow-300/5 border-amber-300/25",
    D: "from-muted/20 to-muted/5 border-border/30",
    E: "from-muted/10 to-muted/5 border-border/20",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-gradient-to-br overflow-hidden",
        frog ? abcdeColor[frog.abcdePriority!] : "from-muted/20 to-muted/5 border-border/30"
      )}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl" role="img" aria-label="frog">🐸</span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Come la rana primero
            </p>
            <p className="text-xs text-muted-foreground">
              {remaining > 0
                ? `${remaining} tarea${remaining !== 1 ? "s" : ""} A-B pendiente${remaining !== 1 ? "s" : ""} hoy`
                : done > 0
                ? "¡Todas completadas! 🎉"
                : "Tu tarea más importante"}
            </p>
          </div>
        </div>
        {done > 0 && (
          <div className="flex items-center gap-1 text-xs text-emerald-400 shrink-0">
            <Flame className="w-3.5 h-3.5" />
            {done} lista{done !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Main frog task */}
      {frog && (
        <div className="px-5 pb-4">
          <button
            onClick={() => setStatus(frog.id, frog.status === "done" ? "todo" : "done")}
            className="w-full flex items-start gap-3 text-left group"
          >
            <div className={cn(
              "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              frog.status === "done"
                ? "border-emerald-500 bg-emerald-500"
                : "border-primary/60 group-hover:border-primary"
            )}>
              {frog.status === "done"
                ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                : <Circle className="w-3 h-3 text-primary/40 group-hover:text-primary" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-heading font-bold text-base leading-tight",
                frog.status === "done" && "line-through text-muted-foreground"
              )}>
                {frog.title}
              </p>
              {frog.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{frog.description}</p>
              )}
              {frog.dueTime && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {frog.dueTime}
                </p>
              )}
            </div>
            <span className="shrink-0 w-6 h-6 rounded bg-red-500 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
              {frog.abcdePriority}
            </span>
          </button>
        </div>
      )}

      {/* Secondary B-priority tasks */}
      {todayAbcde.filter(t => t.abcdePriority === "B" && t.status !== "done").slice(0, 2).length > 0 && (
        <div className="border-t border-border/20 px-5 py-2.5 space-y-1.5">
          {todayAbcde
            .filter(t => t.abcdePriority === "B" && t.status !== "done")
            .slice(0, 2)
            .map(task => (
              <button
                key={task.id}
                onClick={() => setStatus(task.id, "done")}
                className="w-full flex items-center gap-2.5 text-left group"
              >
                <div className="w-4 h-4 rounded-full border border-orange-400/60 group-hover:border-orange-400 shrink-0 transition-colors" />
                <span className="text-xs text-muted-foreground group-hover:text-foreground truncate flex-1 transition-colors">
                  {task.title}
                </span>
                <span className="shrink-0 w-4 h-4 rounded bg-orange-400 text-white text-[9px] font-bold flex items-center justify-center">
                  B
                </span>
              </button>
            ))}
        </div>
      )}
    </motion.div>
  );
}

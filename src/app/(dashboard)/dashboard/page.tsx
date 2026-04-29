"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { DailyBriefing } from "@/components/dashboard/DailyBriefing";
import { Serendipity } from "@/components/dashboard/Serendipity";
import { DailyDigest } from "@/components/dashboard/DailyDigest";
import { UserMemoryCard } from "@/components/ai/UserMemoryCard";
import { EatTheFrog } from "@/components/dashboard/EatTheFrog";
import { LifeAreasWidget } from "@/components/dashboard/LifeAreasWidget";
import { PlansSummaryWidget } from "@/components/dashboard/PlansSummaryWidget";
import { Button } from "@/components/ui/button";
import { Sparkles, CalendarDays, Brain, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { useDueCount } from "@/hooks/useFlashcards";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ABCDEPriority } from "@/types/planning";

const ABCDE_COLOR: Record<ABCDEPriority, string> = {
  A: "bg-red-500/15 text-red-400 border-red-500/25",
  B: "bg-orange-400/15 text-orange-400 border-orange-400/25",
  C: "bg-amber-300/15 text-amber-500 border-amber-300/25",
  D: "bg-muted/40 text-muted-foreground border-border/40",
  E: "bg-muted/20 text-muted-foreground/50 border-border/20",
};

function TodayABCDEList() {
  const { tasks, setStatus } = useTasks();
  const today = new Date();

  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today))
      .sort((a, b) => {
        const order = { A: 0, B: 1, C: 2, D: 3, E: 4 };
        const ao = a.abcdePriority ? (order[a.abcdePriority] ?? 9) : 9;
        const bo = b.abcdePriority ? (order[b.abcdePriority] ?? 9) : 9;
        if (ao !== bo) return ao - bo;
        if (a.status === "done" && b.status !== "done") return 1;
        if (b.status === "done" && a.status !== "done") return -1;
        return 0;
      })
      .slice(0, 8);
  }, [tasks, today]);

  const done = todayTasks.filter(t => t.status === "done").length;

  if (todayTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 p-5 text-center space-y-2">
        <CalendarDays className="w-6 h-6 mx-auto text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Sin tareas para hoy.</p>
        <Button size="sm" variant="outline" asChild className="gap-1.5">
          <Link href="/planning"><CalendarDays className="w-3.5 h-3.5" />Planear día</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 divide-y divide-border/30 overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lista del día</p>
        <span className="text-xs text-muted-foreground">{done}/{todayTasks.length}</span>
      </div>
      {todayTasks.map((task) => (
        <button
          key={task.id}
          onClick={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors text-left group"
        >
          <div className={cn(
            "w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
            task.status === "done"
              ? "border-emerald-500 bg-emerald-500"
              : "border-border group-hover:border-primary"
          )}>
            {task.status === "done" && <span className="text-white text-[8px]">✓</span>}
          </div>
          <span className={cn(
            "flex-1 text-sm truncate transition-colors",
            task.status === "done" ? "line-through text-muted-foreground/50" : "text-foreground/90"
          )}>
            {task.title}
          </span>
          {task.abcdePriority && (
            <span className={cn(
              "shrink-0 w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center border",
              ABCDE_COLOR[task.abcdePriority]
            )}>
              {task.abcdePriority}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const isGuest = useIsGuest();
  const isMobile = useIsMobile();
  const { tasks } = useTasks();
  const { plans } = usePlans();
  const dueFlashcards = useDueCount();

  const today = new Date();
  const todayPending = useMemo(() => {
    return tasks.filter(
      (t) => t.status !== "done" && t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today)
    ).length;
  }, [tasks, today]);

  const activePlanCount = useMemo(
    () => plans.filter((p) => p.status === "active").length,
    [plans]
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = isGuest
    ? "Invitado"
    : session?.user?.name?.split(" ")[0] || "Usuario";

  const dateStr = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5 max-w-7xl">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-bold">
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 capitalize">{dateStr}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isGuest && dueFlashcards > 0 && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/notes/review">
                <Brain className="w-3.5 h-3.5" />
                {dueFlashcards} repasar
              </Link>
            </Button>
          )}
          {!isGuest && activePlanCount > 0 && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/plans">
                <TrendingUp className="w-3.5 h-3.5" />
                {activePlanCount} meta{activePlanCount !== 1 ? "s" : ""}
              </Link>
            </Button>
          )}
          <Button asChild className="gap-1.5">
            <Link href="/chat">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">IA Mentor</span>
              <span className="sm:hidden">IA</span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* ── Mobile quick stats ── */}
      {!isGuest && isMobile && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hoy", value: todayPending, href: "/planning" },
            { label: "Notas", value: dueFlashcards, href: "/notes/review" },
            { label: "Metas", value: activePlanCount, href: "/plans" },
          ].map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-center hover:border-primary/40 transition-colors"
            >
              <p className="text-xl font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </Link>
          ))}
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Left column (2/3) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Come la rana */}
          {!isGuest && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}>
              <EatTheFrog />
            </motion.div>
          )}

          {/* Lista del día */}
          {!isGuest && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
              <TodayABCDEList />
            </motion.div>
          )}

          {/* 4 Áreas de vida */}
          {!isGuest && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
              <LifeAreasWidget />
            </motion.div>
          )}

          {isGuest && (
            <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 mx-auto text-primary/40" />
              <p className="font-heading font-bold">Organiza tu vida con Latzu</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Crea una cuenta para acceder al sistema ABCDE, las 4 áreas de vida y tu mentor IA personal.
              </p>
              <Button asChild><Link href="/register">Comenzar gratis</Link></Button>
            </div>
          )}
        </div>

        {/* ── Right column (1/3) ── */}
        {!isGuest && (
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}>
              <DailyBriefing />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>
              <PlansSummaryWidget />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
              <Serendipity />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}>
              <DailyDigest />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }}>
              <UserMemoryCard />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

/**
 * Dashboard ("Hoy") — 4 ordered zones:
 *   1. Hero strip: greeting + your encyclopedia stats this week
 *   2. Focus card: agent's currentFocus large + 3 contextual actions
 *   3. Two columns: ABCDE/Frog (left) + Agent mini feed (right)
 *   4. Bottom strip: due flashcards + serendipity
 */

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Sparkles, CalendarDays, Brain, TrendingUp, Bot, Plus,
  ArrowRight, Target, Library, MessageSquare,
} from "lucide-react";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { useDueCount } from "@/hooks/useFlashcards";
import { useUserModel, useAgentActions } from "@/hooks/useOrganizerAgent";
import { Button } from "@/components/ui/button";
import { EatTheFrog } from "@/components/dashboard/EatTheFrog";
import { Serendipity } from "@/components/dashboard/Serendipity";
import { cn } from "@/lib/utils";
import type { ABCDEPriority } from "@/types/planning";
import type { AgentAction, AgentActionType } from "@/graphql/types";

// ─── ABCDE list (kept from previous dashboard, lightly tweaked) ──────────────

const ABCDE_COLOR: Record<ABCDEPriority, string> = {
  A: "bg-red-500/15 text-red-400 border-red-500/25",
  B: "bg-orange-400/15 text-orange-400 border-orange-400/25",
  C: "bg-amber-300/15 text-amber-500 border-amber-300/25",
  D: "bg-muted/40 text-muted-foreground border-border/40",
  E: "bg-muted/20 text-muted-foreground/50 border-border/20",
};

function TodayList() {
  const { tasks, setStatus } = useTasks();
  const today = new Date();

  const todayTasks = useMemo(
    () =>
      tasks
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
        .slice(0, 8),
    [tasks, today]
  );

  const done = todayTasks.filter((t) => t.status === "done").length;

  if (todayTasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 bg-card/40 p-5 text-center space-y-2">
        <CalendarDays className="w-6 h-6 mx-auto text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">Sin tareas para hoy.</p>
        <Button size="sm" variant="outline" asChild className="gap-1.5">
          <Link href="/planning">
            <CalendarDays className="w-3.5 h-3.5" />
            Planear día
          </Link>
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

// ─── Focus card (Zone 2): the agent's current focus, big and clear ───────────

const FOCUS_ACTION_ICON: Partial<Record<AgentActionType, React.ElementType>> = {
  reminder: Sparkles,
  insight: Sparkles,
  warning: Sparkles,
  suggestion: Sparkles,
  nudge: Sparkles,
  clarification_question: MessageSquare,
};

function FocusCard() {
  const { userModel, loading: modelLoading } = useUserModel();
  const { actions } = useAgentActions({ status: "pending", limit: 5 });

  // Top proposal that requires action
  const topProposal = useMemo(
    () => actions.find((a) => a.visibility !== "silent" && a.type !== "clarification_question"),
    [actions]
  );

  if (modelLoading && !userModel) {
    return <div className="rounded-2xl border border-border/40 bg-card/40 p-6 h-32 animate-pulse" />;
  }

  if (!userModel?.currentFocus) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tirá algunas cosas a tu enciclopedia y conversá un rato. En unos días el agente te dirá qué importa hoy.
        </p>
        <Button size="sm" variant="outline" asChild className="gap-1.5">
          <Link href="/agent">
            <Bot className="w-3.5 h-3.5" />
            Ver agente
          </Link>
        </Button>
      </div>
    );
  }

  const ActionIcon = topProposal ? (FOCUS_ACTION_ICON[topProposal.type] ?? Sparkles) : null;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-violet-500/[0.04] to-transparent p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-1">
            Tu agente sugiere enfocarte en
          </p>
          <p className="text-base sm:text-lg font-medium leading-snug">{userModel.currentFocus}</p>
        </div>
      </div>

      {topProposal && ActionIcon && (
        <Link
          href="/agent"
          className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-card/60 border border-border/40 hover:border-primary/30 transition-colors group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <ActionIcon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold leading-tight">{topProposal.title}</p>
            {topProposal.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{topProposal.description}</p>
            )}
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-1 group-hover:text-primary transition-colors" />
        </Link>
      )}
    </div>
  );
}

// ─── Agent mini feed (Zone 3 right) ──────────────────────────────────────────

const FEED_ICON: Partial<Record<AgentActionType, React.ElementType>> = {
  link_nodes: Sparkles,
  merge_nodes: Brain,
  create_synthesis_node: Sparkles,
  surface_connection: Brain,
  archive_stale: Brain,
  tag_node: Sparkles,
  create_workspace_page: Plus,
  create_life_area: Target,
};

function AgentMiniFeed() {
  const { actions, loading } = useAgentActions({ status: "applied", limit: 6 });

  if (loading && actions.length === 0) {
    return <div className="rounded-2xl border border-border/40 bg-card/40 p-5 h-40 animate-pulse" />;
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden">
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-border/30">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Bot className="w-3 h-3 text-primary" />
          Tu agente, en silencio
        </p>
        <Link href="/agent" className="text-[10px] text-primary hover:text-primary/80">
          Ver todo →
        </Link>
      </div>
      {actions.length === 0 ? (
        <div className="p-5 text-center">
          <p className="text-xs text-muted-foreground">Tu agente todavía no aplicó cambios autónomos.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/30">
          {actions.slice(0, 6).map((a: AgentAction) => {
            const Icon = FEED_ICON[a.type] ?? Sparkles;
            return (
              <li key={a.id} className="px-4 py-2.5 flex items-start gap-2.5">
                <Icon className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80 leading-snug line-clamp-2">{a.title}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session } = useSession();
  const isGuest = useIsGuest();
  const isMobile = useIsMobile();
  const { tasks } = useTasks();
  const { plans } = usePlans();
  const dueFlashcards = useDueCount();

  const today = new Date();
  const todayPending = useMemo(
    () =>
      tasks.filter(
        (t) => t.status !== "done" && t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today)
      ).length,
    [tasks, today]
  );
  const activePlanCount = useMemo(() => plans.filter((p) => p.status === "active").length, [plans]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  })();

  const firstName = isGuest
    ? "Invitado"
    : session?.user?.name?.split(" ")[0] || "Usuario";

  const dateStr = today.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="space-y-5 max-w-7xl">
      {/* ── Zone 1: Greeting strip ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-start justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-heading font-bold">
            {greeting}, {firstName}
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
              <Link href="/planning">
                <TrendingUp className="w-3.5 h-3.5" />
                {activePlanCount} meta{activePlanCount !== 1 ? "s" : ""}
              </Link>
            </Button>
          )}
          <Button asChild className="gap-1.5">
            <Link href="/chat">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
              <span className="sm:hidden">IA</span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Mobile quick stats */}
      {!isGuest && isMobile && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Hoy", value: todayPending, href: "/planning" },
            { label: "Repasos", value: dueFlashcards, href: "/notes/review" },
            { label: "Metas", value: activePlanCount, href: "/planning" },
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

      {!isGuest ? (
        <>
          {/* ── Zone 2: Focus card (full width) ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          >
            <FocusCard />
          </motion.div>

          {/* ── Zone 3: ABCDE/Frog left, Agent feed right ────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              >
                <EatTheFrog />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
              >
                <TodayList />
              </motion.div>
            </div>

            <div className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
              >
                <AgentMiniFeed />
              </motion.div>

              {/* Quick links to Encyclopedia + Agent */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                className="grid grid-cols-2 gap-2"
              >
                <Link
                  href="/brain"
                  className="rounded-xl border border-border/40 bg-card/40 p-3 hover:border-primary/30 transition-colors flex flex-col items-start gap-1.5"
                >
                  <Library className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold">Enciclopedia</p>
                  <p className="text-[10px] text-muted-foreground">Todo lo que sabés</p>
                </Link>
                <Link
                  href="/agent"
                  className="rounded-xl border border-border/40 bg-card/40 p-3 hover:border-primary/30 transition-colors flex flex-col items-start gap-1.5"
                >
                  <Bot className="w-4 h-4 text-primary" />
                  <p className="text-xs font-semibold">Agente</p>
                  <p className="text-[10px] text-muted-foreground">Lo que sabe de vos</p>
                </Link>
              </motion.div>
            </div>
          </div>

          {/* ── Zone 4: Serendipity strip ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
          >
            <Serendipity />
          </motion.div>
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center space-y-3">
          <Sparkles className="w-10 h-10 mx-auto text-primary/40" />
          <p className="font-heading font-bold">Empezá tu enciclopedia personal</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Creá una cuenta para tirar tus notas, libros, links y dejar que la IA arme tu segundo cerebro.
          </p>
          <Button asChild>
            <Link href="/register">Comenzar gratis</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

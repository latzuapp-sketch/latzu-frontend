"use client";

/**
 * /agent — the agent's page.
 *
 * Three sections:
 *  1. "Lo que sé de ti"     — UserContext snapshot: focus, life areas, goals, blockers, frontier
 *  2. "Lo que hice"         — feed of applied agent actions, grouped by day
 *  3. "Lo que te propongo"  — pending actions with approve/dismiss buttons
 *
 * Plus a "Pensar de nuevo" button to trigger a fresh deep reflection.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Bot, Sparkles, Target, AlertTriangle, Compass, RefreshCw,
  CheckCircle2, X, Loader2, Brain, ArrowUpRight,
  Layers, Tag, Link2, Trash2, Network, Plus, Zap,
} from "lucide-react";
import { useUserModel, useAgentActions, useActionMutations } from "@/hooks/useOrganizerAgent";
import type { AgentAction, AgentActionType } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

const ACTION_ICON: Partial<Record<AgentActionType, React.ElementType>> = {
  tag_node: Tag,
  link_nodes: Link2,
  merge_nodes: Layers,
  create_synthesis_node: Sparkles,
  create_workspace: Plus,
  create_workspace_page: Plus,
  move_to_workspace: ArrowUpRight,
  surface_connection: Network,
  archive_stale: Trash2,
  create_life_area: Compass,
  link_to_life_area: Compass,
  build_hierarchy: Network,
  update_task_priority: Zap,
  update_task_due: Zap,
  deprecate_node: Trash2,
  reminder: Sparkles,
  insight: Sparkles,
  warning: AlertTriangle,
  milestone: CheckCircle2,
  suggestion: Sparkles,
  nudge: Sparkles,
  celebration: CheckCircle2,
  redirect: AlertTriangle,
  clarification_question: Sparkles,
};

const RISK_STYLE: Record<string, { label: string; cls: string }> = {
  low: { label: "Bajo riesgo", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  medium: { label: "Riesgo medio", cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  high: { label: "Riesgo alto", cls: "text-rose-400 bg-rose-500/10 border-rose-500/30" },
};

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const isSame = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (isSame(d, today)) return "Hoy";
  if (isSame(d, yest)) return "Ayer";
  return d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Section 1: What the agent knows about you ───────────────────────────────

function KnowsAboutYouSection() {
  const { userModel, loading } = useUserModel();

  const lifeAreas = useMemo(
    () => safeJsonArray<{ name: string; description?: string; strength?: number }>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );
  const longTermGoals = useMemo(() => safeJsonArray<string>(userModel?.longTermGoals), [userModel?.longTermGoals]);
  const blockers = useMemo(() => safeJsonArray<string>(userModel?.blockers), [userModel?.blockers]);
  const frontier = useMemo(() => safeJsonArray<string>(userModel?.knowledgeFrontier), [userModel?.knowledgeFrontier]);
  const patterns = useMemo(() => safeJsonArray<string>(userModel?.behaviorPatterns), [userModel?.behaviorPatterns]);
  const momentum = useMemo(() => safeJsonArray<string>(userModel?.momentumTopics), [userModel?.momentumTopics]);

  if (loading && !userModel) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/40 p-6 animate-pulse">
        <div className="h-4 w-40 bg-muted/40 rounded mb-3" />
        <div className="h-3 w-full bg-muted/30 rounded mb-2" />
        <div className="h-3 w-2/3 bg-muted/30 rounded" />
      </div>
    );
  }

  if (!userModel) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-8 text-center space-y-2">
        <Brain className="w-8 h-8 mx-auto text-muted-foreground/40" />
        <p className="text-sm font-medium">Tu agente todavía no tiene un modelo de vos.</p>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          Tirá algunas cosas a tu enciclopedia y conversá un rato. En unos días empezará a entender cómo pensás.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current focus — hero */}
      {userModel.currentFocus && (
        <div className="rounded-2xl p-5 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent border border-primary/20">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/80 mb-1.5">
            Foco actual
          </p>
          <p className="text-base font-medium leading-snug">{userModel.currentFocus}</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {longTermGoals.length > 0 && (
          <KnowsCard icon={Target} title="Metas de largo plazo" items={longTermGoals} color="text-violet-400" />
        )}
        {lifeAreas.length > 0 && (
          <KnowsCard
            icon={Compass}
            title="Áreas de vida"
            items={lifeAreas.map((a) => a.name)}
            color="text-sky-400"
          />
        )}
        {momentum.length > 0 && (
          <KnowsCard icon={Zap} title="Lo que está caliente ahora" items={momentum} color="text-amber-400" />
        )}
        {frontier.length > 0 && (
          <KnowsCard icon={Sparkles} title="En qué estás aprendiendo" items={frontier} color="text-emerald-400" />
        )}
        {blockers.length > 0 && (
          <KnowsCard icon={AlertTriangle} title="Bloqueadores" items={blockers} color="text-rose-400" />
        )}
        {patterns.length > 0 && (
          <KnowsCard icon={Network} title="Patrones que noté" items={patterns} color="text-indigo-400" />
        )}
      </div>

      {userModel.lastDeepReflection && (
        <p className="text-[10px] text-muted-foreground/50 text-right">
          Última reflexión profunda: {timeAgo(userModel.lastDeepReflection)} atrás
        </p>
      )}
    </div>
  );
}

function KnowsCard({
  icon: Icon, title, items, color,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <Icon className={cn("w-3.5 h-3.5", color)} />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 5).map((it, i) => (
          <li key={i} className="text-xs text-foreground/80 leading-snug">• {it}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── Section 2: What I did ────────────────────────────────────────────────────

function WhatIDidSection() {
  const { actions, loading } = useAgentActions({ status: "applied", limit: 30 });

  // Group by day (using updatedAt fallback to createdAt)
  const grouped = useMemo(() => {
    const map = new Map<string, AgentAction[]>();
    for (const a of actions) {
      const day = formatDay(a.updatedAt || a.createdAt);
      const arr = map.get(day) ?? [];
      arr.push(a);
      map.set(day, arr);
    }
    return Array.from(map.entries());
  }, [actions]);

  if (loading && actions.length === 0) {
    return <div className="rounded-2xl border border-border/40 bg-card/40 p-6 h-32 animate-pulse" />;
  }

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 p-6 text-center">
        <p className="text-xs text-muted-foreground">Tu agente todavía no aplicó cambios autónomos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(([day, items]) => (
        <div key={day} className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground capitalize px-1">
            {day}
          </p>
          <div className="space-y-1.5">
            {items.map((a) => {
              const Icon = ACTION_ICON[a.type] ?? Sparkles;
              return (
                <div key={a.id} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-card/40">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{a.title}</p>
                    {a.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">{a.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-1">
                    {timeAgo(a.updatedAt || a.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Section 3: What I propose ────────────────────────────────────────────────

function WhatIProposeSection() {
  const { actions, loading, refetch } = useAgentActions({ status: "pending", limit: 30 });
  const { apply, dismiss, loading: mutating } = useActionMutations();

  // Only show ambient/inline non-clarification proposals here
  // (clarification questions live in the bell since they're conversational)
  const proposals = useMemo(
    () => actions.filter((a) => a.type !== "clarification_question" && a.visibility !== "silent"),
    [actions]
  );

  const grouped = useMemo(() => {
    const buckets: { risk: string; items: AgentAction[] }[] = [
      { risk: "low", items: [] },
      { risk: "medium", items: [] },
      { risk: "high", items: [] },
    ];
    for (const a of proposals) {
      const b = buckets.find((x) => x.risk === a.risk) ?? buckets[1];
      b.items.push(a);
    }
    return buckets.filter((b) => b.items.length > 0);
  }, [proposals]);

  if (loading && proposals.length === 0) {
    return <div className="rounded-2xl border border-border/40 bg-card/40 p-6 h-24 animate-pulse" />;
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/40 p-6 text-center">
        <p className="text-xs text-muted-foreground">Sin propuestas pendientes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {grouped.map(({ risk, items }) => (
        <div key={risk} className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md border", RISK_STYLE[risk]?.cls)}>
              {RISK_STYLE[risk]?.label ?? risk}
            </span>
            <span className="text-[10px] text-muted-foreground">{items.length}</span>
          </div>
          <div className="space-y-2">
            {items.map((a) => {
              const Icon = ACTION_ICON[a.type] ?? Sparkles;
              return (
                <div key={a.id} className="rounded-xl border border-border/40 bg-card/50 p-3">
                  <div className="flex items-start gap-3 mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-snug">{a.title}</p>
                      {a.description && (
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{a.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={async () => { await dismiss(a.id); refetch(); }}
                      disabled={mutating}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" /> Descartar
                    </button>
                    <button
                      onClick={async () => { await apply(a.id); refetch(); }}
                      disabled={mutating}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Aprobar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AgentPage() {
  const { triggerReflection } = useActionMutations();
  const [thinking, setThinking] = useState(false);

  const onThink = async () => {
    setThinking(true);
    await triggerReflection();
    // Give the backend a moment, then reload
    setTimeout(() => setThinking(false), 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Tu agente</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Lo que el agente sabe de vos, lo que hizo y lo que te propone.
          </p>
        </div>

        <button
          onClick={onThink}
          disabled={thinking}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 transition-colors disabled:opacity-50"
        >
          {thinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {thinking ? "Pensando…" : "Pensar de nuevo"}
        </button>
      </motion.div>

      {/* Section 1 */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
      >
        <h2 className="text-base font-heading font-semibold mb-3 flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          Lo que sé de vos
        </h2>
        <KnowsAboutYouSection />
      </motion.section>

      {/* Section 3 (proposals) — moved up because actionable */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
      >
        <h2 className="text-base font-heading font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Lo que te propongo
        </h2>
        <WhatIProposeSection />
      </motion.section>

      {/* Section 2 (history) */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
      >
        <h2 className="text-base font-heading font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Lo que hice por vos
        </h2>
        <WhatIDidSection />
      </motion.section>
    </div>
  );
}

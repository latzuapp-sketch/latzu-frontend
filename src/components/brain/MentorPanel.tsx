"use client";

/**
 * MentorPanel — single unified view of the user's mentor relationship.
 *
 * Renders inside /brain when `selection.kind === "mentor"`. Combines:
 *   • Foco actual (from UserContext.currentFocus)
 *   • Active goals with progress + next-3-tasks per plan
 *   • Pending agent notifications with their typed buttons
 *   • Recent agent history (last 5 responded actions)
 *   • "Hablar ahora" button → opens ChatOverlay with scope=mentor
 *
 * The mentor itself lives in apps/ai/services/mentor.py — this component just
 * displays its state and lets the user interact with the latest signals.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles, Target, Bell, MessageSquare, ChevronRight,
  Loader2, Compass, RefreshCw, History,
} from "lucide-react";
import { useUserModel, useAgentActions } from "@/hooks/useOrganizerAgent";
import { useUserGoals, useRespondToAction, type ButtonActionOption } from "@/hooks/useGoals";
import { usePlans } from "@/hooks/usePlans";
import { useTasks } from "@/hooks/usePlanning";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { gql } from "@apollo/client";
import type { GoalNode, AgentAction, SignalResponseOption } from "@/graphql/types";
import type { ActionPlan, PlanningTask } from "@/types/planning";
import { cn } from "@/lib/utils";

const REGENERATE_NEXT_TASKS = gql`
  mutation RegenerateNextTasks($planId: String!, $n: Int) {
    regenerateNextTasks(planId: $planId, n: $n) {
      success
      message
      navigateTo
    }
  }
`;

interface MentorPanelProps {
  onOpenChat?: () => void;
}

export function MentorPanel({ onOpenChat }: MentorPanelProps) {
  const router = useRouter();
  const { userModel, loading: ctxLoading } = useUserModel();
  const { goals, loading: goalsLoading } = useUserGoals();
  const { actions: pendingActions } = useAgentActions({ status: "pending", limit: 20 });
  const { actions: respondedActions } = useAgentActions({ status: "responded", limit: 5 });
  const { plans } = usePlans();
  const { tasks } = useTasks();
  const { respond, loading: respondLoading } = useRespondToAction();

  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [regenerate] = useMutation(REGENERATE_NEXT_TASKS, {
    client: aiClient,
  });

  const activeGoals = useMemo(
    () => goals.filter((g) => g.status === "active" || g.status === "clear" || g.status === "clarifying"),
    [goals],
  );

  // Mentor signals: pending AgentActions that need a user response.
  const mentorSignals = useMemo(
    () => pendingActions.filter((a) => a.requiresResponse && a.visibility !== "silent"),
    [pendingActions],
  );

  const tasksByPlan = useMemo(() => {
    const m = new Map<string, PlanningTask[]>();
    for (const t of tasks) {
      const pid = t.planId;
      if (!pid) continue;
      const arr = m.get(pid) ?? [];
      arr.push(t);
      m.set(pid, arr);
    }
    return m;
  }, [tasks]);

  const planById = useMemo(() => {
    const m = new Map<string, ActionPlan>();
    for (const p of plans) m.set(p.id, p);
    return m;
  }, [plans]);

  const handleOpenChat = () => {
    if (onOpenChat) onOpenChat();
    else router.push("/chat?scope=mentor");
  };

  const handleRegenerate = async (planId: string) => {
    setRegenerating(planId);
    try {
      await regenerate({ variables: { planId, n: 3 } });
    } finally {
      setRegenerating(null);
    }
  };

  if (ctxLoading || goalsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500/30 to-primary/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-300" />
            </div>
            <h1 className="text-xl font-heading font-bold">Tu mentor</h1>
          </div>
          {userModel?.currentFocus && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              <Compass className="inline w-3.5 h-3.5 mr-1 text-sky-300" />
              <span className="text-foreground/90">Foco actual:</span> {userModel.currentFocus}
            </p>
          )}
        </div>
        <button
          onClick={handleOpenChat}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 border border-violet-500/30 hover:bg-violet-500/25 transition-colors shrink-0"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Hablar ahora
        </button>
      </header>

      {/* Pending mentor signals — highest priority surface */}
      {mentorSignals.length > 0 && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-violet-300" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Tu mentor te quiere decir algo ({mentorSignals.length})
            </h2>
          </div>
          <div className="space-y-3">
            {mentorSignals.map((action) => (
              <SignalCard
                key={action.id}
                action={action}
                onRespond={(opt) => respond(action.id, opt)}
                disabled={respondLoading}
              />
            ))}
          </div>
        </section>
      )}

      {/* Active goals */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-3.5 h-3.5 text-emerald-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Metas activas ({activeGoals.length})
          </h2>
        </div>
        {activeGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-sm text-muted-foreground">
            Todavía no hay metas activas. Hablá con tu mentor para empezar.
          </div>
        ) : (
          <div className="space-y-3">
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                plan={goal.planId ? planById.get(goal.planId) ?? null : null}
                planTasks={goal.planId ? tasksByPlan.get(goal.planId) ?? [] : []}
                regenerating={regenerating === goal.planId}
                onRegenerate={goal.planId ? () => handleRegenerate(goal.planId!) : undefined}
                onOpenTask={(taskId) => router.push(`/brain?task=${taskId}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Recent history — what happened */}
      {respondedActions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Últimas conversaciones (5)
            </h2>
          </div>
          <div className="space-y-2">
            {respondedActions.slice(0, 5).map((a) => (
              <HistoryRow key={a.id} action={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Signal card ────────────────────────────────────────────────────────────

function SignalCard({
  action,
  onRespond,
  disabled,
}: {
  action: AgentAction;
  onRespond: (opt: ButtonActionOption) => Promise<boolean> | void;
  disabled: boolean;
}) {
  let options: SignalResponseOption[] = [];
  try {
    options = action.responseOptions ? JSON.parse(action.responseOptions) : [];
  } catch {
    options = [];
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border/40 bg-card/80 p-3 space-y-2"
    >
      <div>
        <p className="text-sm font-semibold leading-snug">{action.title}</p>
        {action.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {action.description}
          </p>
        )}
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onRespond(opt)}
              disabled={disabled}
              className={cn(
                "text-xs px-2.5 py-1 rounded-md border transition-colors",
                "bg-background hover:bg-primary/10 hover:border-primary/40 border-border",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Goal card ──────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  plan,
  planTasks,
  regenerating,
  onRegenerate,
  onOpenTask,
}: {
  goal: GoalNode;
  plan: ActionPlan | null;
  planTasks: PlanningTask[];
  regenerating: boolean;
  onRegenerate?: () => void;
  onOpenTask: (taskId: string) => void;
}) {
  const pending = planTasks.filter((t) => t.status !== "done").slice(0, 3);
  const progressPct = Math.round((goal.progressScore ?? 0) * 100);
  const statusColor =
    goal.status === "active" ? "text-emerald-400" :
    goal.status === "clear"  ? "text-sky-300" :
    "text-amber-300";

  return (
    <div className="rounded-xl border border-border/40 bg-card/40 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-[10px] font-bold uppercase tracking-wider", statusColor)}>
              {goal.status}
            </span>
            {goal.deadline && (
              <span className="text-[10px] text-muted-foreground">· {goal.deadline}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold leading-snug truncate">{goal.title}</h3>
          {goal.mainBlocker && (
            <p className="text-[11px] text-rose-400/80 mt-1">
              Bloqueo: {goal.mainBlocker}
            </p>
          )}
        </div>
        {progressPct > 0 && (
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {progressPct}%
          </span>
        )}
      </div>

      {progressPct > 0 && (
        <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
          <div
            className="h-full bg-emerald-400/70 transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}

      {plan && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
              Próximas tareas
            </span>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                disabled={regenerating}
                className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 disabled:opacity-50"
              >
                {regenerating ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-2.5 h-2.5" />
                )}
                {regenerating ? "Generando…" : "Generar 3 más"}
              </button>
            )}
          </div>
          {pending.length === 0 ? (
            <p className="text-[11px] text-muted-foreground/60 italic">
              No quedan tareas pendientes — el mentor va a generar las próximas.
            </p>
          ) : (
            <div className="space-y-1">
              {pending.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpenTask(t.id)}
                  className="w-full text-left flex items-center gap-2 text-xs px-2 py-1.5 rounded-md hover:bg-muted/40 transition-colors"
                >
                  <ChevronRight className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                  <span className="flex-1 truncate">{t.title}</span>
                  {t.estimateMinutes && (
                    <span className="text-[9px] text-muted-foreground/60 shrink-0">
                      ~{Math.round(t.estimateMinutes / 60 * 10) / 10}h
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── History row ────────────────────────────────────────────────────────────

function HistoryRow({ action }: { action: AgentAction }) {
  // user_response is a JSON blob when typed actions ran; fall back to plain text
  let responseLabel = action.userResponse ?? "—";
  try {
    const parsed = action.userResponse ? JSON.parse(action.userResponse) : null;
    if (parsed && typeof parsed === "object" && parsed.action) {
      responseLabel = `Acción: ${parsed.action}`;
    }
  } catch {
    /* keep raw */
  }

  return (
    <div className="rounded-lg border border-border/30 bg-card/30 px-3 py-2 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{action.title}</p>
        <p className="text-[10px] text-muted-foreground truncate">
          → {responseLabel}
        </p>
      </div>
      {action.respondedAt && (
        <span className="text-[10px] text-muted-foreground/60 shrink-0">
          {new Date(action.respondedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
        </span>
      )}
    </div>
  );
}

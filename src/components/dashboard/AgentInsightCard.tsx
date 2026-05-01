"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, AlertTriangle, AlertCircle, Lightbulb, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUserModel, useDismissFocusSignal, useFocusSignals } from "@/hooks/useOrganizerAgent";
import { useAllPlanHealth } from "@/hooks/usePlanHealth";
import type { PlanHealthStatus } from "@/graphql/types";
import Link from "next/link";

// ─── Health badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<PlanHealthStatus, { label: string; color: string; Icon: typeof AlertTriangle }> = {
  on_track:  { label: "Al día",        color: "text-emerald-400", Icon: Sparkles },
  at_risk:   { label: "En riesgo",     color: "text-amber-400",   Icon: AlertTriangle },
  derailing: { label: "Descarrilando", color: "text-red-400",     Icon: AlertCircle },
  abandoned: { label: "Abandonado",    color: "text-gray-400",    Icon: AlertCircle },
};

// ─── Main card ────────────────────────────────────────────────────────────────

interface AgentInsightCardProps {
  className?: string;
}

export function AgentInsightCard({ className }: AgentInsightCardProps) {
  const { userModel, loading: modelLoading } = useUserModel();
  const { healthByPlanId, loading: healthLoading } = useAllPlanHealth();
  const { signals, refetch: refetchSignals } = useFocusSignals("pending");
  const { dismiss } = useDismissFocusSignal();

  const now = new Date().toISOString();

  // Due signals (deliverAt <= now)
  const dueSignals = useMemo(
    () => signals.filter((s) => s.deliverAt <= now).slice(0, 2),
    [signals, now]
  );

  // At-risk and derailing plans
  const alertPlans = useMemo(
    () =>
      Object.values(healthByPlanId).filter(
        (h) => h.status === "at_risk" || h.status === "derailing" || h.status === "abandoned"
      ),
    [healthByPlanId]
  );

  // Parse current_focus from UserModel
  const currentFocus = userModel?.currentFocus ?? null;

  // First long-term goal as a snippet
  const keyObservation = useMemo(() => {
    if (!userModel?.longTermGoals) return null;
    try {
      const goals = JSON.parse(userModel.longTermGoals);
      return Array.isArray(goals) && goals.length > 0 ? goals[0] : null;
    } catch {
      return null;
    }
  }, [userModel?.longTermGoals]);

  const loading = modelLoading || healthLoading;

  const hasContent = currentFocus || dueSignals.length > 0 || alertPlans.length > 0;

  if (loading && !hasContent) {
    return (
      <div className={cn("rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4", className)}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400/40 animate-pulse" />
          <span className="text-xs text-white/30">Analizando tu workspace…</span>
        </div>
      </div>
    );
  }

  if (!hasContent && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/[0.04] to-transparent p-4 space-y-3",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-xs font-semibold text-white/80">Organizador IA</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-white/30 hover:text-white/60"
          onClick={() => refetchSignals()}
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      {/* Current focus */}
      {currentFocus && (
        <div className="space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/70">
            Foco actual
          </p>
          <p className="text-sm text-white/80 leading-snug">{currentFocus}</p>
        </div>
      )}

      {/* Due FocusSignals */}
      {dueSignals.map((signal) => (
        <div
          key={signal.id}
          className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]"
        >
          <Lightbulb className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-400" />
          <p className="flex-1 text-xs text-white/75 leading-snug">{signal.message}</p>
          <button
            onClick={() => dismiss(signal.id)}
            className="text-white/30 hover:text-white/60 flex-shrink-0"
          >
            ×
          </button>
        </div>
      ))}

      {/* At-risk plans */}
      {alertPlans.slice(0, 2).map((h) => {
        const config = STATUS_CONFIG[h.status];
        const Icon = config.Icon;
        return (
          <div key={h.planId} className="flex items-start gap-2.5">
            <Icon className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", config.color)} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-[11px] font-medium", config.color)}>{config.label}</p>
              <p className="text-xs text-white/60 leading-snug line-clamp-1">
                {h.recommendation}
              </p>
            </div>
            <Link
              href="/plans"
              className="flex-shrink-0 text-[10px] text-violet-400 hover:text-violet-300"
            >
              Ver →
            </Link>
          </div>
        );
      })}

      {/* Long-term goal snippet */}
      {keyObservation && !currentFocus && (
        <p className="text-xs text-white/50 leading-snug italic">"{keyObservation}"</p>
      )}
    </motion.div>
  );
}

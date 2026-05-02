"use client";

/**
 * GoalViewer — opens a GoalNode inside the brain's UniversalViewer.
 *
 * Shows:
 *   - Title + status
 *   - Why / success criteria / deadline / time per week / current level / blocker
 *   - Progress bar
 *   - Link to the linked ActionPlan (if any)
 */

import Link from "next/link";
import {
  Target, Calendar, Clock, AlertTriangle, GraduationCap, Sparkles, ArrowRight,
} from "lucide-react";
import type { GoalNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  vague:      { label: "Por aclarar",  cls: "text-zinc-300 bg-zinc-500/10 border-zinc-500/30" },
  clarifying: { label: "Aclarando",    cls: "text-amber-300 bg-amber-500/10 border-amber-500/30" },
  clear:      { label: "Definida",     cls: "text-sky-300 bg-sky-500/10 border-sky-500/30" },
  active:     { label: "Activa",       cls: "text-rose-300 bg-rose-500/10 border-rose-500/30" },
  achieved:   { label: "Lograda",      cls: "text-emerald-300 bg-emerald-500/10 border-emerald-500/30" },
  abandoned:  { label: "Abandonada",   cls: "text-muted-foreground bg-muted/30 border-border/40" },
};

export function GoalViewer({ goal }: { goal: GoalNode }) {
  const meta = STATUS_META[goal.status] ?? STATUS_META.vague;
  const pct = Math.round((goal.progressScore ?? 0) * 100);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-rose-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">Meta</span>
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded border", meta.cls)}>
              {meta.label}
            </span>
            {goal.source === "behavior" && (
              <span className="inline-flex items-center gap-1 text-[10px] text-violet-300/80">
                <Sparkles className="w-3 h-3" /> detectada por la IA
              </span>
            )}
          </div>
          <h1 className="text-xl font-heading font-bold leading-tight">{goal.title}</h1>
          {goal.rawStatement && goal.rawStatement !== goal.title && (
            <p className="text-sm text-muted-foreground mt-1 italic">"{goal.rawStatement}"</p>
          )}
        </div>
      </div>

      {/* Progress */}
      {pct > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/30 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <div className="h-full bg-rose-500 transition-all" style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
          </div>
        </div>
      )}

      {/* Detail grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {goal.why && (
          <DetailRow icon={Sparkles} label="Por qué" value={goal.why} />
        )}
        {goal.successCriteria && (
          <DetailRow icon={Target} label="Cómo sabré que la logré" value={goal.successCriteria} />
        )}
        {goal.deadline && (
          <DetailRow icon={Calendar} label="Para cuándo" value={goal.deadline} />
        )}
        {goal.timePerWeek > 0 && (
          <DetailRow icon={Clock} label="Tiempo por semana" value={`${goal.timePerWeek} h`} />
        )}
        {goal.currentLevel && (
          <DetailRow icon={GraduationCap} label="Nivel actual" value={goal.currentLevel} />
        )}
        {goal.mainBlocker && (
          <DetailRow icon={AlertTriangle} label="Bloqueador principal" value={goal.mainBlocker} accent="text-amber-300" />
        )}
      </div>

      {/* Linked plan */}
      {goal.planId && (
        <Link
          href={`/plans/${goal.planId}`}
          className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 p-3 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-300" />
            <span className="text-sm font-medium">Ver plan vinculado</span>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-300" />
        </Link>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon, label, value, accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("w-3 h-3", accent ?? "text-muted-foreground/60")} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          {label}
        </span>
      </div>
      <p className="text-sm leading-relaxed">{value}</p>
    </div>
  );
}

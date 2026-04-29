"use client";

import { useMemo } from "react";
import { usePlans } from "@/hooks/usePlans";
import { useTasks } from "@/hooks/usePlanning";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ClipboardList, Plus, Loader2 } from "lucide-react";
import Link from "next/link";

export function PlansSummaryWidget() {
  const { plans, loading } = usePlans();
  const { tasks } = useTasks();

  const activePlans = useMemo(
    () => plans.filter((p) => p.status === "active").slice(0, 3),
    [plans]
  );

  const planProgress = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    for (const t of tasks) {
      if (!t.planId) continue;
      if (!map[t.planId]) map[t.planId] = { total: 0, done: 0 };
      map[t.planId].total++;
      if (t.status === "done") map[t.planId].done++;
    }
    return map;
  }, [tasks]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between border-b border-border/30">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-primary" />
          <p className="text-sm font-semibold">Mis metas</p>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-xs" asChild>
          <Link href="/plans">Ver todo</Link>
        </Button>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : activePlans.length === 0 ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-xs text-muted-foreground">Sin metas activas.</p>
            <Button size="sm" variant="outline" asChild className="gap-1.5">
              <Link href="/plans">
                <Plus className="w-3.5 h-3.5" />
                Crear meta
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {activePlans.map((plan) => {
              const counts = planProgress[plan.id] ?? { total: 0, done: 0 };
              const pct = counts.total === 0 ? 0 : Math.round((counts.done / counts.total) * 100);
              return (
                <Link key={plan.id} href="/plans" className="block group">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {plan.title}
                      </p>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

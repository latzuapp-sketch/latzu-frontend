"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainGoalCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useUserGoals } from "@/hooks/useGoals";
import type { GoalNode } from "@/graphql/types";

const STATUS_ORDER: Record<string, number> = {
  active: 0, clear: 1, clarifying: 2, vague: 3, achieved: 4, abandoned: 5,
};

/** Goals — large progress cards, active first. */
export default function BrainGoalsPage() {
  const { goals, loading, refetch } = useUserGoals();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  const ordered = useMemo(() => {
    return [...goals].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99));
  }, [goals]);

  const open = (g: GoalNode) => setViewing({ kind: "goal", goal: g });

  return (
    <BrainPageShell
      title="Metas"
      subtitle="Lo que querés lograr — preguntas de clarificación, plan y progreso"
      count={goals.length}
      onCreated={refetch}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {loading && goals.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay metas. Usá el botón <span className="text-rose-300 font-medium">Meta</span> de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ordered.map((g) => (
            <BrainGoalCard key={g.id} goal={g} onClick={() => open(g)} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

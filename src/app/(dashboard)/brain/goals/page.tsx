"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Flag } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainGoalCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useUserGoals, useCreateGoal } from "@/hooks/useGoals";
import type { GoalNode } from "@/graphql/types";

const STATUS_ORDER: Record<string, number> = {
  active: 0, clear: 1, clarifying: 2, vague: 3, achieved: 4, abandoned: 5,
};

/** Goals — large progress cards. Inline rose-themed creator on top. */
export default function BrainGoalsPage() {
  const { goals, loading, refetch } = useUserGoals();
  const { createGoal } = useCreateGoal();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (composerOpen) setTimeout(() => ref.current?.focus(), 50); }, [composerOpen]);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await createGoal(t.slice(0, 120), t);
      setText("");
      setComposerOpen(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const ordered = useMemo(
    () => [...goals].sort((a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)),
    [goals],
  );
  const open = (g: GoalNode) => setViewing({ kind: "goal", goal: g });

  return (
    <BrainPageShell
      title="Metas"
      subtitle="El mentor te hace preguntas para clarificarlas y arma el plan"
      count={goals.length}
      toolbar={
        !composerOpen && (
          <button
            onClick={() => setComposerOpen(true)}
            className="h-8 px-3 rounded-md border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva meta
          </button>
        )
      }
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-4 h-4 text-rose-300" />
              <span className="text-sm font-semibold text-rose-200">Nueva meta</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">⌘Enter · Esc</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mb-2">
              ¿Qué querés lograr? El mentor te va a preguntar el resto.
            </p>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setComposerOpen(false); setText(""); }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
              }}
              placeholder="Ej. 'Aprobar el parcial de cálculo el 15 de mayo'"
              rows={2}
              className="w-full bg-background/60 rounded-md p-2.5 text-sm outline-none resize-none placeholder:text-muted-foreground/40 border border-border/40"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setComposerOpen(false); setText(""); }} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || busy}
                className="text-xs px-3 py-1.5 rounded-md bg-rose-500/25 text-rose-100 hover:bg-rose-500/35 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Crear meta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && goals.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aún no hay metas.
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

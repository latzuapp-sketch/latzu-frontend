"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Target } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainPlanCard } from "@/components/brain/BrainItemCards";
import { usePlans } from "@/hooks/usePlans";
import { useAllPlanHealth } from "@/hooks/usePlanHealth";

/** Plans — vertical card list, active first. Inline AI-plan creator on top. */
export default function BrainPlansPage() {
  const { plans, loading, createPlan, refetch } = usePlans();
  const { healthByPlanId } = useAllPlanHealth();
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
      await createPlan({ title: t.slice(0, 80), goal: t, type: "action", generateWithAI: true });
      setText("");
      setComposerOpen(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const ordered = useMemo(() => {
    return [...plans].sort((a, b) => {
      const aActive = a.status === "active" ? 0 : 1;
      const bActive = b.status === "active" ? 0 : 1;
      if (aActive !== bActive) return aActive - bActive;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [plans]);

  return (
    <BrainPageShell
      title="Planes"
      subtitle="Hojas de ruta con fases, salud y velocidad"
      count={plans.length}
      toolbar={
        !composerOpen && (
          <button
            onClick={() => setComposerOpen(true)}
            className="h-8 px-3 rounded-md border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo plan
          </button>
        )
      }
    >
      <AnimatePresence>
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-300" />
              <span className="text-sm font-semibold text-emerald-200">Nuevo plan</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">⌘Enter para generar · Esc para cerrar</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mb-2">
              Describí un objetivo. La IA arma fases y tareas concretas.
            </p>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setComposerOpen(false); setText(""); }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
              }}
              placeholder="Ej. 'Aprender React desde cero en 8 semanas con 5h/sem'"
              rows={3}
              className="w-full bg-background/60 rounded-md p-2.5 text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40 border border-border/40"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setComposerOpen(false); setText(""); }} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || busy}
                className="text-xs px-3 py-1.5 rounded-md bg-emerald-500/25 text-emerald-100 hover:bg-emerald-500/35 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Generar plan
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && plans.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aún no hay planes.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {ordered.map((p) => (
            <BrainPlanCard
              key={p.id}
              plan={p}
              health={healthByPlanId[p.id] ?? null}
              onClick={() => { /* card expands inline */ }}
            />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

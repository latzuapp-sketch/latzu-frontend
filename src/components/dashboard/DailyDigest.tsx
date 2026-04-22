"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useUserMemory } from "@/hooks/useRecommendations";
import { getNodeTypeConfig } from "@/components/biblioteca/NodeTypeConfig";
import { Button } from "@/components/ui/button";
import {
  BookOpen, Sparkles, ChevronRight, X, Bell, CheckCircle2, RefreshCw,
} from "lucide-react";
import Link from "next/link";

// ─── LocalStorage key includes the date so it resets daily ───────────────────

function todayKey() {
  return `latzu_digest_${new Date().toISOString().slice(0, 10)}`;
}

// ─── DailyDigest ─────────────────────────────────────────────────────────────

interface DailyDigestProps {
  className?: string;
}

export function DailyDigest({ className }: DailyDigestProps) {
  const { recommendations, loading, refetch, recordInteraction } = useRecommendations(5);
  const { memory } = useUserMemory();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [completedToday, setCompletedToday] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Persist dismissed + completed state per day
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(todayKey()) ?? "{}");
      if (saved.dismissed) setDismissed(saved.dismissed);
      if (saved.completed) setCompletedToday(true);
    } catch {}
  }, []);

  const persist = (updates: { dismissed?: string[]; completed?: boolean }) => {
    try {
      const existing = JSON.parse(localStorage.getItem(todayKey()) ?? "{}");
      localStorage.setItem(todayKey(), JSON.stringify({ ...existing, ...updates }));
    } catch {}
  };

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = [...dismissed, id];
    setDismissed(next);
    persist({ dismissed: next });
    await recordInteraction(id, "dismissed");
  };

  const handleRead = async (id: string) => {
    await recordInteraction(id, "viewed");
    setExpanded(expanded === id ? null : id);
  };

  const handleMarkAllDone = () => {
    setCompletedToday(true);
    persist({ completed: true });
  };

  const visible = recommendations.filter((r) => !dismissed.includes(r.id));

  if (loading && recommendations.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/50 bg-card/60 p-4 space-y-3", className)}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="h-3.5 bg-muted/40 rounded w-36 animate-pulse" />
            <div className="h-2.5 bg-muted/30 rounded w-24 animate-pulse" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-9 h-9 rounded-xl bg-muted/30 shrink-0" />
            <div className="flex-1 space-y-1.5 pt-0.5">
              <div className="h-3 bg-muted/40 rounded w-3/4" />
              <div className="h-2.5 bg-muted/30 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (completedToday) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3",
          className
        )}
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-emerald-300">Lectura del día completada</p>
          <p className="text-xs text-muted-foreground mt-0.5">Vuelve mañana para nuevas recomendaciones.</p>
        </div>
        <button
          onClick={() => { setCompletedToday(false); persist({ completed: false }); }}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </motion.div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/50 bg-card/60 p-4 text-center space-y-2", className)}>
        <BookOpen className="w-7 h-7 mx-auto text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Agrega contenido a tu biblioteca para recibir lecturas diarias personalizadas.
        </p>
        <Button size="sm" variant="outline" asChild className="gap-1.5">
          <Link href="/library">Ir a la biblioteca</Link>
        </Button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className={cn("rounded-2xl border border-border/50 bg-card/60 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/40 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Lecturas de hoy</p>
            <p className="text-[11px] text-muted-foreground capitalize">{today}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => refetch()}
            className="text-muted-foreground/40 hover:text-muted-foreground transition-colors p-1"
            title="Actualizar"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Personalized intro from memory */}
      {memory?.summary && (
        <div className="px-4 py-2.5 bg-primary/5 border-b border-border/30">
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {memory.summary.slice(0, 120)}{memory.summary.length > 120 ? "…" : ""}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="divide-y divide-border/30">
        <AnimatePresence mode="popLayout">
          {visible.slice(0, 4).map((rec, i) => {
            const config = getNodeTypeConfig(rec.type);
            const Icon = config.Icon;
            const isOpen = expanded === rec.id;

            return (
              <motion.div
                key={rec.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                exit={{ opacity: 0, x: 20, transition: { duration: 0.15 } }}
              >
                <div
                  className="group px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => handleRead(rec.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5", config.bg)}>
                      <Icon className={cn("w-4 h-4", config.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-snug line-clamp-1">{rec.name}</p>
                      <p className={cn(
                        "text-xs text-muted-foreground leading-relaxed mt-0.5 transition-all",
                        isOpen ? "" : "line-clamp-2"
                      )}>
                        {rec.content}
                      </p>
                      {isOpen && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", config.text, config.bg)}>
                            {config.label}
                          </span>
                          <Link
                            href={`/library?node=${rec.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                          >
                            Ver en biblioteca <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => handleDismiss(rec.id, e)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-muted-foreground transition-all p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <ChevronRight className={cn(
                        "w-3.5 h-3.5 text-muted-foreground/40 transition-transform",
                        isOpen && "rotate-90"
                      )} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {visible.length} lectura{visible.length !== 1 ? "s" : ""} recomendada{visible.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleMarkAllDone}
          className="h-7 text-xs gap-1.5"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Marcar como leídas
        </Button>
      </div>
    </div>
  );
}

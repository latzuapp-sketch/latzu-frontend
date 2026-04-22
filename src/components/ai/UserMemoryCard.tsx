"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUserMemory, useUserStats } from "@/hooks/useRecommendations";
import {
  Brain,
  ChevronDown,
  RefreshCw,
  Sparkles,
  BookOpen,
  Target,
  Lightbulb,
  MessageSquare,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserMemoryCardProps {
  className?: string;
}

export function UserMemoryCard({ className }: UserMemoryCardProps) {
  const { memory, loading, refreshing, refreshMemory } = useUserMemory();
  const { stats } = useUserStats();
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className={cn("rounded-xl border border-border/40 p-4 animate-pulse", className)}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded bg-muted/40" />
          <div className="h-3 bg-muted/40 rounded w-1/3" />
        </div>
        <div className="space-y-2">
          <div className="h-2.5 bg-muted/30 rounded w-full" />
          <div className="h-2.5 bg-muted/30 rounded w-4/5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border/40 bg-card/60 overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-2.5 p-4 hover:bg-muted/20 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Brain className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold">Tu perfil de aprendizaje</p>
          {!memory && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Empieza a chatear para que la IA te conozca
            </p>
          )}
          {memory && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {memory.sessionCount} sesiones · {memory.messageCount} mensajes
            </p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground/60 transition-transform shrink-0",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Stats row */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <StatPill
          icon={<Network className="w-3 h-3" />}
          value={stats.ownedNodes}
          label="nodos propios"
        />
        <StatPill
          icon={<MessageSquare className="w-3 h-3" />}
          value={stats.sessionCount}
          label="sesiones"
        />
      </div>

      {/* Expandable memory details */}
      <AnimatePresence>
        {expanded && memory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
              {/* Summary */}
              {memory.summary && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Resumen
                  </p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {memory.summary}
                  </p>
                </div>
              )}

              {/* Interests */}
              {memory.interests.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Intereses detectados
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {memory.interests.slice(0, 8).map((interest) => (
                      <span
                        key={interest}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Knowledge gaps */}
              {memory.knowledgeGaps.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3 text-amber-400" />
                    Por aprender
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {memory.knowledgeGaps.slice(0, 5).map((gap) => (
                      <span
                        key={gap}
                        className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/20"
                      >
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning style */}
              {memory.learningStyle && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Lightbulb className="w-3 h-3 text-sky-400" />
                    Estilo de aprendizaje
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    {memory.learningStyle}
                  </p>
                </div>
              )}

              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshMemory}
                disabled={refreshing}
                className="w-full h-7 text-xs text-muted-foreground gap-1.5"
              >
                <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                {refreshing ? "Actualizando perfil…" : "Actualizar con sesiones recientes"}
              </Button>
            </div>
          </motion.div>
        )}

        {expanded && !memory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border/30 pt-3">
              <div className="flex items-start gap-2 rounded-lg bg-muted/20 p-3">
                <BookOpen className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  La IA aprenderá de tus conversaciones y construirá un perfil
                  personalizado. Chatea, extrae conocimiento y aprende — el sistema
                  se adaptará automáticamente a ti.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg bg-muted/20 px-2.5 py-1.5">
      <span className="text-muted-foreground/60">{icon}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
      <span className="text-[10px] text-muted-foreground truncate">{label}</span>
    </div>
  );
}

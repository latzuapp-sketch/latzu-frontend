"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRecommendations } from "@/hooks/useRecommendations";
import { getNodeTypeConfig } from "@/components/biblioteca/NodeTypeConfig";
import {
  Sparkles,
  ChevronRight,
  X,
  BookOpen,
  ArrowRight,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecommendationPanelProps {
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

export function RecommendationPanel({
  onNodeClick,
  className,
}: RecommendationPanelProps) {
  const { recommendations, loading, refetch, recordInteraction } =
    useRecommendations(6);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = recommendations.filter((r) => !dismissed.has(r.id));

  const handleDismiss = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed((prev) => new Set(prev).add(id));
    await recordInteraction(id, "dismissed");
  };

  const handleClick = async (id: string) => {
    await recordInteraction(id, "viewed");
    onNodeClick?.(id);
  };

  if (loading && recommendations.length === 0) {
    return (
      <div className={cn("space-y-2", className)}>
        <RecommendationSkeleton />
        <RecommendationSkeleton />
        <RecommendationSkeleton />
      </div>
    );
  }

  if (visible.length === 0) {
    return (
      <div className={cn("text-center py-6", className)}>
        <BookOpen className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">
          Agrega conocimiento para recibir recomendaciones personalizadas
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Recomendado para ti
        </p>
        <button
          onClick={() => refetch()}
          className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Actualizar recomendaciones"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence mode="popLayout">
        {visible.map((rec, i) => {
          const config = getNodeTypeConfig(rec.type);
          const Icon = config.Icon;
          const isTraversal = rec.reason === "graph_traversal";

          return (
            <motion.div
              key={rec.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.04 } }}
              exit={{ opacity: 0, x: 8, scale: 0.95 }}
              onClick={() => handleClick(rec.id)}
              className={cn(
                "group relative flex items-start gap-2.5 rounded-xl border p-3",
                "bg-card/60 hover:bg-card/90 border-border/50 hover:border-border",
                "cursor-pointer transition-all"
              )}
            >
              {/* Type icon */}
              <div
                className={cn(
                  "shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
                  config.bg
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", config.text)} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug line-clamp-1">
                  {rec.name}
                </p>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                  {rec.content}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn("text-[10px] font-medium", config.text)}>
                    {config.label}
                  </span>
                  {isTraversal && rec.connectionStrength > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
                      <ArrowRight className="w-2.5 h-2.5" />
                      {rec.connectionStrength}{" "}
                      {rec.connectionStrength === 1 ? "conexión" : "conexiones"}
                    </span>
                  )}
                  {!isTraversal && (
                    <span className="text-[10px] text-amber-400/70">
                      coincide con tus intereses
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={(e) => handleDismiss(rec.id, e)}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  title="No me interesa"
                >
                  <X className="w-3 h-3" />
                </button>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function RecommendationSkeleton() {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-border/30 p-3 animate-pulse">
      <div className="w-7 h-7 rounded-lg bg-muted/40 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-muted/40 rounded w-3/4" />
        <div className="h-2.5 bg-muted/30 rounded w-full" />
        <div className="h-2.5 bg-muted/30 rounded w-2/3" />
      </div>
    </div>
  );
}

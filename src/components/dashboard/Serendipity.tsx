"use client";

import { useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useAnimation } from "framer-motion";
import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import { GET_SERENDIPITY } from "@/graphql/ai/operations";
import { getNodeTypeConfig } from "@/components/biblioteca/NodeTypeConfig";
import { cn } from "@/lib/utils";
import { Shuffle, Sparkles, BookmarkPlus, X, RefreshCw } from "lucide-react";
import Link from "next/link";

interface SerendipityNode {
  id: string;
  name: string;
  type: string;
  content: string;
  sourceRef: string | null;
}

// ─── Swipeable Card ───────────────────────────────────────────────────────────

function SwipeCard({
  node,
  onKeep,
  onRelease,
  isTop,
}: {
  node: SerendipityNode;
  onKeep: () => void;
  onRelease: () => void;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const opacity = useTransform(x, [-200, -80, 0, 80, 200], [0, 1, 1, 1, 0]);
  const keepOpacity = useTransform(x, [20, 80], [0, 1]);
  const releaseOpacity = useTransform(x, [-80, -20], [1, 0]);

  const config = getNodeTypeConfig(node.type as never);
  const Icon = config.Icon;

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) onKeep();
    else if (info.offset.x < -80) onRelease();
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: "grabbing" }}
      className={cn(
        "absolute inset-0 rounded-2xl border border-border/50 bg-card p-5 cursor-grab select-none",
        !isTop && "scale-95 translate-y-2 opacity-60 pointer-events-none"
      )}
    >
      {/* Keep / Release indicators */}
      <motion.div
        style={{ opacity: keepOpacity }}
        className="absolute top-4 left-4 bg-emerald-500/20 border border-emerald-500/40 rounded-lg px-2.5 py-1 text-xs font-bold text-emerald-400 rotate-[-12deg]"
      >
        GUARDAR
      </motion.div>
      <motion.div
        style={{ opacity: releaseOpacity }}
        className="absolute top-4 right-4 bg-red-500/20 border border-red-500/40 rounded-lg px-2.5 py-1 text-xs font-bold text-red-400 rotate-[12deg]"
      >
        SOLTAR
      </motion.div>

      {/* Content */}
      <div className="h-full flex flex-col gap-3 pt-2">
        <div className="flex items-start gap-3">
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", config.bg)}>
            <Icon className={cn("w-4 h-4", config.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <span className={cn("text-[10px] font-semibold uppercase tracking-wider", config.text)}>
              {config.label}
            </span>
            <h3 className="font-semibold text-sm leading-snug mt-0.5 line-clamp-2">{node.name}</h3>
          </div>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-6 flex-1">
          {node.content}
        </p>

        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
          <Link
            href={`/library?node=${node.id}`}
            className="text-[10px] text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Ver en biblioteca →
          </Link>
          <p className="text-[10px] text-muted-foreground/40">Desliza para guardar o soltar</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface SerendipityProps {
  className?: string;
}

export function Serendipity({ className }: SerendipityProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_SERENDIPITY, {
    client: aiClient,
    variables: { userId, limit: 5 },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const [index, setIndex] = useState(0);
  const [kept, setKept] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const nodes: SerendipityNode[] = data?.serendipity ?? [];
  const remaining = nodes.slice(index);

  const handleKeep = () => {
    if (index < nodes.length) {
      setKept((k) => [...k, nodes[index].id]);
    }
    advance();
  };

  const handleRelease = () => {
    advance();
  };

  const advance = () => {
    if (index + 1 >= nodes.length) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const reset = () => {
    setIndex(0);
    setKept([]);
    setDone(false);
    refetch();
  };

  if (loading && nodes.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-border/40 bg-card/60 p-4 space-y-3 animate-pulse", className)}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/15" />
          <div className="h-3 bg-muted/40 rounded w-32" />
        </div>
        <div className="h-32 bg-muted/20 rounded-xl" />
      </div>
    );
  }

  if (nodes.length === 0) return null;

  return (
    <div className={cn("rounded-2xl border border-border/40 bg-card/60 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Shuffle className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">Serendipity</p>
            <p className="text-[11px] text-muted-foreground">Redescubre lo que olvidaste</p>
          </div>
        </div>
        <button
          onClick={reset}
          className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          title="Barajar nuevas memorias"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Card area */}
      <div className="p-4">
        {done ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-violet-500/15 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Sesión completa</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {kept.length > 0
                  ? `Guardaste ${kept.length} memoria${kept.length !== 1 ? "s" : ""} · bien hecho`
                  : "Limpiaste tu mente · bien hecho"}
              </p>
            </div>
            <button
              onClick={reset}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Nuevas memorias
            </button>
          </motion.div>
        ) : (
          <div className="relative" style={{ height: "220px" }}>
            <AnimatePresence>
              {remaining.slice(0, 2).map((node, i) => (
                <SwipeCard
                  key={node.id}
                  node={node}
                  onKeep={handleKeep}
                  onRelease={handleRelease}
                  isTop={i === 0}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {!done && (
        <div className="px-4 pb-4 flex items-center justify-between">
          <button
            onClick={handleRelease}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors border border-border/40 rounded-lg px-3 py-1.5 hover:border-red-500/30"
          >
            <X className="w-3.5 h-3.5" />
            Soltar
          </button>
          <p className="text-[10px] text-muted-foreground/40">
            {index + 1} / {nodes.length}
          </p>
          <button
            onClick={handleKeep}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-emerald-400 transition-colors border border-border/40 rounded-lg px-3 py-1.5 hover:border-emerald-500/30"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            Guardar
          </button>
        </div>
      )}
    </div>
  );
}

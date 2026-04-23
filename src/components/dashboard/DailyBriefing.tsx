"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import { GET_DAILY_BRIEFING } from "@/graphql/ai/operations";
import { cn } from "@/lib/utils";
import { Sparkles, Brain, BookOpen, Target, RefreshCw, ChevronDown, ChevronUp, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function moodConfig(mood: string) {
  return {
    motivador: { gradient: "from-primary/15 to-accent/8", icon: "🚀", border: "border-primary/20" },
    reflexivo: { gradient: "from-violet-500/10 to-primary/8", icon: "🌙", border: "border-violet-500/20" },
    energético: { gradient: "from-amber-500/12 to-primary/8", icon: "⚡", border: "border-amber-500/20" },
  }[mood] ?? { gradient: "from-primary/15 to-accent/8", icon: "✨", border: "border-primary/20" };
}

interface DailyBriefingProps {
  className?: string;
}

export function DailyBriefing({ className }: DailyBriefingProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const firstName = session?.user?.name?.split(" ")[0] ?? "Usuario";
  const [expanded, setExpanded] = useState(false);

  const { data, loading, refetch, error } = useQuery(GET_DAILY_BRIEFING, {
    client: aiClient,
    variables: { userId, userName: firstName },
    skip: !userId,
    fetchPolicy: "cache-first",
  });

  const briefing = data?.dailyBriefing;
  const mood = moodConfig(briefing?.mood ?? "motivador");

  if (loading && !briefing) {
    return (
      <div className={cn(
        "rounded-2xl border border-border/40 bg-gradient-to-br from-primary/8 to-card p-5 space-y-3 animate-pulse",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15" />
          <div className="space-y-1.5 flex-1">
            <div className="h-3.5 bg-muted/40 rounded w-2/3" />
            <div className="h-2.5 bg-muted/30 rounded w-1/2" />
          </div>
        </div>
        <div className="h-2.5 bg-muted/30 rounded w-full" />
        <div className="h-2.5 bg-muted/30 rounded w-4/5" />
      </div>
    );
  }

  if (error || !briefing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden bg-gradient-to-br",
        mood.gradient, mood.border,
        className
      )}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center text-lg shrink-0">
              {mood.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Briefing del día</p>
              <h3 className="font-heading font-bold text-base leading-tight mt-0.5">{briefing.headline}</h3>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => refetch()}
              className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              title="Actualizar briefing"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed">{briefing.message}</p>
      </div>

      {/* Stats row */}
      <div className="px-5 py-2.5 border-t border-border/20 flex items-center gap-4">
        {briefing.notesDue > 0 && (
          <Link href="/notes/review" className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors">
            <Flame className="w-3 h-3" />
            {briefing.notesDue} nota{briefing.notesDue !== 1 ? "s" : ""} para repasar
          </Link>
        )}
        {briefing.activePlans > 0 && (
          <Link href="/plans" className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
            <Target className="w-3 h-3" />
            {briefing.activePlans} plan{briefing.activePlans !== 1 ? "es" : ""} activo{briefing.activePlans !== 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Suggestion (expandable) */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 border-t border-border/20 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Sugerencia para hoy</p>
                  <p className="text-sm text-foreground/80">{briefing.suggestion}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs gap-1.5" asChild>
                  <Link href="/chat">
                    <Brain className="w-3 h-3" />
                    Hablar con tutor
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" asChild>
                  <Link href="/notes">
                    <BookOpen className="w-3 h-3" />
                    Mis notas
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

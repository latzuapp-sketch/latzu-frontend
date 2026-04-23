"use client";

import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { getTemplate, getProactivePrompts } from "@/config/templates";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { DailyDigest } from "@/components/dashboard/DailyDigest";
import { DailyBriefing } from "@/components/dashboard/DailyBriefing";
import { Serendipity } from "@/components/dashboard/Serendipity";
import { UserMemoryCard } from "@/components/ai/UserMemoryCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, ArrowRight, Bell, Brain } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTasks, isSameDay } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { useMemo } from "react";
import { useDueCount } from "@/hooks/useFlashcards";

export default function DashboardPage() {
  const { data: session } = useSession();
  const profileType = useUserStore((state) => state.profileType);
  const progress = useUserStore((state) => state.progress);
  const isGuest = useIsGuest();
  const isMobile = useIsMobile();

  const [showProactiveBanner, setShowProactiveBanner] = useState(true);

  const template = getTemplate(profileType || undefined);
  const proactivePrompts = getProactivePrompts(profileType || "estudiante", {
    currentStreak: progress?.currentStreak || 0,
  });

  const { tasks } = useTasks();
  const { plans } = usePlans();
  const dueFlashcards = useDueCount();

  const todayPending = useMemo(() => {
    const today = new Date();
    return tasks.filter(
      (t) => t.status !== "done" && t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), today)
    ).length;
  }, [tasks]);

  const activePlanCount = useMemo(
    () => plans.filter((p) => p.status === "active").length,
    [plans]
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = isGuest
    ? "Invitado"
    : session?.user?.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl">

      {/* ── Welcome header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-heading font-bold truncate">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isGuest
              ? "Explora la plataforma en modo de prueba"
              : template.welcomeMessage.split(".")[0] + "."}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!isGuest && dueFlashcards > 0 && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/notes/review">
                <Brain className="w-3.5 h-3.5" />
                {dueFlashcards} nota{dueFlashcards !== 1 ? "s" : ""}
              </Link>
            </Button>
          )}
          {!isGuest && todayPending > 0 && (
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/planning">
                <Bell className="w-3.5 h-3.5" />
                {todayPending} pendiente{todayPending !== 1 ? "s" : ""} hoy
              </Link>
            </Button>
          )}
          <Button asChild className="gap-1.5">
            <Link href="/chat">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Hablar con IA</span>
              <span className="sm:hidden">Chat IA</span>
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* ── Quick stats strip (mobile only) ── */}
      {!isGuest && isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 0.1 } }}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { label: "Hoy", value: todayPending, sub: "pendientes", href: "/planning" },
            { label: "Notas", value: dueFlashcards, sub: "repasar", href: "/notes/review" },
            { label: "Planes", value: activePlanCount, sub: "activos", href: "/plans" },
          ].map(({ label, value, sub, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border border-border/50 bg-card/60 px-3 py-2.5 text-center hover:border-primary/40 transition-colors"
            >
              <p className="text-xl font-bold">{value}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{label}<br />{sub}</p>
            </Link>
          ))}
        </motion.div>
      )}

      {/* ── Proactive suggestion banner ── */}
      <AnimatePresence>
        {showProactiveBanner && template.proactivePrompts && proactivePrompts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm mb-0.5">Sugerencia personalizada</p>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {proactivePrompts[0]}
                    </p>
                    <div className="flex gap-2 mt-2.5">
                      <Button size="sm" className="gap-1 h-7 text-xs" asChild>
                        <Link href="/study">
                          Empezar <ArrowRight className="w-3 h-3" />
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowProactiveBanner(false)} className="h-7 text-xs">
                        Ahora no
                      </Button>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="flex-shrink-0 w-7 h-7" onClick={() => setShowProactiveBanner(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

        {/* Widgets — 2/3 width on desktop */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <WidgetRenderer widgets={template.dashboardWidgets} />
        </div>

        {/* Right sidebar — 1/3 width on desktop, stacked on mobile */}
        {!isGuest && (
          <div className="space-y-4">
            {/* AI-generated daily briefing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
            >
              <DailyBriefing />
            </motion.div>

            {/* Serendipity — resurface forgotten knowledge */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
            >
              <Serendipity />
            </motion.div>

            {/* Daily reading recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
            >
              <DailyDigest />
            </motion.div>

            {/* AI Memory summary */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.25 } }}
            >
              <UserMemoryCard />
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

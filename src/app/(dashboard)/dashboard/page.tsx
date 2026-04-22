"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { useUserStore, useIsGuest } from "@/stores/userStore";
import { getTemplate, getProactivePrompts } from "@/config/templates";
import { WidgetRenderer } from "@/components/dashboard/WidgetRenderer";
import { UserMemoryCard } from "@/components/ai/UserMemoryCard";
import { RecommendationPanel } from "@/components/ai/RecommendationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const profileType = useUserStore((state) => state.profileType);
  const progress = useUserStore((state) => state.progress);
  const isGuest = useIsGuest();

  const [showProactiveBanner, setShowProactiveBanner] = useState(true);

  const template = getTemplate(profileType || undefined);
  const proactivePrompts = getProactivePrompts(profileType || "estudiante", {
    currentStreak: progress?.currentStreak || 0,
  });

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const firstName = isGuest
    ? "Invitado"
    : session?.user?.name?.split(" ")[0] || "Usuario";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">
            {getGreeting()}, {firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            {isGuest
              ? "Explora la plataforma en modo de prueba"
              : template.welcomeMessage.split(".")[0] + "."}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/chat">
            <Sparkles className="w-4 h-4" />
            Hablar con IA
          </Link>
        </Button>
      </motion.div>

      {/* Proactive Suggestion Banner */}
      {showProactiveBanner && template.proactivePrompts && proactivePrompts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-accent/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm mb-1">Sugerencia personalizada</p>
                  <p className="text-sm text-muted-foreground">
                    {proactivePrompts[0]}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="gap-1" asChild>
                      <Link href="/study">
                        Empezar
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowProactiveBanner(false)}
                    >
                      Ahora no
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0"
                  onClick={() => setShowProactiveBanner(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Widgets — 2/3 width */}
        <div className="lg:col-span-2">
          <WidgetRenderer widgets={template.dashboardWidgets} />
        </div>

        {/* AI sidebar — 1/3 width */}
        {!isGuest && (
          <div className="space-y-4">
            {/* User AI memory card */}
            <UserMemoryCard />

            {/* Personalised recommendations */}
            <div className="rounded-xl border border-border/40 bg-card/60 p-4">
              <RecommendationPanel
                onNodeClick={(id) => {
                  window.location.href = `/library?node=${id}`;
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}




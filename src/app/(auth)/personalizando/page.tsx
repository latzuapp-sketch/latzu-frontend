"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Brain, FolderOpen, Sparkles, Target, BookOpen } from "lucide-react";

interface CreationStep {
  icon: React.ElementType;
  label: string;
  done: boolean;
  active: boolean;
}

const STEP_DURATION = 2200;

const BASE_STEPS = [
  { icon: Brain,      label: "Analizando tu perfil y personalidad…"     },
  { icon: FolderOpen, label: "Creando tus workspaces…"                   },
  { icon: BookOpen,   label: "Generando contenido inicial…"              },
  { icon: Target,     label: "Armando tu plan de 90 días…"               },
  { icon: Sparkles,   label: "¡Tu espacio está listo!"                   },
];

export default function PersonalizandoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [dynamicSteps, setDynamicSteps] = useState<{ icon: React.ElementType; label: string }[]>(BASE_STEPS);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    let onboardingData: Record<string, unknown> = {};
    let previewData: Record<string, unknown> = {};

    try {
      const raw = sessionStorage.getItem("latzu_onboarding");
      if (raw) onboardingData = JSON.parse(raw);
    } catch { /* ignore */ }

    try {
      const raw = sessionStorage.getItem("latzu_preview");
      if (raw) previewData = JSON.parse(raw);
    } catch { /* ignore */ }

    // Build dynamic step labels from the preview workspace list
    const workspaces = (previewData as { workspaces?: { title: string }[] }).workspaces ?? [];
    if (workspaces.length > 0) {
      const wsSteps = workspaces.slice(0, 3).map((ws) => ({
        icon: FolderOpen,
        label: `Creando workspace "${ws.title}"…`,
      }));
      setDynamicSteps([
        { icon: Brain,      label: "Analizando tu perfil y personalidad…" },
        ...wsSteps,
        { icon: BookOpen,   label: "Generando contenido inicial en cada área…" },
        { icon: Target,     label: "Armando tu plan de arranque…" },
        { icon: Sparkles,   label: "¡Tu espacio está listo!" },
      ]);
    }

    // Call personalize API (non-blocking)
    fetch("/api/user/personalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...onboardingData, preview: previewData }),
    }).catch(() => { /* non-blocking */ });

    // Advance steps visually
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stepsCount = workspaces.length > 0 ? 2 + Math.min(workspaces.length, 3) + 2 : BASE_STEPS.length;

    for (let i = 1; i < stepsCount; i++) {
      timers.push(setTimeout(() => setCurrentStep(i), STEP_DURATION * i));
    }

    timers.push(
      setTimeout(() => {
        try {
          sessionStorage.removeItem("latzu_onboarding");
          sessionStorage.removeItem("latzu_preview");
        } catch { /* ignore */ }
        router.push("/brain");
      }, STEP_DURATION * stepsCount + 800)
    );

    return () => timers.forEach(clearTimeout);
  }, [status, router]);

  if (status === "loading") return null;

  const steps = dynamicSteps;

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Armando tu espacio</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
          Tu IA está construyendo todo personalizado para ti
        </p>
      </motion.div>

      {/* Steps */}
      <div className="w-full space-y-2">
        <AnimatePresence>
          {steps.map((step, i) => {
            const isActive   = i === currentStep;
            const isComplete = i < currentStep;
            const isPending  = i > currentStep;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: isPending ? 0.3 : 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isActive ? "bg-primary/10 border border-primary/30" : ""
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                  isComplete ? "bg-primary text-primary-foreground" :
                  isActive   ? "bg-primary/20 text-primary"         :
                               "bg-muted text-muted-foreground"
                }`}>
                  {isComplete ? (
                    <Check className="w-4 h-4" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                </div>
                <span className={`text-sm ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

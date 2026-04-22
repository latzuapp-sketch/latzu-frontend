"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Check, Loader2, Brain, FolderOpen, BookOpen, Sparkles } from "lucide-react";

const STEPS = [
  { icon: Brain,      label: "Analizando tu perfil de aprendizaje..." },
  { icon: FolderOpen, label: "Creando tus espacios de trabajo..."     },
  { icon: BookOpen,   label: "Organizando tu grafo de conocimiento..."  },
  { icon: Sparkles,   label: "¡Todo listo para empezar!"               },
];

const STEP_DURATION = 2400;

export default function PersonalizandoPage() {
  const { status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    // Read onboarding data from sessionStorage and kick off personalization
    let onboardingData: Record<string, unknown> = {};
    try {
      const raw = sessionStorage.getItem("latzu_onboarding");
      if (raw) onboardingData = JSON.parse(raw);
    } catch { /* ignore */ }

    fetch("/api/user/personalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(onboardingData),
    }).catch(() => { /* non-blocking */ });

    // Advance steps visually
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i < STEPS.length; i++) {
      timers.push(setTimeout(() => setCurrentStep(i), STEP_DURATION * i));
    }

    // Redirect after all steps complete
    timers.push(
      setTimeout(() => {
        try { sessionStorage.removeItem("latzu_onboarding"); } catch { /* ignore */ }
        router.push("/dashboard");
      }, STEP_DURATION * STEPS.length + 800)
    );

    return () => timers.forEach(clearTimeout);
  }, [status, router]);

  if (status === "loading") return null;

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
        <h1 className="text-2xl font-bold">Preparando tu espacio</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-xs mx-auto">
          La IA está creando tu entorno de aprendizaje personalizado
        </p>
      </motion.div>

      {/* Steps list */}
      <div className="w-full space-y-3">
        {STEPS.map((step, i) => {
          const isActive   = i === currentStep;
          const isComplete = i < currentStep;
          const isPending  = i > currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isActive ? "bg-primary/10 border border-primary/30" : ""
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                isComplete ? "bg-primary text-primary-foreground" :
                isActive   ? "bg-primary/20 text-primary"          :
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
      </div>

      {/* Subtle pulsing progress bar */}
      <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary rounded-full"
          initial={{ width: "0%" }}
          animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

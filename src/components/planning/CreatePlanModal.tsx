"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CreatePlanInput, PlanType } from "@/types/planning";
import {
  X, BookOpen, Zap, ArrowRight, ArrowLeft,
  Sparkles, Loader2, Target, CalendarDays,
  CheckCircle2, Lightbulb, Wand2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 0 | 1 | 2 | 3;

interface AISuggestions {
  titles: string[];
  goalTip: string;
}

interface CreatePlanModalProps {
  onClose: () => void;
  onCreate: (input: CreatePlanInput) => Promise<unknown>;
}

// ─── Step 0: Type selector ────────────────────────────────────────────────────

const TYPE_CARDS = [
  {
    id: "study" as PlanType,
    Icon: BookOpen,
    gradient: "from-blue-500/20 to-violet-500/20",
    border: "border-blue-500/30",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    label: "Plan de Estudio",
    description: "Organiza tu aprendizaje con fases, horarios y recursos",
    examples: ["Python", "Inglés B2", "Cálculo", "Machine Learning"],
  },
  {
    id: "action" as PlanType,
    Icon: Zap,
    gradient: "from-amber-500/20 to-orange-500/20",
    border: "border-amber-500/30",
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-400",
    label: "Plan de Acción",
    description: "Ejecuta proyectos y objetivos con tareas concretas",
    examples: ["Lanzar app", "Campaña", "Startup", "Proyecto final"],
  },
];

function TypeStep({ onSelect }: { onSelect: (t: PlanType) => void }) {
  const [hovered, setHovered] = useState<PlanType | null>(null);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Paso 1 de 4</p>
        <h3 className="text-lg font-heading font-bold">¿Qué tipo de plan vas a crear?</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {TYPE_CARDS.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => onSelect(card.id)}
            onMouseEnter={() => setHovered(card.id)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative flex flex-col items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all overflow-hidden",
              hovered === card.id ? card.border : "border-border/40"
            )}
          >
            <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity", card.gradient, hovered === card.id && "opacity-100")} />
            <div className={cn("relative w-10 h-10 rounded-xl flex items-center justify-center", card.iconBg)}>
              <card.Icon className={cn("w-5 h-5", card.iconColor)} />
            </div>
            <div className="relative space-y-1">
              <p className="font-semibold text-sm">{card.label}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
            <div className="relative flex flex-wrap gap-1 mt-1">
              {card.examples.map((ex) => (
                <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground">
                  {ex}
                </span>
              ))}
            </div>
            <div className={cn(
              "absolute bottom-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all",
              hovered === card.id ? "bg-foreground/10" : "bg-transparent"
            )}>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// ─── Step 1: Name + Goal ──────────────────────────────────────────────────────

function NameGoalStep({
  type, title, setTitle, goal, setGoal, aiSuggestions, aiLoading,
}: {
  type: PlanType;
  title: string;
  setTitle: (v: string) => void;
  goal: string;
  setGoal: (v: string) => void;
  aiSuggestions: AISuggestions | null;
  aiLoading: boolean;
}) {
  const card = TYPE_CARDS.find((c) => c.id === type)!;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Paso 2 de 4</p>
        <h3 className="text-lg font-heading font-bold">Cuéntanos sobre tu plan</h3>
      </div>

      {/* Type badge */}
      <div className="flex justify-center">
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border", card.border, card.iconColor, `bg-gradient-to-r ${card.gradient}`)}>
          <card.Icon className="w-3 h-3" />
          {card.label}
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Título del plan *</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={type === "study" ? "Plan de estudio de Python desde cero" : "Lanzar la versión 2.0 del producto"}
          className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      {/* AI suggestions */}
      <AnimatePresence>
        {(aiLoading || (aiSuggestions?.titles?.length ?? 0) > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-violet-500/5 border border-violet-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-violet-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">Sugerencias de IA</span>
                {aiLoading && <Loader2 className="w-3 h-3 animate-spin ml-auto" />}
              </div>
              {!aiLoading && aiSuggestions && (
                <div className="flex flex-wrap gap-1.5">
                  {aiSuggestions.titles.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTitle(t)}
                      className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 border border-violet-500/20 hover:border-violet-500/40 transition-all"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Goal */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Meta principal *</label>
        <textarea
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="¿Qué quieres lograr? Sé específico: qué, para cuándo y cómo medirás el éxito."
          className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      {/* AI goal tip */}
      <AnimatePresence>
        {!aiLoading && aiSuggestions?.goalTip && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-300/80 leading-relaxed">{aiSuggestions.goalTip}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 2: Details ──────────────────────────────────────────────────────────

function DetailsStep({ dueDate, setDueDate }: { dueDate: string; setDueDate: (v: string) => void }) {
  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Paso 3 de 4</p>
        <h3 className="text-lg font-heading font-bold">¿Algún detalle más?</h3>
        <p className="text-xs text-muted-foreground">Puedes omitir esto y completarlo después</p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <CalendarDays className="w-3.5 h-3.5" />
          Fecha límite
          <span className="text-muted-foreground/50">(opcional)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDueDate("")}
            className={cn(
              "py-3 rounded-xl border text-sm font-medium transition-all",
              !dueDate ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border"
            )}
          >
            Sin fecha
          </button>
          <div className="relative">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={cn(
                "w-full py-3 px-3 rounded-xl border text-sm transition-all focus:outline-none cursor-pointer",
                dueDate ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-border bg-muted/20"
              )}
            />
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/20 border border-border/30 space-y-2">
        <p className="text-xs font-medium text-muted-foreground">¿Qué pasa después?</p>
        <div className="space-y-1.5">
          {[
            "Revisarás un resumen de tu plan",
            "La IA puede generar tareas automáticamente",
            "Serás redirigido a tu nuevo plan",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-primary">{i + 1}</span>
              </div>
              <p className="text-xs text-muted-foreground">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Review & Create ──────────────────────────────────────────────────

function ReviewStep({
  type, title, goal, dueDate, withAI, setWithAI,
}: {
  type: PlanType;
  title: string;
  goal: string;
  dueDate: string;
  withAI: boolean;
  setWithAI: (v: boolean) => void;
}) {
  const card = TYPE_CARDS.find((c) => c.id === type)!;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">Paso 4 de 4</p>
        <h3 className="text-lg font-heading font-bold">Todo listo para crear</h3>
      </div>

      {/* Summary card */}
      <div className={cn("p-4 rounded-2xl border-2 bg-gradient-to-br space-y-3", card.border, card.gradient)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", card.iconBg)}>
            <card.Icon className={cn("w-4 h-4", card.iconColor)} />
          </div>
          <span className={cn("text-xs font-medium", card.iconColor)}>{card.label}</span>
          {dueDate && (
            <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
              <CalendarDays className="w-3 h-3" />
              {new Date(dueDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm leading-snug">{title}</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed flex items-start gap-1.5">
            <Target className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
            {goal}
          </p>
        </div>
      </div>

      {/* AI tasks toggle */}
      <button
        type="button"
        onClick={() => setWithAI(!withAI)}
        className={cn(
          "w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left",
          withAI
            ? "border-violet-500/50 bg-violet-500/10"
            : "border-border/40 hover:border-border bg-muted/20"
        )}
      >
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors", withAI ? "bg-violet-500/20" : "bg-muted/40")}>
          <Wand2 className={cn("w-5 h-5 transition-colors", withAI ? "text-violet-400" : "text-muted-foreground/50")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm transition-colors", withAI ? "text-violet-300" : "text-foreground")}>
            Generar tareas con IA
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            La IA creará entre 4 y 8 tareas concretas y priorizadas para este plan
          </p>
        </div>
        <div
          className="shrink-0 w-10 h-6 rounded-full relative transition-colors"
          style={{ background: withAI ? "rgb(139 92 246)" : "hsl(var(--muted))" }}
        >
          <motion.div
            animate={{ x: withAI ? 18 : 2 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          />
        </div>
      </button>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function StepProgress({ step }: { step: Step }) {
  const steps = ["Tipo", "Nombre", "Detalles", "Crear"];
  return (
    <div className="flex items-center gap-2 px-1">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
              i < step ? "bg-primary text-primary-foreground" :
              i === step ? "bg-primary/20 text-primary border-2 border-primary" :
              "bg-muted/40 text-muted-foreground/50"
            )}>
              {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : i + 1}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-muted/40">
              <motion.div
                className="h-full bg-primary"
                animate={{ width: i < step ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function CreatePlanModal({ onClose, onCreate }: CreatePlanModalProps) {
  const [step, setStep] = useState<Step>(0);
  const [type, setType] = useState<PlanType>("action");
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [withAI, setWithAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestions | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { data: authSession } = useSession();

  const [sendMessage] = useMutation(SEND_MESSAGE, { client: aiClient });

  const fetchSuggestions = useCallback((t: string, g: string, planType: PlanType) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (t.trim().length < 4 && g.trim().length < 4) return;
    debounceRef.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const prompt =
          `Responde ÚNICAMENTE con JSON válido, sin texto adicional.\n` +
          `Tipo de plan: ${planType === "study" ? "estudio" : "acción"}\n` +
          `Título borrador: "${t}"\nMeta borrador: "${g}"\n` +
          `Devuelve: {"titles":["alternativa1","alternativa2","alternativa3"],"goalTip":"consejo corto para mejorar la meta"}`;
        const res = await sendMessage({
          variables: {
            input: {
              message: prompt,
              useRag: false,
              userProfile: authSession?.user
                ? { userId: (authSession.user as { id?: string }).id ?? "", name: authSession.user.name ?? "" }
                : undefined,
            },
          },
        });
        const content: string = res.data?.sendMessage?.reply ?? "";
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]) as AISuggestions;
          if (Array.isArray(parsed.titles)) setAiSuggestions(parsed);
        }
      } catch { /* silent */ } finally {
        setAiLoading(false);
      }
    }, 1000);
  }, [sendMessage, authSession]);

  // Trigger suggestions when title or goal changes (step 1 only)
  useEffect(() => {
    if (step !== 1) return;
    fetchSuggestions(title, goal, type);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [title, goal, type, step, fetchSuggestions]);

  const canAdvanceStep1 = title.trim().length >= 3 && goal.trim().length >= 5;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onCreate({ title: title.trim(), goal: goal.trim(), type, dueDate: dueDate || null, generateWithAI: withAI });
    } finally {
      setSubmitting(false);
    }
    onClose();
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
  };
  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); setStep((s) => (s + 1) as Step); };
  const goBack = () => { setDirection(-1); setStep((s) => (s - 1) as Step); };

  const handleTypeSelect = (t: PlanType) => {
    setType(t);
    setDirection(1);
    setStep(1);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border/40 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h2 className="font-heading font-bold text-base">Nuevo plan</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <StepProgress step={step} />
        </div>

        {/* Step content */}
        <div className="px-6 py-5 min-h-[340px] relative overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {step === 0 && <TypeStep onSelect={handleTypeSelect} />}
              {step === 1 && (
                <NameGoalStep
                  type={type}
                  title={title}
                  setTitle={setTitle}
                  goal={goal}
                  setGoal={setGoal}
                  aiSuggestions={aiSuggestions}
                  aiLoading={aiLoading}
                />
              )}
              {step === 2 && <DetailsStep dueDate={dueDate} setDueDate={setDueDate} />}
              {step === 3 && (
                <ReviewStep
                  type={type}
                  title={title}
                  goal={goal}
                  dueDate={dueDate}
                  withAI={withAI}
                  setWithAI={setWithAI}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer (not shown on step 0 — clicking a card advances) */}
        {step > 0 && (
          <div className="px-6 pb-6 flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={goBack} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Atrás
            </Button>
            <div className="flex-1" />
            {step < 3 ? (
              <Button
                type="button"
                size="sm"
                onClick={goNext}
                disabled={step === 1 && !canAdvanceStep1}
                className="gap-1.5 px-5"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  "gap-2 px-6 font-semibold",
                  withAI && "bg-violet-600 hover:bg-violet-700"
                )}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : withAI ? (
                  <Wand2 className="w-4 h-4" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                {withAI ? "Crear y generar tareas" : "Crear plan"}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

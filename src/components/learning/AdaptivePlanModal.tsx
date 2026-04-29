"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Sparkles, Loader2, Check,
  BookOpen, Hammer, Layers, Target, Briefcase, FlaskConical,
  Heart, GraduationCap, Clock, Calendar, Timer,
  Brain, ChevronRight, Lightbulb, Zap, TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  topic: string;
  extraContext: string;
  hoursPerDay: number;
  daysAvailable: number;
  sessionMinutes: number;
  learningStyle: "reading" | "practice" | "mixed";
  motivation: "exam" | "job" | "project" | "curiosity";
  knownConcepts: string[];
  weakAreas: string[];
}

interface Suggestions {
  known_concept_examples: string[];
  weak_area_examples: string[];
  recommended_session_minutes: number;
  recommended_hours_per_day: number;
  recommended_days: number;
  difficulty_note: string;
  style_hint: "reading" | "practice" | "mixed";
  topic_tags: string[];
}

interface AdaptivePlanResult {
  plan_id: string;
  objective: string;
  concept_count: number;
  total_credits: number;
  earned_credits: number;
  daily_target: number;
  days_available: number;
  end_date: string;
  known_concepts_matched: number;
  weak_areas_matched: number;
  created: boolean;
  error?: string;
}

interface Props {
  onClose: () => void;
  onCreated?: (result: AdaptivePlanResult) => void;
}

const TOTAL_STEPS = 4;

// ─── Static config ────────────────────────────────────────────────────────────

const QUICK_TOPICS = [
  { label: "Python", emoji: "🐍" },
  { label: "Machine Learning", emoji: "🤖" },
  { label: "JavaScript", emoji: "⚡" },
  { label: "SQL", emoji: "🗄️" },
  { label: "Cálculo", emoji: "📐" },
  { label: "Inglés", emoji: "🌎" },
  { label: "Álgebra lineal", emoji: "📊" },
  { label: "React", emoji: "⚛️" },
  { label: "Docker", emoji: "🐳" },
  { label: "Estadística", emoji: "📈" },
];

const LEARNING_STYLES = [
  {
    value: "reading" as const,
    label: "Teoría",
    description: "Explicaciones y conceptos",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    activeBg: "bg-blue-500/20 border-blue-500",
  },
  {
    value: "practice" as const,
    label: "Práctica",
    description: "Ejercicios y proyectos",
    icon: Hammer,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    activeBg: "bg-amber-500/20 border-amber-500",
  },
  {
    value: "mixed" as const,
    label: "Mixto",
    description: "Combino ambos",
    icon: Layers,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/30",
    activeBg: "bg-violet-500/20 border-violet-500",
  },
];

const MOTIVATIONS = [
  {
    value: "exam" as const,
    label: "Examen o certificación",
    description: "Tengo una fecha límite próxima",
    icon: GraduationCap,
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/30",
    activeBg: "bg-rose-500/20 border-rose-500",
  },
  {
    value: "job" as const,
    label: "Trabajo o carrera",
    description: "Lo necesito para mi desarrollo profesional",
    icon: Briefcase,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-500/20 border-emerald-500",
  },
  {
    value: "project" as const,
    label: "Proyecto concreto",
    description: "Tengo algo que quiero construir",
    icon: FlaskConical,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
    activeBg: "bg-cyan-500/20 border-cyan-500",
  },
  {
    value: "curiosity" as const,
    label: "Curiosidad / hobby",
    description: "Aprendo porque me apasiona el tema",
    icon: Heart,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/30",
    activeBg: "bg-pink-500/20 border-pink-500",
  },
];

const SESSION_OPTIONS = [15, 20, 30, 45, 60, 90];
const HOURS_OPTIONS   = [0.5, 1, 1.5, 2, 3, 4];
const DAYS_OPTIONS    = [7, 14, 21, 30, 45, 60, 90];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const labels = ["Tema", "Ritmo", "Estilo", "Conocimiento"];
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {labels.map((label, i) => {
        const s = i + 1;
        const done   = s < step;
        const active = s === step;
        return (
          <div key={s} className="flex items-center gap-1.5">
            <div className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
              done   ? "bg-primary text-primary-foreground" :
              active ? "bg-primary/20 text-primary ring-2 ring-primary/40" :
                       "bg-muted text-muted-foreground"
            )}>
              {done ? <Check className="w-3 h-3" /> : s}
            </div>
            <span className={cn(
              "text-xs hidden sm:block transition-colors",
              active ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {label}
            </span>
            {s < labels.length && (
              <ChevronRight className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Skeleton shimmer for loading states */
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-muted/50", className)} />
  );
}

/** Clickable suggestion chip */
function SuggestionChip({
  label, selected, onClick,
  colorClass = "border-border/60 text-muted-foreground hover:border-primary/50 hover:text-foreground",
  selectedClass = "border-primary/60 bg-primary/10 text-primary",
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  colorClass?: string;
  selectedClass?: string;
}) {
  return (
    <motion.button
      layout
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all",
        selected ? selectedClass : colorClass
      )}
    >
      {selected && <Check className="w-2.5 h-2.5 flex-shrink-0" />}
      {label}
    </motion.button>
  );
}

/** Tag input with optional suggestion chips */
function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  suggestions = [],
  suggestionsLoading = false,
  colorClass = "bg-primary/10 text-primary border-primary/30",
  chipSelectedClass,
  chipColorClass,
  icon: Icon,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  suggestionsLoading?: boolean;
  colorClass?: string;
  chipSelectedClass?: string;
  chipColorClass?: string;
  icon?: React.ElementType;
}) {
  const [draft, setDraft] = useState("");

  const add = (val: string) => {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  const toggleSuggestion = (s: string) => {
    tags.includes(s) ? remove(s) : add(s);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); setDraft(""); }
    if (e.key === "Backspace" && !draft && tags.length) remove(tags[tags.length - 1]);
  };

  return (
    <div className="space-y-2.5">
      <Label className="flex items-center gap-1.5 text-sm">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground" />}
        {label}
      </Label>

      {/* Suggestion chips */}
      {(suggestionsLoading || suggestions.length > 0) && (
        <div className="space-y-1.5">
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            <Sparkles className="w-2.5 h-2.5" />
            Sugerencias IA
            {suggestionsLoading && <Loader2 className="w-2.5 h-2.5 animate-spin ml-1" />}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestionsLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className={cn("h-6 rounded-full", i % 3 === 0 ? "w-20" : i % 3 === 1 ? "w-28" : "w-16")} />
                ))
              : suggestions.map((s) => (
                  <SuggestionChip
                    key={s}
                    label={s}
                    selected={tags.includes(s)}
                    onClick={() => toggleSuggestion(s)}
                    colorClass={chipColorClass}
                    selectedClass={chipSelectedClass}
                  />
                ))
            }
          </div>
        </div>
      )}

      {/* Tag input */}
      <div className="min-h-[2.5rem] flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring">
        {tags.map((t) => (
          <span key={t} className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", colorClass)}>
            {t}
            <button type="button" onClick={() => remove(t)} className="hover:opacity-70 ml-0.5">
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => { if (draft.trim()) { add(draft); setDraft(""); } }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-[11px] text-muted-foreground">Clic en sugerencia o escribe y presiona Enter</p>
    </div>
  );
}

/** Insight pill — shown in steps 2 & 3 based on suggestions */
function InsightPill({ text, icon: Icon = Lightbulb }: { text: string; icon?: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground"
    >
      <Icon className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
      <span>{text}</span>
    </motion.div>
  );
}

// ─── Result screen ────────────────────────────────────────────────────────────

function ResultScreen({ result, onClose }: { result: AdaptivePlanResult; onClose: () => void }) {
  const pct = result.total_credits > 0
    ? Math.round((result.earned_credits / result.total_credits) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-5 py-2"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center mx-auto"
      >
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </motion.div>

      <div>
        <h3 className="text-xl font-bold">¡Plan creado!</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">{result.objective}</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5 text-left">
        {[
          { label: "Conceptos", value: result.concept_count, icon: Brain },
          { label: "Créditos", value: result.total_credits, icon: TrendingUp },
          { label: "Progreso inicial", value: `${pct}%`, icon: Zap, highlight: pct > 0 },
          { label: "Días disponibles", value: result.days_available, icon: Calendar },
        ].map(({ label, value, icon: Icon, highlight }) => (
          <div key={label} className="rounded-xl border border-border/50 bg-muted/20 p-3 flex items-start gap-2.5">
            <Icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", highlight ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className={cn("text-lg font-bold tabular-nums leading-tight", highlight && "text-primary")}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {(result.known_concepts_matched > 0 || result.weak_areas_matched > 0) && (
        <div className="flex justify-center gap-3 flex-wrap text-xs">
          {result.known_concepts_matched > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Check className="w-3 h-3" />
              {result.known_concepts_matched} conceptos saltados
            </span>
          )}
          {result.weak_areas_matched > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Target className="w-3 h-3" />
              {result.weak_areas_matched} áreas priorizadas
            </span>
          )}
        </div>
      )}

      <Button onClick={onClose} className="w-full">
        Comenzar a estudiar
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </motion.div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function AdaptivePlanModal({ onClose, onCreated }: Props) {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [result, setResult]   = useState<AdaptivePlanResult | null>(null);

  const [suggestions, setSuggestions]               = useState<Suggestions | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  // Track whether the user has manually changed rhythm defaults
  const rhythmTouched = useRef(false);

  const [form, setForm] = useState<FormData>({
    topic: "",
    extraContext: "",
    hoursPerDay: 1,
    daysAvailable: 30,
    sessionMinutes: 30,
    learningStyle: "mixed",
    motivation: "curiosity",
    knownConcepts: [],
    weakAreas: [],
  });

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) => {
    // Mark rhythm as touched when user picks those fields manually
    if (["hoursPerDay", "daysAvailable", "sessionMinutes"].includes(key)) {
      rhythmTouched.current = true;
    }
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const canProceed = () => step !== 1 || form.topic.trim().length >= 3;

  // ── Fetch suggestions when leaving step 1 ────────────────────────────────
  const fetchSuggestions = async (topic: string) => {
    if (!topic.trim() || suggestionsLoading || suggestions) return;
    setSuggestionsLoading(true);
    try {
      const res = await fetch("/api/learning/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), experience_level: "beginner" }),
      });
      if (!res.ok) return;
      const data: Suggestions = await res.json();
      setSuggestions(data);

      // Apply recommended rhythm defaults only if user hasn't touched them
      if (!rhythmTouched.current) {
        setForm((prev) => ({
          ...prev,
          sessionMinutes: data.recommended_session_minutes,
          hoursPerDay: data.recommended_hours_per_day,
          daysAvailable: data.recommended_days,
          learningStyle: data.style_hint,
        }));
      }
    } catch { /* non-blocking */ }
    finally { setSuggestionsLoading(false); }
  };

  const goNext = () => {
    if (step === 1) fetchSuggestions(form.topic);
    setStep((s) => s + 1);
  };

  // ── Build prompt text ─────────────────────────────────────────────────────
  const buildPromptText = (): string => {
    const motivationMap: Record<string, string> = {
      exam: "Estoy estudiando para un examen o certificación próxima.",
      job: "Lo necesito para mi trabajo y desarrollo profesional.",
      project: "Tengo un proyecto concreto que quiero construir.",
      curiosity: "Aprendo por curiosidad e interés personal.",
    };
    const styleMap: Record<string, string> = {
      reading: "Prefiero aprender con teoría, lecturas y explicaciones.",
      practice: "Prefiero aprender con ejercicios, código y práctica directa.",
      mixed: "Me gusta combinar teoría con práctica.",
    };
    const parts = [
      `Quiero aprender ${form.topic.trim()}.`,
      form.extraContext.trim(),
      motivationMap[form.motivation],
      styleMap[form.learningStyle],
      `Puedo estudiar ${form.hoursPerDay} hora${form.hoursPerDay !== 1 ? "s" : ""} al día durante ${form.daysAvailable} días.`,
      `Prefiero sesiones de ${form.sessionMinutes} minutos.`,
      form.knownConcepts.length > 0 ? `Ya conozco: ${form.knownConcepts.join(", ")}.` : "",
      form.weakAreas.length > 0 ? `Me cuesta: ${form.weakAreas.join(", ")}.` : "",
    ].filter(Boolean);
    return parts.join(" ");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/learning/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: buildPromptText() }),
      });
      const data = await res.json();
      if (!res.ok || data.error || data.created === false) {
        setError(data.error ?? "No se pudo crear el plan. Intenta de nuevo.");
        return;
      }
      setResult(data);
      onCreated?.(data);
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Plan adaptativo</h2>
              <p className="text-xs text-muted-foreground">Personalizado con IA</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          {result ? (
            <ResultScreen result={result} onClose={onClose} />
          ) : (
            <>
              <StepIndicator step={step} />

              <AnimatePresence mode="wait">

                {/* ── Step 1: Tema ──────────────────────────────────── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                    <div>
                      <h3 className="font-semibold">¿Qué quieres aprender?</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        La IA analizará tu tema y sugerirá el plan más relevante.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tema principal <span className="text-destructive">*</span></Label>
                      <Input
                        autoFocus
                        placeholder="Ej. Python para machine learning, Cálculo diferencial…"
                        value={form.topic}
                        onChange={(e) => set("topic", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) goNext(); }}
                      />
                    </div>

                    {/* Quick topic chips */}
                    <div className="space-y-1.5">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
                        Temas frecuentes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_TOPICS.map(({ label, emoji }) => (
                          <motion.button
                            key={label}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => set("topic", label)}
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs border transition-all",
                              form.topic === label
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                            )}
                          >
                            {emoji} {label}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Contexto adicional
                        <span className="text-xs text-muted-foreground font-normal ml-1">(opcional)</span>
                      </Label>
                      <Textarea
                        placeholder="Ej. Tengo un examen en 3 semanas, quiero especializarme en visión por computadora…"
                        value={form.extraContext}
                        onChange={(e) => set("extraContext", e.target.value)}
                        className="resize-none text-sm h-20"
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Ritmo ─────────────────────────────────── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Tu ritmo de estudio</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">El plan se adapta a tu tiempo real.</p>
                    </div>

                    {/* Difficulty insight */}
                    {suggestionsLoading ? (
                      <Skeleton className="h-9 w-full" />
                    ) : suggestions?.difficulty_note ? (
                      <InsightPill text={suggestions.difficulty_note} icon={Lightbulb} />
                    ) : null}

                    {/* Hours per day */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Horas disponibles al día
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((h) => {
                          const isRec = suggestions?.recommended_hours_per_day === h;
                          return (
                            <button
                              key={h}
                              onClick={() => set("hoursPerDay", h)}
                              className={cn(
                                "relative px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                                form.hoursPerDay === h
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {h < 1 ? "30 min" : `${h}h`}
                              {isRec && form.hoursPerDay !== h && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                  <Sparkles className="w-2 h-2 text-primary-foreground" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Days available */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Días disponibles
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OPTIONS.map((d) => {
                          const isRec = suggestions?.recommended_days === d;
                          return (
                            <button
                              key={d}
                              onClick={() => set("daysAvailable", d)}
                              className={cn(
                                "relative px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                                form.daysAvailable === d
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {d < 30 ? `${d}d` : d === 30 ? "1 mes" : d === 60 ? "2 meses" : "3 meses"}
                              {isRec && form.daysAvailable !== d && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                  <Sparkles className="w-2 h-2 text-primary-foreground" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Session duration */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                        Duración de cada sesión
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {SESSION_OPTIONS.map((m) => {
                          const isRec = suggestions?.recommended_session_minutes === m;
                          return (
                            <button
                              key={m}
                              onClick={() => set("sessionMinutes", m)}
                              className={cn(
                                "relative px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                                form.sessionMinutes === m
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {m} min
                              {isRec && form.sessionMinutes !== m && (
                                <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                                  <Sparkles className="w-2 h-2 text-primary-foreground" />
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Estilo + Motivación ────────────────────── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Cómo aprendes y por qué</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Personaliza el tipo de ejercicios y la urgencia del plan.
                      </p>
                    </div>

                    {/* Style insight */}
                    {suggestions?.style_hint && (
                      <InsightPill
                        text={`Para "${form.topic}", la IA recomienda el estilo "${
                          LEARNING_STYLES.find(s => s.value === suggestions.style_hint)?.label ?? suggestions.style_hint
                        }".`}
                        icon={Sparkles}
                      />
                    )}

                    {/* Learning style */}
                    <div className="space-y-2">
                      <Label>Estilo de aprendizaje</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {LEARNING_STYLES.map((ls) => {
                          const isRec = suggestions?.style_hint === ls.value;
                          return (
                            <button
                              key={ls.value}
                              onClick={() => set("learningStyle", ls.value)}
                              className={cn(
                                "relative p-3 rounded-xl border-2 text-left transition-all space-y-1.5",
                                form.learningStyle === ls.value ? ls.activeBg : `${ls.bg} hover:opacity-80`
                              )}
                            >
                              {isRec && (
                                <span className="absolute top-1.5 right-1.5 flex items-center gap-0.5 text-[9px] text-primary font-semibold">
                                  <Sparkles className="w-2 h-2" />
                                </span>
                              )}
                              <ls.icon className={cn("w-4 h-4", ls.color)} />
                              <p className="text-xs font-semibold leading-tight">{ls.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight">{ls.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Topic tags */}
                    {suggestions?.topic_tags && suggestions.topic_tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Área:</span>
                        {suggestions.topic_tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] bg-muted/40 border border-border/40 text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Motivation */}
                    <div className="space-y-2">
                      <Label>¿Qué te motiva?</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {MOTIVATIONS.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => set("motivation", m.value)}
                            className={cn(
                              "p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2",
                              form.motivation === m.value ? m.activeBg : `${m.bg} hover:opacity-80`
                            )}
                          >
                            <m.icon className={cn("w-4 h-4 mt-0.5 shrink-0", m.color)} />
                            <div>
                              <p className="text-xs font-semibold leading-tight">{m.label}</p>
                              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{m.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 4: Conocimiento previo ─────────────────────── */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                    <div>
                      <h3 className="font-semibold">Tu conocimiento actual</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        El sistema salta lo que ya sabes y prioriza lo que más te cuesta.
                      </p>
                    </div>

                    <TagInput
                      label="¿Qué ya dominas?"
                      placeholder="Escribe o elige de las sugerencias…"
                      tags={form.knownConcepts}
                      onChange={(tags) => set("knownConcepts", tags)}
                      suggestions={suggestions?.known_concept_examples ?? []}
                      suggestionsLoading={suggestionsLoading}
                      colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      chipSelectedClass="border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      chipColorClass="border-emerald-500/30 text-emerald-400/70 hover:border-emerald-500/60 hover:text-emerald-400"
                      icon={Check}
                    />

                    <TagInput
                      label="¿Qué te cuesta o quieres reforzar?"
                      placeholder="Escribe o elige de las sugerencias…"
                      tags={form.weakAreas}
                      onChange={(tags) => set("weakAreas", tags)}
                      suggestions={suggestions?.weak_area_examples ?? []}
                      suggestionsLoading={suggestionsLoading}
                      colorClass="bg-amber-500/10 text-amber-400 border-amber-500/30"
                      chipSelectedClass="border-amber-500 bg-amber-500/20 text-amber-400"
                      chipColorClass="border-amber-500/30 text-amber-400/70 hover:border-amber-500/60 hover:text-amber-400"
                      icon={AlertTriangle}
                    />

                    {error && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </>
          )}
        </div>

        {/* Footer navigation */}
        {!result && (
          <div className="flex justify-between px-6 py-4 border-t border-border/30 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStep((s) => s - 1)}
              disabled={step === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Anterior
            </Button>

            {step < TOTAL_STEPS ? (
              <Button size="sm" onClick={goNext} disabled={!canProceed()}>
                {step === 1 && form.topic.trim().length >= 3 ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    Analizar tema
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            ) : (
              <Button size="sm" onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Creando plan…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Crear plan adaptativo
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

"use client";

import { useState, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ArrowRight, ArrowLeft, Sparkles, Loader2, Check,
  BookOpen, Hammer, Layers, Target, Briefcase, FlaskConical,
  Heart, GraduationCap, Clock, Calendar, Timer, Plus,
  Brain, ChevronRight,
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

// ─── Option config ────────────────────────────────────────────────────────────

const LEARNING_STYLES = [
  {
    value: "reading" as const,
    label: "Teoría y lectura",
    description: "Prefiero leer explicaciones y estudiar conceptos",
    icon: BookOpen,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
    activeBg: "bg-blue-500/20 border-blue-500",
  },
  {
    value: "practice" as const,
    label: "Ejercicios y práctica",
    description: "Aprendo haciendo: código, problemas, proyectos",
    icon: Hammer,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    activeBg: "bg-amber-500/20 border-amber-500",
  },
  {
    value: "mixed" as const,
    label: "Mixto",
    description: "Combino teoría con práctica según el tema",
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
    description: "Lo necesito para mi trabajo o proyección profesional",
    icon: Briefcase,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/30",
    activeBg: "bg-emerald-500/20 border-emerald-500",
  },
  {
    value: "project" as const,
    label: "Proyecto concreto",
    description: "Tengo algo que quiero construir o terminar",
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

// ─── Tag input ────────────────────────────────────────────────────────────────

function TagInput({
  label, placeholder, tags, onChange, colorClass = "bg-primary/10 text-primary border-primary/30",
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  colorClass?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const val = draft.trim();
    if (val && !tags.includes(val)) onChange([...tags, val]);
    setDraft("");
  };

  const remove = (t: string) => onChange(tags.filter((x) => x !== t));

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !draft && tags.length) remove(tags[tags.length - 1]);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      <div className="min-h-[2.5rem] flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring">
        {tags.map((t) => (
          <span
            key={t}
            className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border", colorClass)}
          >
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
          onBlur={add}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
      <p className="text-xs text-muted-foreground">Presiona Enter o coma para agregar cada item</p>
    </div>
  );
}

// ─── Step content ─────────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const labels = ["Tema", "Ritmo", "Estilo", "Conocimiento"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {labels.map((label, i) => {
        const s = i + 1;
        const done = s < step;
        const active = s === step;
        return (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
              done   ? "bg-primary text-primary-foreground" :
              active ? "bg-primary/20 text-primary ring-2 ring-primary/50" :
                       "bg-muted text-muted-foreground"
            )}>
              {done ? <Check className="w-3.5 h-3.5" /> : s}
            </div>
            <span className={cn("text-xs hidden sm:block", active ? "text-foreground font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {s < labels.length && <ChevronRight className="w-3 h-3 text-muted-foreground/40" />}
          </div>
        );
      })}
    </div>
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
      className="text-center space-y-6 py-2"
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center mx-auto">
        <Sparkles className="w-8 h-8 text-primary-foreground" />
      </div>

      <div>
        <h3 className="text-xl font-bold">¡Plan creado!</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-xs mx-auto">{result.objective}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-left">
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Conceptos</p>
          <p className="text-xl font-bold tabular-nums">{result.concept_count}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Créditos totales</p>
          <p className="text-xl font-bold tabular-nums">{result.total_credits}</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Progreso inicial</p>
          <p className="text-xl font-bold tabular-nums text-primary">{pct}%</p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-0.5">
          <p className="text-xs text-muted-foreground">Días disponibles</p>
          <p className="text-xl font-bold tabular-nums">{result.days_available}</p>
        </div>
      </div>

      {(result.known_concepts_matched > 0 || result.weak_areas_matched > 0) && (
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          {result.known_concepts_matched > 0 && (
            <span className="flex items-center gap-1 text-emerald-400">
              <Check className="w-3 h-3" />
              {result.known_concepts_matched} conceptos ya dominados marcados
            </span>
          )}
          {result.weak_areas_matched > 0 && (
            <span className="flex items-center gap-1 text-amber-400">
              <Target className="w-3 h-3" />
              {result.weak_areas_matched} áreas débiles priorizadas
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

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const canProceed = (): boolean => {
    if (step === 1) return form.topic.trim().length >= 3;
    return true;
  };

  // Build rich text from all form fields for the backend LLM
  const buildPromptText = (): string => {
    const parts: string[] = [];

    parts.push(`Quiero aprender ${form.topic.trim()}.`);

    if (form.extraContext.trim()) {
      parts.push(form.extraContext.trim());
    }

    const motivationMap: Record<string, string> = {
      exam: "Estoy estudiando para un examen o certificación próxima.",
      job: "Lo necesito para mi trabajo y desarrollo profesional.",
      project: "Tengo un proyecto concreto que quiero construir.",
      curiosity: "Aprendo por curiosidad e interés personal.",
    };
    parts.push(motivationMap[form.motivation]);

    const styleMap: Record<string, string> = {
      reading: "Prefiero aprender con teoría, lecturas y explicaciones detalladas.",
      practice: "Prefiero aprender con ejercicios, código y práctica directa.",
      mixed: "Me gusta combinar teoría con práctica.",
    };
    parts.push(styleMap[form.learningStyle]);

    parts.push(
      `Puedo estudiar ${form.hoursPerDay} hora${form.hoursPerDay !== 1 ? "s" : ""} al día durante ${form.daysAvailable} días.`
    );
    parts.push(`Prefiero sesiones de ${form.sessionMinutes} minutos.`);

    if (form.knownConcepts.length > 0) {
      parts.push(`Ya conozco o domino: ${form.knownConcepts.join(", ")}.`);
    }
    if (form.weakAreas.length > 0) {
      parts.push(`Me cuesta o quiero reforzar: ${form.weakAreas.join(", ")}.`);
    }

    return parts.join(" ");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const text = buildPromptText();
      const res = await fetch("/api/learning/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
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
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
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

        <div className="px-6 py-5">
          {result ? (
            <ResultScreen result={result} onClose={onClose} />
          ) : (
            <>
              <StepIndicator step={step} />

              <AnimatePresence mode="wait">

                {/* ── Step 1: Tema ── */}
                {step === 1 && (
                  <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-0.5">¿Qué quieres aprender?</h3>
                      <p className="text-sm text-muted-foreground">La IA buscará el mejor plan de estudios para tu objetivo.</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Tema principal <span className="text-destructive">*</span></Label>
                      <Input
                        autoFocus
                        placeholder="Ej. Python para machine learning, Cálculo diferencial, SQL…"
                        value={form.topic}
                        onChange={(e) => set("topic", e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && canProceed()) setStep(2); }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-1">
                        Contexto adicional
                        <span className="text-xs text-muted-foreground font-normal ml-1">(opcional)</span>
                      </Label>
                      <Textarea
                        placeholder="Ej. Necesito preparar un examen en 3 semanas, quiero especializarme en visión por computadora, estudié algo antes pero me olvidé…"
                        value={form.extraContext}
                        onChange={(e) => set("extraContext", e.target.value)}
                        className="resize-none text-sm h-24"
                      />
                    </div>
                  </motion.div>
                )}

                {/* ── Step 2: Ritmo ── */}
                {step === 2 && (
                  <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                    <div>
                      <h3 className="font-semibold mb-0.5">Tu ritmo de estudio</h3>
                      <p className="text-sm text-muted-foreground">El plan se adaptará a tu disponibilidad real.</p>
                    </div>

                    {/* Hours per day */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                        Horas disponibles al día
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((h) => (
                          <button
                            key={h}
                            onClick={() => set("hoursPerDay", h)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                              form.hoursPerDay === h
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {h < 1 ? "30 min" : `${h}h`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Days available */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        Días disponibles (plazo)
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {DAYS_OPTIONS.map((d) => (
                          <button
                            key={d}
                            onClick={() => set("daysAvailable", d)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                              form.daysAvailable === d
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {d < 30 ? `${d} días` : d === 30 ? "1 mes" : d === 60 ? "2 meses" : "3 meses"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Session duration */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                        Duración de cada sesión
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {SESSION_OPTIONS.map((m) => (
                          <button
                            key={m}
                            onClick={() => set("sessionMinutes", m)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-sm font-medium transition-all",
                              form.sessionMinutes === m
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {m} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── Step 3: Estilo + Motivación ── */}
                {step === 3 && (
                  <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                    <div>
                      <h3 className="font-semibold mb-0.5">Cómo aprendes y por qué</h3>
                      <p className="text-sm text-muted-foreground">Esto personaliza el tipo de ejercicios y la urgencia del plan.</p>
                    </div>

                    {/* Learning style */}
                    <div className="space-y-2">
                      <Label>Estilo de aprendizaje preferido</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {LEARNING_STYLES.map((ls) => (
                          <button
                            key={ls.value}
                            onClick={() => set("learningStyle", ls.value)}
                            className={cn(
                              "p-3 rounded-xl border-2 text-left transition-all space-y-1.5",
                              form.learningStyle === ls.value ? ls.activeBg : `${ls.bg} hover:opacity-80`
                            )}
                          >
                            <ls.icon className={cn("w-4 h-4", ls.color)} />
                            <p className="text-xs font-semibold leading-tight">{ls.label}</p>
                            <p className="text-[10px] text-muted-foreground leading-tight">{ls.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Motivation */}
                    <div className="space-y-2">
                      <Label>¿Qué te motiva a aprenderlo?</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {MOTIVATIONS.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => set("motivation", m.value)}
                            className={cn(
                              "p-3 rounded-xl border-2 text-left transition-all flex items-start gap-2.5",
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

                {/* ── Step 4: Conocimiento previo ── */}
                {step === 4 && (
                  <motion.div key="s4" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-5">
                    <div>
                      <h3 className="font-semibold mb-0.5">Tu conocimiento actual</h3>
                      <p className="text-sm text-muted-foreground">
                        Opcional — el sistema pre-configura tu punto de inicio y prioriza lo que más necesitas.
                      </p>
                    </div>

                    <TagInput
                      label="¿Qué ya dominas?"
                      placeholder="Ej. álgebra lineal, SQL, variables…"
                      tags={form.knownConcepts}
                      onChange={(tags) => set("knownConcepts", tags)}
                      colorClass="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    />

                    <TagInput
                      label="¿Qué te cuesta o quieres reforzar?"
                      placeholder="Ej. recursión, estadística, derivadas…"
                      tags={form.weakAreas}
                      onChange={(tags) => set("weakAreas", tags)}
                      colorClass="bg-amber-500/10 text-amber-400 border-amber-500/30"
                    />

                    {error && (
                      <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                        {error}
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation */}
              <div className="flex justify-between mt-6 pt-4 border-t border-border/30">
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
                  <Button
                    size="sm"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={!canProceed()}
                  >
                    Siguiente
                    <ArrowRight className="w-4 h-4 ml-1.5" />
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
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

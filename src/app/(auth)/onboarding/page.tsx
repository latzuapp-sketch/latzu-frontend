"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/stores/userStore";
import type { ProfileType, OnboardingData, LearningStyle } from "@/types/user";
import {
  GraduationCap,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Eye,
  Headphones,
  BookOpen,
  Hammer,
  MapPin,
  School,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Config ───────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5;

const profileOptions = [
  {
    type: "estudiante" as ProfileType,
    icon: GraduationCap,
    title: "Estudiante universitario",
    description: "Estoy cursando una carrera en la universidad",
    features: ["Materias organizadas", "Tutor IA 24/7", "Planes de estudio"],
    color: "from-teal-500 to-emerald-500",
  },
  {
    type: "aprendiz" as ProfileType,
    icon: Lightbulb,
    title: "Aprendiz independiente",
    description: "Quiero estudiar y aprender de forma autodidacta",
    features: ["Aprendizaje a mi ritmo", "Rutas personalizadas", "Tutor IA 24/7"],
    color: "from-violet-500 to-purple-500",
  },
];

const experienceLevels = [
  { value: "beginner", label: "Principiante", description: "Estoy comenzando desde cero" },
  { value: "intermediate", label: "Intermedio", description: "Tengo bases sólidas" },
  { value: "advanced", label: "Avanzado", description: "Tengo amplia experiencia" },
] as const;

const learningStyles: Array<{
  value: LearningStyle;
  label: string;
  description: string;
  icon: typeof Eye;
}> = [
  { value: "visual",      label: "Visual",             description: "Aprendo con imágenes, gráficos y videos", icon: Eye },
  { value: "auditivo",    label: "Auditivo",            description: "Aprendo escuchando y en discusiones",     icon: Headphones },
  { value: "lectura",     label: "Lectura / Escritura", description: "Aprendo leyendo y tomando notas",         icon: BookOpen },
  { value: "kinestesico", label: "Kinestésico",         description: "Aprendo practicando y experimentando",    icon: Hammer },
];

const interestOptions = [
  "Tecnología", "Negocios", "Creatividad", "Liderazgo",
  "Comunicación", "Análisis de datos", "Marketing", "Finanzas",
  "Desarrollo personal", "Idiomas", "Ciencias", "Arte",
  "Salud", "Derecho", "Ingeniería", "Educación",
];

const SEMESTERS = ["1°", "2°", "3°", "4°", "5°", "6°", "7°", "8°", "9°", "10°", "11°", "12°"];

const COUNTRIES = [
  "Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador",
  "Venezuela", "Bolivia", "Uruguay", "Paraguay", "Costa Rica",
  "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Panamá",
  "República Dominicana", "Cuba", "España", "Estados Unidos", "Otro",
];

const UNIVERSITIES = [
  "Universidad de los Andes",
  "Universidad Nacional de Colombia",
  "Pontificia Universidad Javeriana",
  "Universidad del Rosario",
  "Universidad EAFIT",
  "Universidad de Antioquia",
  "Universidad del Norte",
  "Universidad Externado de Colombia",
  "Universidad de la Sabana",
  "Universidad Distrital Francisco José de Caldas",
  "Universidad del Valle",
  "Universidad Autónoma de Colombia",
  "Universidad Cooperativa de Colombia",
  "Universidad Libre",
  "Universidad Piloto de Colombia",
  "Universidad Sergio Arboleda",
  "Universidad de Bogotá Jorge Tadeo Lozano",
  "Universidad EAN",
  "ICESI",
  "Universidad CES",
  "Universidad Tecnológica de Pereira",
  "Universidad Industrial de Santander",
  "Universidad Surcolombiana",
  "Universidad de Nariño",
  "Universidad Pedagógica Nacional",
  "Otra",
];

const CAREERS = [
  "Administración de Empresas",
  "Arquitectura",
  "Biología",
  "Ciencias Políticas",
  "Comunicación Social",
  "Contaduría Pública",
  "Derecho",
  "Diseño Gráfico",
  "Economía",
  "Educación",
  "Enfermería",
  "Filosofía",
  "Finanzas y Comercio Internacional",
  "Física",
  "Historia",
  "Ingeniería Civil",
  "Ingeniería de Sistemas",
  "Ingeniería Electrónica",
  "Ingeniería Industrial",
  "Ingeniería Mecánica",
  "Literatura",
  "Marketing y Publicidad",
  "Matemáticas",
  "Medicina",
  "Nutrición y Dietética",
  "Psicología",
  "Química",
  "Trabajo Social",
  "Veterinaria",
  "Otra",
];

const GOAL_EXAMPLES: Record<ProfileType, string[]> = {
  estudiante: [
    "Aprobar todas mis materias este semestre",
    "Mejorar mis habilidades en programación",
    "Preparar y defender mi tesis de grado",
    "Conseguir una beca o intercambio",
    "Aprender inglés a nivel profesional",
    "Hacer mis primeras prácticas empresariales",
  ],
  aprendiz: [
    "Aprender programación desde cero",
    "Dominar el inglés conversacional",
    "Estudiar para una certificación profesional",
    "Explorar diseño gráfico y UX",
    "Entender economía y finanzas personales",
    "Preparar un examen de admisión",
  ],
};

// ─── Shared select styles ─────────────────────────────────────────────────────

const selectCn = cn(
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "dark:bg-input/30 text-foreground disabled:opacity-50"
);

// ─── Step labels by profile ───────────────────────────────────────────────────

function getStepLabel(step: number, profileType?: ProfileType): string {
  const labels: Record<number, string> = {
    1: "Perfil",
    2: profileType === "estudiante" ? "Universidad" : "Contexto",
    3: "Experiencia",
    4: "Intereses",
    5: "Metas",
  };
  return labels[step] ?? String(step);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setProfileType = useUserStore((state) => state.setProfileType);

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({ goals: [], interests: [] });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // ── helpers ────────────────────────────────────────────────────────────────

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggle = <K extends "interests">(key: K, item: string) =>
    setData((prev) => ({
      ...prev,
      [key]: (prev[key] as string[])?.includes(item)
        ? (prev[key] as string[]).filter((x) => x !== item)
        : [...((prev[key] as string[]) || []), item],
    }));

  const addGoal = (goal: string) => {
    if (goal.trim() && !data.goals?.includes(goal.trim())) {
      set("goals", [...(data.goals ?? []), goal.trim()]);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.profileType;
      case 2: return true;
      case 3: return !!data.experience && !!data.learningStyle;
      case 4: return (data.interests?.length ?? 0) >= 2;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    if (!data.profileType) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {/* continue even on error */}

    // Store onboarding data for the personalization screen
    try {
      sessionStorage.setItem("latzu_onboarding", JSON.stringify(data));
    } catch {/* ignore */}

    setProfileType(data.profileType);
    router.push("/personalizando");
    setIsSubmitting(false);
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Progress bar ── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`flex items-center ${s < TOTAL_STEPS ? "flex-1" : ""}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                  s < step
                    ? "bg-primary text-primary-foreground"
                    : s === step
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < TOTAL_STEPS && (
                <div className={`flex-1 h-1 mx-2 rounded transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <span key={s}>{getStepLabel(s, data.profileType)}</span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Profile type ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Cómo te describes?</CardTitle>
                <CardDescription>Personalizaremos toda tu experiencia en base a esto</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {profileOptions.map((opt) => (
                  <motion.button
                    key={opt.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => set("profileType", opt.type)}
                    className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                      data.profileType === opt.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${opt.color} flex items-center justify-center mb-3`}>
                      <opt.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{opt.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{opt.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {opt.features.map((f) => (
                        <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                    {data.profileType === opt.type && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 2: Context (conditional on profile type) ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                {data.profileType === "estudiante" ? (
                  <>
                    <CardTitle className="text-2xl">Cuéntanos de tu universidad</CardTitle>
                    <CardDescription>Esto nos ayuda a generar planes de estudio precisos</CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl">¿Qué quieres estudiar?</CardTitle>
                    <CardDescription>Opcional — para personalizar tu espacio de aprendizaje</CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-4">

                {/* ── Estudiante ── */}
                {data.profileType === "estudiante" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />País</Label>
                        <select
                          className={selectCn}
                          value={data.country ?? ""}
                          onChange={(e) => set("country", e.target.value)}
                        >
                          <option value="">Selecciona tu país</option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" />Universidad</Label>
                        <select
                          className={selectCn}
                          value={data.university ?? ""}
                          onChange={(e) => set("university", e.target.value)}
                        >
                          <option value="">Selecciona tu universidad</option>
                          {UNIVERSITIES.map((u) => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {data.university === "Otra" && (
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" />Nombre de tu universidad</Label>
                        <Input
                          placeholder="Escribe el nombre de tu universidad"
                          onChange={(e) => set("university", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />Carrera</Label>
                      <select
                        className={selectCn}
                        value={data.career ?? ""}
                        onChange={(e) => set("career", e.target.value)}
                      >
                        <option value="">Selecciona tu carrera</option>
                        {CAREERS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    {data.career === "Otra" && (
                      <div className="space-y-2">
                        <Label>Nombre de tu carrera</Label>
                        <Input
                          placeholder="Escribe el nombre de tu carrera"
                          onChange={(e) => set("career", e.target.value)}
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Semestre actual</Label>
                      <div className="flex flex-wrap gap-2">
                        {SEMESTERS.map((s) => (
                          <button
                            key={s}
                            onClick={() => set("semester", s)}
                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                              data.semester === s
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ── Aprendiz ── */}
                {data.profileType === "aprendiz" && (
                  <>
                    <div className="space-y-2">
                      <Label>Tema o área de estudio</Label>
                      <Input
                        placeholder="Ej. Programación web, Diseño gráfico, Inglés…"
                        value={data.studyFocus ?? ""}
                        onChange={(e) => set("studyFocus", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />País</Label>
                      <select
                        className={selectCn}
                        value={data.country ?? ""}
                        onChange={(e) => set("country", e.target.value)}
                      >
                        <option value="">Selecciona tu país</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Puedes dejar estos campos en blanco y completarlos más adelante.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Experience + Learning style ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Experiencia y forma de aprender</CardTitle>
                <CardDescription>Adaptaremos el contenido y el ritmo exactamente para ti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Experience */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">¿Cuál es tu nivel de experiencia?</p>
                  {experienceLevels.map((lvl) => (
                    <motion.button
                      key={lvl.value}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => set("experience", lvl.value)}
                      className={`w-full p-3.5 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                        data.experience === lvl.value
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        data.experience === lvl.value ? "bg-primary text-primary-foreground" : "bg-secondary"
                      }`}>
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{lvl.label}</p>
                        <p className="text-xs text-muted-foreground">{lvl.description}</p>
                      </div>
                      {data.experience === lvl.value && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </motion.button>
                  ))}
                </div>

                {/* Learning style */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">¿Cómo aprendes mejor?</p>
                  <div className="grid grid-cols-2 gap-3">
                    {learningStyles.map((ls) => (
                      <motion.button
                        key={ls.value}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => set("learningStyle", ls.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          data.learningStyle === ls.value
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      >
                        <ls.icon className={`w-5 h-5 mb-1.5 ${data.learningStyle === ls.value ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="text-sm font-medium">{ls.label}</p>
                        <p className="text-xs text-muted-foreground leading-tight">{ls.description}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 4: Interests ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Qué te interesa?</CardTitle>
                <CardDescription>Selecciona al menos 2 áreas — esto guía tus recomendaciones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interestOptions.map((interest) => (
                    <motion.button
                      key={interest}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggle("interests", interest)}
                      className={`px-4 py-2 rounded-full border-2 text-sm transition-all ${
                        data.interests?.includes(interest)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {interest}
                    </motion.button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {data.interests?.length ?? 0} seleccionados
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 5: Goals ── */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Qué quieres lograr?</CardTitle>
                <CardDescription>
                  La IA creará tu espacio de aprendizaje a partir de estas metas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Input */}
                <Input
                  placeholder="Escribe una meta y presiona Enter…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addGoal((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }}
                />

                {/* Added goals */}
                {(data.goals?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {data.goals?.map((goal, i) => (
                      <Badge key={i} variant="secondary" className="px-3 py-1.5 text-sm">
                        {goal}
                        <button
                          onClick={() => set("goals", data.goals!.filter((_, j) => j !== i))}
                          className="ml-2 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Goal examples */}
                {data.profileType && (
                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Ejemplos — haz clic para agregar
                    </p>
                    <div className="flex flex-col gap-2">
                      {GOAL_EXAMPLES[data.profileType].map((example) => {
                        const isAdded = data.goals?.includes(example);
                        return (
                          <motion.button
                            key={example}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => {
                              if (!isAdded) addGoal(example);
                              else set("goals", data.goals!.filter((g) => g !== example));
                            }}
                            className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-sm transition-all flex items-center gap-2.5 ${
                              isAdded
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                              isAdded ? "border-primary bg-primary" : "border-muted-foreground/40"
                            }`}>
                              {isAdded
                                ? <Check className="w-3 h-3 text-primary-foreground" />
                                : <Plus className="w-3 h-3 text-muted-foreground/60" />
                              }
                            </div>
                            {example}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(data.goals?.length ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground text-center">
                    Puedes añadir metas ahora o hacerlo después. La IA también puede sugerirte algunas.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Navigation ── */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {step < TOTAL_STEPS ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canProceed()}>
            Siguiente
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Comenzar
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

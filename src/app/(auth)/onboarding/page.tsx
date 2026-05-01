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
import type { ProfileType, OnboardingData } from "@/types/user";
import {
  GraduationCap, Lightbulb, ArrowRight, ArrowLeft, Check, Sparkles,
  MapPin, School, MessageCircle, Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 7;

const STEP_LABELS = ["Perfil", "Contexto", "Propósito", "Tu mundo", "Cómo eres", "Tu IA", "Visión"];

const MOTIVATION_OPTIONS = [
  "Me siento constantemente ocupado/a pero sin avanzar en lo que realmente importa",
  "Tengo muchas ideas y proyectos pero me cuesta ejecutar",
  "Quiero aprender de verdad, no solo consumir contenido sin retenerlo",
  "Mis metas se quedan en intención — nunca se convierten en acción",
  "Mi mente y mis proyectos están dispersos, necesito orden",
  "Quiero construir hábitos que realmente se sostengan, no durar 3 días",
  "Estoy en un momento de cambio y necesito claridad sobre hacia dónde voy",
  "Siento que el tiempo se me escapa y no rindo lo que podría",
  "Quiero crecer profesionalmente pero no sé por dónde empezar",
  "Necesito rendir más sin quemarme",
];

const AREA_CHIPS: { label: string; icon: string }[] = [
  { label: "Tesis", icon: "📝" },
  { label: "Proyecto de grado", icon: "🎓" },
  { label: "Materias universitarias", icon: "📚" },
  { label: "Preparación de examen", icon: "📋" },
  { label: "Trabajo corporativo", icon: "💼" },
  { label: "Emprendimiento", icon: "🚀" },
  { label: "Freelance", icon: "💻" },
  { label: "Búsqueda de empleo", icon: "🔍" },
  { label: "Idiomas", icon: "🌍" },
  { label: "Programación", icon: "⚡" },
  { label: "Diseño", icon: "🎨" },
  { label: "Marketing", icon: "📣" },
  { label: "Finanzas personales", icon: "💰" },
  { label: "Música", icon: "🎵" },
  { label: "Arte", icon: "🖌️" },
  { label: "Salud y fitness", icon: "💪" },
  { label: "Hábitos", icon: "🔄" },
  { label: "Meditación", icon: "🧘" },
  { label: "Relaciones", icon: "🤝" },
  { label: "Familia", icon: "🏡" },
  { label: "Presupuesto personal", icon: "📊" },
  { label: "Ahorro", icon: "🏦" },
  { label: "Inversiones", icon: "📈" },
  { label: "Deudas", icon: "🎯" },
];

const VISION_OPTIONS = [
  { key: "base",       label: "Dar el primer paso real — pasar de cero a tener algo concreto" },
  { key: "sistematizar", label: "Sistematizar lo que ya tengo para que funcione solo" },
  { key: "resultado",  label: "Lograr un resultado específico que pueda mostrar" },
  { key: "transformar", label: "Transformar completamente cómo funciona esta área de mi vida" },
  { key: "mantener",   label: "Mantener lo que tengo — que no se caiga mientras trabajo en lo demás" },
  { key: "explorar",   label: "Explorar sin presión — todavía estoy descubriendo qué quiero aquí" },
];

const AI_PERSONALITY_OPTIONS = [
  "Directa y sin rodeos, aunque sea incómodo escucharlo",
  "Empática — que entienda mi contexto antes de opinar",
  "Motivadora — quiero celebraciones y refuerzo positivo",
  "Analítica — datos y patrones, sin drama emocional",
  "Socrática — que me haga preguntas para que yo encuentre mis propias respuestas",
];

const COUNTRIES = [
  "Colombia", "México", "Argentina", "Chile", "Perú", "Ecuador",
  "Venezuela", "Bolivia", "Uruguay", "Paraguay", "Costa Rica",
  "Guatemala", "Honduras", "El Salvador", "Nicaragua", "Panamá",
  "República Dominicana", "Cuba", "España", "Estados Unidos", "Otro",
];

const UNIVERSITIES = [
  "Universidad de los Andes", "Universidad Nacional de Colombia",
  "Pontificia Universidad Javeriana", "Universidad del Rosario", "Universidad EAFIT",
  "Universidad de Antioquia", "Universidad del Norte", "Universidad Externado de Colombia",
  "Universidad de la Sabana", "Universidad Distrital Francisco José de Caldas",
  "Universidad del Valle", "Universidad Cooperativa de Colombia", "Universidad Libre",
  "Universidad Piloto de Colombia", "Universidad Sergio Arboleda",
  "Universidad de Bogotá Jorge Tadeo Lozano", "Universidad EAN", "ICESI",
  "Universidad CES", "Universidad Tecnológica de Pereira",
  "Universidad Industrial de Santander", "Otra",
];

const CAREERS = [
  "Administración de Empresas", "Arquitectura", "Biología", "Ciencias Políticas",
  "Comunicación Social", "Contaduría Pública", "Derecho", "Diseño Gráfico",
  "Economía", "Educación", "Enfermería", "Filosofía", "Física",
  "Finanzas y Comercio Internacional", "Historia", "Ingeniería Civil",
  "Ingeniería de Sistemas", "Ingeniería Electrónica", "Ingeniería Industrial",
  "Ingeniería Mecánica", "Literatura", "Marketing y Publicidad", "Matemáticas",
  "Medicina", "Nutrición y Dietética", "Psicología", "Química",
  "Trabajo Social", "Veterinaria", "Otra",
];

const SEMESTERS = ["1°","2°","3°","4°","5°","6°","7°","8°","9°","10°","11°","12°"];

// ─── Personality questions ─────────────────────────────────────────────────────

const PERSONALITY_QUESTIONS = [
  {
    key: "mainMotivator",
    label: "¿Qué te impulsa más a actuar?",
    options: [
      "El miedo a quedarme atrás o fallar",
      "La emoción de alcanzar algo que deseo mucho",
      "La responsabilidad hacia otras personas",
      "La curiosidad — quiero entender cómo funciona todo",
      "La visión de quien quiero llegar a ser",
    ],
  },
  {
    key: "whenBlocked",
    label: "¿Qué pasa cuando te bloqueas?",
    options: [
      "Me paralizo y pospongo sin darme cuenta",
      "Busco información o ayuda para desatrancarme",
      "Cambio de tarea y vuelvo cuando tengo más energía",
      "Me frustro pero empujo igual hasta terminar",
      "Necesito hablar con alguien para aclarar mi cabeza",
    ],
  },
  {
    key: "goalRelationship",
    label: "¿Cómo te relacionas con tus metas?",
    options: [
      "Las tengo muy claras y sé exactamente qué quiero",
      "Las tengo en mente pero van cambiando con el tiempo",
      "Las siento más como intuiciones que como objetivos concretos",
      "Estoy en proceso de descubrirlas — aún no lo sé",
    ],
  },
  {
    key: "energyPeak",
    label: "¿Cuándo rindes mejor?",
    options: [
      "Muy temprano, antes de las 8am",
      "En la mañana, entre 8am y 12pm",
      "En la tarde, entre 12pm y 6pm",
      "En la noche, después de las 6pm",
      "No tengo un patrón — depende del día",
    ],
  },
  {
    key: "dailyTime",
    label: "¿Cuánto tiempo puedes dedicar al día?",
    options: [
      "Menos de 30 minutos — que sea eficiente",
      "Entre 30 minutos y 1 hora",
      "Entre 1 y 2 horas",
      "Más de 2 horas — esto es prioridad para mí",
      "Varía mucho según el día",
    ],
  },
  {
    key: "mainBlocker",
    label: "¿Qué te frena más?",
    options: [
      "La procrastinación — empezar es lo más difícil",
      "La distracción — empiezo pero me disperso",
      "El perfeccionismo — no entrego si no está perfecto",
      "El exceso — tengo demasiadas cosas al mismo tiempo",
      "La duda — no sé si voy por el camino correcto",
      "La falta de energía — me canso rápido",
    ],
  },
];

// ─── Shared styles ─────────────────────────────────────────────────────────────

const selectCn = cn(
  "border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none",
  "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  "dark:bg-input/30 text-foreground disabled:opacity-50"
);

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const setProfileType = useUserStore((state) => state.setProfileType);

  const [step, setStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    motivations: [],
    activeAreas: [],
    aiPersonality: [],
    vision90: {},
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const set = <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const toggleMotivation = (item: string) =>
    setData((prev) => {
      const list = prev.motivations || [];
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
      return { ...prev, motivations: next.slice(0, 3) };
    });

  const toggleArea = (item: string) =>
    setData((prev) => {
      const list = prev.activeAreas || [];
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
      return { ...prev, activeAreas: next };
    });

  const toggleAiPersonality = (item: string) =>
    setData((prev) => {
      const list = prev.aiPersonality || [];
      const next = list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
      return { ...prev, aiPersonality: next.slice(0, 2) };
    });

  const setVision = (area: string, level: string) =>
    setData((prev) => ({
      ...prev,
      vision90: { ...(prev.vision90 || {}), [area]: level },
    }));

  const setPersonality = (key: string, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return !!data.profileType;
      case 2: return true;
      case 3: return (data.motivations?.length ?? 0) >= 1;
      case 4: return (data.activeAreas?.length ?? 0) >= 1;
      case 5: return !!data.mainMotivator && !!data.energyPeak;
      case 6: return true;
      case 7: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      // Store in sessionStorage and go to preview
      try {
        sessionStorage.setItem("latzu_onboarding", JSON.stringify(data));
      } catch { /* ignore */ }
      if (data.profileType) setProfileType(data.profileType);
      router.push("/onboarding/preview");
    }
  };

  // Save onboarding to backend (non-blocking)
  const saveOnboarding = async () => {
    if (!data.profileType) return;
    try {
      await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch { /* continue even on error */ }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse-glow w-16 h-16 rounded-full bg-primary/20" />
      </div>
    );
  }

  const activeAreas = data.activeAreas || [];
  const previewAreas = activeAreas.slice(0, 5);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
            <div key={s} className={`flex items-center ${s < TOTAL_STEPS ? "flex-1" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s < step ? "bg-primary text-primary-foreground" :
                s === step ? "bg-primary/20 text-primary border-2 border-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                {s < step ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < TOTAL_STEPS && (
                <div className={`flex-1 h-0.5 mx-1 rounded transition-colors ${s < step ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
          {STEP_LABELS.map((l) => <span key={l}>{l}</span>)}
        </div>
      </div>

      <AnimatePresence mode="wait">

        {/* ── Step 1: Profile ── */}
        {step === 1 && (
          <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Cómo te describes?</CardTitle>
                <CardDescription>Personalizaremos toda tu experiencia en base a esto</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    type: "estudiante" as ProfileType,
                    icon: GraduationCap,
                    title: "Estudiante universitario",
                    description: "Estoy cursando una carrera en la universidad",
                    color: "from-teal-500 to-emerald-500",
                  },
                  {
                    type: "aprendiz" as ProfileType,
                    icon: Lightbulb,
                    title: "Aprendiz independiente",
                    description: "Quiero aprender y crecer de forma autodidacta",
                    color: "from-violet-500 to-purple-500",
                  },
                ].map((opt) => (
                  <motion.button
                    key={opt.type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => set("profileType", opt.type)}
                    className={`relative p-5 rounded-xl border-2 text-left transition-all ${
                      data.profileType === opt.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${opt.color} flex items-center justify-center mb-3`}>
                      <opt.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{opt.title}</h3>
                    <p className="text-sm text-muted-foreground">{opt.description}</p>
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

        {/* ── Step 2: Context ── */}
        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                {data.profileType === "estudiante" ? (
                  <>
                    <CardTitle className="text-2xl">Cuéntanos de tu universidad</CardTitle>
                    <CardDescription>Para personalizar tu espacio académico — todo es opcional</CardDescription>
                  </>
                ) : (
                  <>
                    <CardTitle className="text-2xl">¿En qué te estás enfocando?</CardTitle>
                    <CardDescription>Opcional — para personalizar tu espacio de aprendizaje</CardDescription>
                  </>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {data.profileType === "estudiante" ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />País</Label>
                        <select className={selectCn} value={data.country ?? ""} onChange={(e) => set("country", e.target.value)}>
                          <option value="">Selecciona</option>
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-1.5"><School className="w-3.5 h-3.5" />Universidad</Label>
                        <select className={selectCn} value={data.university ?? ""} onChange={(e) => set("university", e.target.value)}>
                          <option value="">Selecciona</option>
                          {UNIVERSITIES.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    {data.university === "Otra" && (
                      <Input placeholder="Nombre de tu universidad" onChange={(e) => set("university", e.target.value)} />
                    )}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1.5"><GraduationCap className="w-3.5 h-3.5" />Carrera</Label>
                      <select className={selectCn} value={data.career ?? ""} onChange={(e) => set("career", e.target.value)}>
                        <option value="">Selecciona</option>
                        {CAREERS.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {data.career === "Otra" && (
                      <Input placeholder="Nombre de tu carrera" onChange={(e) => set("career", e.target.value)} />
                    )}
                    <div className="space-y-2">
                      <Label>Semestre actual</Label>
                      <div className="flex flex-wrap gap-2">
                        {SEMESTERS.map((s) => (
                          <button key={s} onClick={() => set("semester", s)}
                            className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                              data.semester === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                            }`}
                          >{s}</button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label>Tema o área de estudio</Label>
                    <Input
                      placeholder="Ej. Programación web, Diseño gráfico, Inglés…"
                      value={data.studyFocus ?? ""}
                      onChange={(e) => set("studyFocus", e.target.value)}
                    />
                  </div>
                )}

                {/* WhatsApp */}
                <div className="space-y-3 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Activa Latzu en WhatsApp <span className="text-xs font-normal text-muted-foreground">(opcional)</span></p>
                      <p className="text-xs text-muted-foreground">Chatea con tu IA directo desde WhatsApp</p>
                    </div>
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="tel" placeholder="Ej. +57 300 123 4567" className="pl-9"
                      value={data.phoneNumber ?? ""} onChange={(e) => set("phoneNumber", e.target.value)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">Puedes saltarte esto y completarlo después.</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 3: Motivations ── */}
        {step === 3 && (
          <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Qué te trajo aquí?</CardTitle>
                <CardDescription>Elige hasta 3 frases que más te representen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {MOTIVATION_OPTIONS.map((opt) => {
                  const selected = (data.motivations || []).includes(opt);
                  const maxReached = (data.motivations || []).length >= 3 && !selected;
                  return (
                    <motion.button
                      key={opt}
                      whileHover={!maxReached ? { scale: 1.01 } : {}}
                      whileTap={!maxReached ? { scale: 0.99 } : {}}
                      onClick={() => !maxReached && toggleMotivation(opt)}
                      className={`w-full p-3.5 rounded-xl border-2 text-left text-sm transition-all ${
                        selected ? "border-primary bg-primary/10 text-foreground" :
                        maxReached ? "border-border opacity-40 cursor-not-allowed" :
                        "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span>"{opt}"</span>
                      </div>
                    </motion.button>
                  );
                })}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  {data.motivations?.length ?? 0}/3 seleccionadas
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 4: Active areas ── */}
        {step === 4 && (
          <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Qué estás manejando ahora?</CardTitle>
                <CardDescription>Cada área que elijas se convierte en un workspace tuyo</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {AREA_CHIPS.map(({ label, icon }) => {
                    const selected = activeAreas.includes(label);
                    return (
                      <motion.button
                        key={label}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleArea(label)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-full border-2 text-sm transition-all ${
                          selected ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </motion.button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {activeAreas.length} {activeAreas.length === 1 ? "área seleccionada" : "áreas seleccionadas"}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 5: Personality ── */}
        {step === 5 && (
          <motion.div key="s5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Cómo eres?</CardTitle>
                <CardDescription>Tu IA se adapta a tu manera de trabajar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {PERSONALITY_QUESTIONS.map((q) => {
                  const current = (data as Record<string, string>)[q.key];
                  return (
                    <div key={q.key} className="space-y-2">
                      <p className="text-sm font-semibold">{q.label}</p>
                      <div className="grid gap-1.5">
                        {q.options.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => setPersonality(q.key, opt)}
                            className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-left transition-all ${
                              current === opt
                                ? "border-primary bg-primary/10 font-medium"
                                : "border-border hover:border-primary/40 hover:bg-secondary/40"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 6: AI personality ── */}
        {step === 6 && (
          <motion.div key="s6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">¿Cómo prefieres que te hable tu IA?</CardTitle>
                <CardDescription>Elige hasta 2 estilos — tu mentor IA se comunicará así contigo</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {AI_PERSONALITY_OPTIONS.map((opt) => {
                  const selected = (data.aiPersonality || []).includes(opt);
                  const maxReached = (data.aiPersonality || []).length >= 2 && !selected;
                  return (
                    <motion.button
                      key={opt}
                      whileHover={!maxReached ? { scale: 1.01 } : {}}
                      onClick={() => !maxReached && toggleAiPersonality(opt)}
                      className={`w-full p-4 rounded-xl border-2 text-left text-sm transition-all ${
                        selected ? "border-primary bg-primary/10" :
                        maxReached ? "border-border opacity-40 cursor-not-allowed" :
                        "border-border hover:border-primary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                          selected ? "border-primary bg-primary" : "border-muted-foreground"
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ── Step 7: Vision 90 days ── */}
        {step === 7 && (
          <motion.div key="s7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="glass">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Tu visión en 90 días</CardTitle>
                <CardDescription>¿Qué quieres lograr en cada área que elegiste?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {previewAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No seleccionaste áreas en el paso anterior. Puedes volver o continuar.
                  </p>
                ) : (
                  previewAreas.map((area) => {
                    const currentVision = (data.vision90 || {})[area];
                    const areaChip = AREA_CHIPS.find((c) => c.label === area);
                    return (
                      <div key={area} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{areaChip?.icon ?? "📌"}</span>
                          <p className="text-sm font-semibold">{area}</p>
                          {currentVision && <Badge variant="secondary" className="text-xs ml-auto">✓</Badge>}
                        </div>
                        <div className="grid gap-1.5">
                          {VISION_OPTIONS.map((vo) => (
                            <button
                              key={vo.key}
                              onClick={() => setVision(area, vo.key)}
                              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-left transition-all ${
                                currentVision === vo.key
                                  ? "border-primary bg-primary/10 font-medium"
                                  : "border-border hover:border-primary/40 hover:bg-secondary/40"
                              }`}
                            >
                              {vo.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
                <p className="text-xs text-muted-foreground text-center pt-2">
                  Puedes dejar áreas sin selección — el agente inferirá a partir de tu perfil.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="ghost" onClick={() => setStep((s) => s - 1)} disabled={step === 1}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        <Button onClick={handleNext} disabled={!canProceed()}>
          {step < TOTAL_STEPS ? (
            <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>
          ) : (
            <>Ver mi propuesta <Sparkles className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

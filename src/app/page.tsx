"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, ArrowRight, BookOpen, MessageSquare, Zap,
  Network, CalendarDays, BarChart3, Check, ChevronDown, Shield,
  GraduationCap, Target, Star, Infinity, Users, Rocket, PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useIsGuest } from "@/stores/userStore";
import { cn } from "@/lib/utils";

// ─── Scroll-aware navbar ──────────────────────────────────────────────────────

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Latzu
          </span>
        </Link>

        {/* Nav links — hidden on small screens */}
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Funciones</a>
          <a href="#how" className="hover:text-foreground transition-colors">Cómo funciona</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button size="sm" className="gap-1.5" asChild>
            <Link href="/login">
              <Sparkles className="w-3.5 h-3.5" />
              Probar gratis
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}

// ─── Floating badge ───────────────────────────────────────────────────────────

function FloatingCard({
  className,
  delay = 0,
  children,
}: {
  className?: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0, transition: { delay, duration: 0.6 } }}
      className={cn(
        "absolute glass rounded-xl px-3 py-2 text-xs font-medium shadow-lg shadow-black/10",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

// ─── Section fade-in wrapper ──────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Pricing card ─────────────────────────────────────────────────────────────

interface PricingTier {
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: string[];
}

function PricingCard({ tier }: { tier: PricingTier }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "relative rounded-2xl p-6 flex flex-col gap-5 border",
        tier.featured
          ? "border-primary/50 shadow-2xl"
          : "glass border-border/50"
      )}
      style={tier.featured ? {
        background: "linear-gradient(160deg, oklch(0.52 0.27 280 / 0.18) 0%, oklch(0.65 0.27 310 / 0.10) 50%, oklch(0.62 0.26 340 / 0.12) 100%)",
        boxShadow: "0 20px 60px oklch(0.52 0.27 280 / 0.25), 0 0 0 1px oklch(0.72 0.29 280 / 0.25)",
      } : undefined}
    >
      {tier.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[11px] font-semibold px-3 py-1 rounded-full">
          {tier.badge}
        </span>
      )}

      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">{tier.name}</p>
        <div className="flex items-end gap-1.5">
          <span className="text-4xl font-heading font-bold">{tier.price}</span>
          <span className="text-muted-foreground text-sm mb-1">{tier.period}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1.5">{tier.description}</p>
      </div>

      <Button
        size="lg"
        variant={tier.featured ? "default" : "outline"}
        className="w-full gap-2"
        asChild
      >
        <Link href="/login">
          {tier.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>

      <ul className="space-y-2.5">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-border/40 rounded-xl overflow-hidden cursor-pointer"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <p className="font-medium text-sm">{q}</p>
        <ChevronDown
          className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")}
        />
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: MessageSquare,
    title: "Tutor IA Adaptativo",
    description:
      "Tu asistente personal de aprendizaje que recuerda tu contexto, adapta su estilo pedagógico y está disponible 24/7 para responder tus dudas.",
    color: "oklch(0.72 0.29 280)",
    bg: "oklch(0.72 0.29 280 / 0.12)",
    border: "oklch(0.72 0.29 280 / 0.25)",
  },
  {
    icon: Network,
    title: "Biblioteca de Conocimiento",
    description:
      "Organiza conceptos, notas y recursos en un grafo de conocimiento interconectado. Nunca pierdas una idea importante.",
    color: "oklch(0.78 0.27 340)",
    bg: "oklch(0.78 0.27 340 / 0.12)",
    border: "oklch(0.78 0.27 340 / 0.25)",
  },
  {
    icon: CalendarDays,
    title: "Planificación Inteligente",
    description:
      "Crea planes de estudio y tareas con IA. Sincroniza con Google Calendar y recibe recordatorios personalizados.",
    color: "oklch(0.75 0.22 200)",
    bg: "oklch(0.75 0.22 200 / 0.12)",
    border: "oklch(0.75 0.22 200 / 0.25)",
  },
  {
    icon: Brain,
    title: "Memoria Persistente",
    description:
      "Latzu aprende de ti con cada sesión: tus fortalezas, debilidades, objetivos y preferencias. El contexto nunca se pierde.",
    color: "oklch(0.72 0.29 280)",
    bg: "oklch(0.72 0.29 280 / 0.12)",
    border: "oklch(0.72 0.29 280 / 0.25)",
  },
  {
    icon: BarChart3,
    title: "Analytics de Aprendizaje",
    description:
      "Visualiza tu progreso con métricas detalladas: racha de estudio, conceptos dominados, tiempo invertido y más.",
    color: "oklch(0.70 0.22 145)",
    bg: "oklch(0.70 0.22 145 / 0.12)",
    border: "oklch(0.70 0.22 145 / 0.25)",
  },
  {
    icon: Zap,
    title: "Automatización Integrada",
    description:
      "Agente IA que crea tareas, gestiona tu conocimiento y ejecuta flujos de trabajo complejos directamente desde el chat.",
    color: "oklch(0.78 0.22 60)",
    bg: "oklch(0.78 0.22 60 / 0.12)",
    border: "oklch(0.78 0.22 60 / 0.25)",
  },
];

const steps = [
  {
    num: "01",
    icon: Target,
    title: "Define tus objetivos",
    description:
      "Cuéntale a Latzu qué quieres aprender, en qué industria trabajas y cuáles son tus metas. En minutos tendrás una plataforma personalizada.",
  },
  {
    num: "02",
    icon: MessageSquare,
    title: "Aprende con IA",
    description:
      "Chatea con tu tutor, organiza tu conocimiento, crea planes de estudio y recibe recomendaciones diarias adaptadas a tu perfil.",
  },
  {
    num: "03",
    icon: Rocket,
    title: "Crece más rápido",
    description:
      "Latzu registra tu progreso, identifica brechas en tu conocimiento y ajusta el camino de aprendizaje para maximizar tu crecimiento.",
  },
];

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    period: "/ 7 días de prueba",
    description: "Empieza sin compromiso. Prueba todas las funciones principales.",
    cta: "Comenzar gratis",
    features: [
      "Tutor IA con 50 mensajes/día",
      "Biblioteca de conocimiento (hasta 30 nodos)",
      "Planificación básica (3 planes activos)",
      "Lecturas diarias personalizadas",
      "Dashboard con métricas básicas",
      "Soporte por email",
    ],
  },
  {
    name: "Pro",
    badge: "Más popular",
    price: "$10",
    period: "/ mes",
    description: "Para estudiantes y profesionales que quieren aprender más rápido.",
    cta: "Elegir Pro",
    featured: true,
    features: [
      "Todo lo de Free, sin límites",
      "Mensajes ilimitados con Tutor IA",
      "Biblioteca ilimitada de conocimiento",
      "Planes de estudio ilimitados",
      "Memoria adaptativa avanzada",
      "Integración con Google Calendar",
      "Agente IA con herramientas",
      "Soporte prioritario por chat",
    ],
  },
  {
    name: "Max",
    price: "$30",
    period: "/ mes",
    description: "Para equipos y usuarios que exigen la máxima potencia de IA.",
    cta: "Elegir Max",
    features: [
      "Todo lo de Pro",
      "Modelos IA de última generación",
      "Multi-workspace para equipos",
      "Analytics avanzados de aprendizaje",
      "Exportación de conocimiento",
      "API access",
      "Acceso anticipado a nuevas funciones",
      "Soporte dedicado 24/7",
    ],
  },
];

const faqs = [
  {
    q: "¿Necesito tarjeta de crédito para el periodo de prueba?",
    a: "No. El plan Free de 7 días no requiere tarjeta de crédito. Solo crea tu cuenta y empieza a aprender de inmediato.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, puedes cancelar tu suscripción cuando quieras. Sin contratos, sin compromisos. Tu acceso continúa hasta el fin del periodo de facturación.",
  },
  {
    q: "¿Cómo aprende Latzu sobre mí?",
    a: "Con cada sesión de estudio, cada mensaje y cada tarea completada, Latzu construye un perfil de aprendizaje único para ti. Este modelo de memoria persiste entre sesiones y mejora continuamente.",
  },
  {
    q: "¿Funciona para cualquier materia o industria?",
    a: "Sí. Latzu es agnóstico al dominio de conocimiento. Funciona para estudiantes universitarios, profesionales de tecnología, médicos, abogados, emprendedores y cualquier persona que quiera aprender más eficientemente.",
  },
  {
    q: "¿Mis datos están seguros?",
    a: "Tus datos son privados y encriptados. No compartimos tu información con terceros. Puedes exportar o eliminar tus datos en cualquier momento.",
  },
  {
    q: "¿Hay descuento para estudiantes o universidades?",
    a: "Sí. Ofrecemos planes especiales para instituciones educativas y grupos de estudiantes. Contáctanos en latzuapp@gmail.com.",
  },
];

const stats = [
  { value: "10x", label: "Aprendizaje más rápido" },
  { value: "24/7", label: "Tutor disponible" },
  { value: "∞", label: "Conocimiento organizado" },
  { value: "100%", label: "Personalizado para ti" },
];

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const isGuest = useIsGuest();

  useEffect(() => {
    if (status === "authenticated" || isGuest) {
      router.replace("/dashboard");
    }
  }, [status, isGuest, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-latzu flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </motion.div>
      </div>
    );
  }

  if (status === "authenticated" || isGuest) {
    return (
      <div className="min-h-screen bg-gradient-latzu flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-latzu overflow-x-hidden">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-100 pointer-events-none" aria-hidden />

        {/* Background glow blobs — vivid & large */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
          <div className="animate-blob absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-primary/20 blur-[130px]" />
          <div className="animate-blob [animation-delay:2s] absolute bottom-[-5%] left-[-10%] w-[600px] h-[600px] rounded-full bg-accent/18 blur-[110px]" />
          <div className="animate-blob [animation-delay:4s] absolute top-[20%] right-[-8%] w-[500px] h-[500px] rounded-full" style={{background:"oklch(0.75 0.22 200 / 0.14)", filter:"blur(100px)"}} />
        </div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold"
          style={{
            background: "linear-gradient(135deg, oklch(0.52 0.27 280 / 0.15), oklch(0.62 0.26 340 / 0.12))",
            border: "1px solid oklch(0.52 0.27 280 / 0.40)",
            color: "var(--primary)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Inteligencia Adaptativa para el Aprendizaje
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold text-center max-w-4xl mx-auto leading-[1.1] tracking-tight"
        >
          Aprende más rápido con{" "}
          <span
            className="bg-clip-text text-transparent animate-gradient"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--primary), oklch(0.72 0.28 320), var(--accent), oklch(0.75 0.22 200))",
              backgroundSize: "300% 300%",
            }}
          >
            IA que te conoce
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-base sm:text-xl text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed"
        >
          Tutor IA personal, biblioteca de conocimiento, planificación inteligente
          y memoria adaptativa — todo en una plataforma que evoluciona contigo.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-3"
        >
          <Button
            size="lg"
            className="gap-2 px-8 h-12 text-base animate-pulse-glow"
            style={{
              background: "linear-gradient(135deg, var(--primary), oklch(0.65 0.28 310))",
              boxShadow: "0 4px 30px oklch(0.52 0.27 280 / 0.45), 0 0 0 1px oklch(0.52 0.27 280 / 0.3)",
              border: "none",
            }}
            asChild
          >
            <Link href="/login">
              <Sparkles className="w-4 h-4" />
              Empezar gratis — 7 días
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-primary/30 hover:bg-primary/8" asChild>
            <Link href="#how">
              <PlayCircle className="w-4 h-4" />
              Cómo funciona
            </Link>
          </Button>
        </motion.div>

        {/* Social proof under CTA */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-xs text-muted-foreground/60 flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          Sin tarjeta de crédito · Cancela cuando quieras
        </motion.p>

        {/* Hero visual — floating UI cards */}
        <div className="relative mt-16 w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="rounded-2xl p-4 shadow-2xl"
            style={{
              background: "oklch(0.13 0.025 265 / 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid oklch(0.72 0.29 280 / 0.25)",
              boxShadow: "0 25px 80px oklch(0.52 0.27 280 / 0.25), 0 0 0 1px oklch(0.72 0.29 280 / 0.15)",
            }}
          >
            {/* Fake chat UI */}
            <div className="flex items-center gap-2 mb-4 border-b border-border/30 pb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:"linear-gradient(135deg, var(--primary), var(--accent))"}}>
                <Brain className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs font-semibold">Tutor IA — Latzu</span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">En línea</span>
              </div>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, oklch(0.72 0.29 280 / 0.25), oklch(0.78 0.27 340 / 0.15))"}}>
                  <Brain className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted/30 rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-sm border border-border/20">
                  <p className="text-xs leading-relaxed text-foreground/80">
                    Hola! Recuerdo que estás preparando tu examen de Redes el viernes.
                    Te recomiendo repasar OSPF y BGP hoy — son los temas donde más te ha costado.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <div className="rounded-xl rounded-tr-none px-3.5 py-2.5 max-w-sm" style={{background:"oklch(0.72 0.29 280 / 0.18)", border:"1px solid oklch(0.72 0.29 280 / 0.30)"}}>
                  <p className="text-xs leading-relaxed">
                    Perfecto, explícame OSPF desde cero pero rápido
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, oklch(0.72 0.29 280 / 0.25), oklch(0.78 0.27 340 / 0.15))"}}>
                  <Brain className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted/30 rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-sm border border-border/20">
                  <p className="text-xs leading-relaxed text-foreground/80">
                    OSPF (Open Shortest Path First) es un protocolo de enrutamiento de estado de enlace...
                  </p>
                  <div className="mt-1.5 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:"0ms"}}/>
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{animationDelay:"150ms"}}/>
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:"300ms"}}/>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards — more vivid */}
          <FloatingCard className="-top-4 -left-4 md:-left-20 gap-2 flex items-center animate-float" delay={0.8}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg, var(--primary), var(--accent))"}}>
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-foreground/90">Memoria activada</span>
          </FloatingCard>

          <FloatingCard className="-top-4 -right-4 md:-right-20 gap-2 flex items-center animate-float [animation-delay:1s]" delay={0.9}>
            <Star className="w-3.5 h-3.5 shrink-0" style={{color:"oklch(0.78 0.27 340)"}} />
            <span className="text-foreground/90">12 días de racha 🔥</span>
          </FloatingCard>

          <FloatingCard className="-bottom-4 left-8 gap-2 flex items-center animate-float [animation-delay:2s]" delay={1.0}>
            <GraduationCap className="w-4 h-4 shrink-0" style={{color:"oklch(0.75 0.22 200)"}} />
            <span className="text-foreground/90">47 conceptos dominados</span>
          </FloatingCard>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-border/30" style={{background:"oklch(0.52 0.27 280 / 0.04)"}}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {[
              { ...stats[0], color: "var(--primary)" },
              { ...stats[1], color: "var(--accent)" },
              { ...stats[2], color: "oklch(0.75 0.22 200)" },
              { ...stats[3], color: "oklch(0.72 0.20 145)" },
            ].map((s, i) => (
              <FadeIn key={s.label} delay={i * 0.1} className="text-center md:border-r last:border-0 border-border/30 px-4">
                <p className="text-3xl md:text-4xl font-heading font-bold bg-clip-text text-transparent" style={{backgroundImage:`linear-gradient(135deg, ${s.color}, ${s.color.replace(")", " / 0.7)")})`}}>
                  {s.value}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Funciones</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold max-w-2xl mx-auto leading-tight">
              Todo lo que necesitas para{" "}
              <span className="text-primary">aprender sin límites</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Latzu combina lo mejor de la IA moderna con principios pedagógicos probados
              para crear una experiencia de aprendizaje única.
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div
                  className="group rounded-2xl p-6 h-full transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: "oklch(0.13 0.025 265 / 0.6)",
                    backdropFilter: "blur(12px)",
                    border: `1px solid ${f.border}`,
                    boxShadow: `0 4px 24px ${f.bg}`,
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110" style={{background: f.bg, border: `1px solid ${f.border}`}}>
                    <f.icon className="w-5 h-5" style={{color: f.color}} />
                  </div>
                  <h3 className="font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section id="how" className="py-20 md:py-28 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Cómo funciona</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              En marcha en{" "}
              <span className="text-primary">3 pasos</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px" style={{background:"linear-gradient(90deg, transparent, oklch(0.72 0.29 280 / 0.5), oklch(0.78 0.27 340 / 0.5), transparent)"}} />

            {[
              { ...steps[0], color: "oklch(0.72 0.29 280)", bg: "oklch(0.72 0.29 280 / 0.15)", badge: "oklch(0.52 0.27 280)" },
              { ...steps[1], color: "oklch(0.78 0.27 340)", bg: "oklch(0.78 0.27 340 / 0.15)", badge: "oklch(0.62 0.26 340)" },
              { ...steps[2], color: "oklch(0.75 0.22 200)", bg: "oklch(0.75 0.22 200 / 0.15)", badge: "oklch(0.55 0.22 200)" },
            ].map((step, i) => (
              <FadeIn key={step.title} delay={i * 0.12} className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 mx-auto transition-transform duration-300 hover:scale-105" style={{background: step.bg, border: `1px solid ${step.color.replace(")", " / 0.30)")}`, boxShadow:`0 8px 30px ${step.bg}`}}>
                  <step.icon className="w-8 h-8" style={{color: step.color}} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{background: step.badge}}>
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Precios</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              Simple, transparente,{" "}
              <span className="text-primary">sin sorpresas</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Empieza gratis y escala cuando estés listo. Sin contratos, sin tarifas ocultas.
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <PricingCard tier={tier} />
              </motion.div>
            ))}
          </div>

          <FadeIn className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Eres una institución educativa?{" "}
              <a href="mailto:latzuapp@gmail.com" className="text-primary hover:underline">
                Contáctanos para planes especiales →
              </a>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials / social proof ───────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Lo que dicen</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Estudiantes que ya aprenden{" "}
              <span className="text-primary">diferente</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                quote:
                  "Latzu cambió completamente cómo estudio. El tutor recuerda exactamente dónde me quedé la sesión anterior y sabe cuáles temas me cuestan más.",
                name: "Camila R.",
                role: "Estudiante de Ingeniería · Universidad de los Andes",
              },
              {
                quote:
                  "La biblioteca de conocimiento es increíble. Puedo conectar conceptos de diferentes materias y el tutor me ayuda a ver el panorama completo.",
                name: "Santiago M.",
                role: "Estudiante de Medicina · Universidad Nacional",
              },
              {
                quote:
                  "Pasé de estudiar 4 horas sin retener casi nada a 2 horas con resultados reales. La planificación con IA es una diferencia gigantesca.",
                name: "Valentina G.",
                role: "Preparación para ICFES",
              },
            ].map((t, i) => (
              <FadeIn key={t.name} delay={i * 0.1}>
                <div className="glass rounded-2xl p-5 h-full flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{t.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.role}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <section id="faq" className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">FAQ</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Preguntas frecuentes
            </h2>
          </FadeIn>

          <div className="max-w-2xl mx-auto space-y-2">
            {faqs.map((faq, i) => (
              <FadeIn key={faq.q} delay={i * 0.05}>
                <FaqItem q={faq.q} a={faq.a} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <FadeIn>
            <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 text-center max-w-4xl mx-auto"
              style={{
                background: "linear-gradient(135deg, oklch(0.52 0.27 280 / 0.20) 0%, oklch(0.65 0.27 310 / 0.15) 40%, oklch(0.62 0.26 340 / 0.20) 100%)",
                border: "1px solid oklch(0.72 0.29 280 / 0.35)",
                boxShadow: "0 0 80px oklch(0.52 0.27 280 / 0.30), 0 0 160px oklch(0.62 0.26 340 / 0.15)",
              }}
            >
              {/* Animated glows */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="animate-blob absolute top-[-30%] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[80px]" style={{background:"oklch(0.52 0.27 280 / 0.35)"}} />
                <div className="animate-blob [animation-delay:3s] absolute bottom-[-20%] right-[-10%] w-64 h-64 rounded-full blur-[60px]" style={{background:"oklch(0.62 0.26 340 / 0.30)"}} />
                {/* Shimmer overlay */}
                <div className="absolute inset-0 animate-shimmer opacity-40" />
              </div>

              <div className="relative">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-6 animate-pulse-glow"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), oklch(0.68 0.28 310), var(--accent))",
                    boxShadow: "0 8px 40px oklch(0.52 0.27 280 / 0.50)",
                  }}
                >
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl md:text-5xl font-heading font-bold mb-4">
                  Tu mejor versión{" "}
                  <span className="bg-clip-text text-transparent animate-gradient" style={{backgroundImage:"linear-gradient(135deg, var(--primary), oklch(0.72 0.28 320), var(--accent))", backgroundSize:"300% 300%"}}>
                    empieza hoy
                  </span>
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  Únete a la nueva generación de estudiantes que aprenden con inteligencia adaptativa.
                  7 días gratis, sin compromisos.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    size="lg"
                    className="gap-2 px-10 h-12 text-base border-none"
                    style={{
                      background: "linear-gradient(135deg, var(--primary), oklch(0.65 0.28 310), var(--accent))",
                      boxShadow: "0 4px 30px oklch(0.52 0.27 280 / 0.50), 0 0 0 1px oklch(0.72 0.29 280 / 0.30)",
                    }}
                    asChild
                  >
                    <Link href="/login">
                      <Sparkles className="w-4 h-4" />
                      Empezar ahora — es gratis
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-primary/40 hover:bg-primary/10" asChild>
                    <Link href="/login">
                      Iniciar sesión
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  Sin tarjeta de crédito · Cancela cuando quieras · HTTPS cifrado
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-border/40 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Latzu
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">Funciones</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">Precios</a>
              <a href="mailto:latzuapp@gmail.com" className="hover:text-foreground transition-colors">Contacto</a>
            </div>

            <p className="text-sm text-muted-foreground/60">
              © 2025 Latzu · Inteligencia Adaptativa para el Futuro
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

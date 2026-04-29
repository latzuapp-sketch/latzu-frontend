"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import {
  Brain, Sparkles, ArrowRight, MessageSquare, Zap,
  Network, CalendarDays, BarChart3, Check, ChevronDown, Shield,
  GraduationCap, Target, Star, Rocket, PlayCircle, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { useIsGuest } from "@/stores/userStore";
import { cn } from "@/lib/utils";
import { useLanguage, LangToggle } from "@/lib/i18n";

// ─── Feature / step icon meta (no text, stable across languages) ──────────────

const FEATURE_META = [
  { icon: MessageSquare, color: "oklch(0.72 0.29 280)", bg: "oklch(0.72 0.29 280 / 0.12)", border: "oklch(0.72 0.29 280 / 0.25)" },
  { icon: Network,       color: "oklch(0.78 0.27 340)", bg: "oklch(0.78 0.27 340 / 0.12)", border: "oklch(0.78 0.27 340 / 0.25)" },
  { icon: CalendarDays,  color: "oklch(0.75 0.22 200)", bg: "oklch(0.75 0.22 200 / 0.12)", border: "oklch(0.75 0.22 200 / 0.25)" },
  { icon: Brain,         color: "oklch(0.72 0.29 280)", bg: "oklch(0.72 0.29 280 / 0.12)", border: "oklch(0.72 0.29 280 / 0.25)" },
  { icon: BarChart3,     color: "oklch(0.70 0.22 145)", bg: "oklch(0.70 0.22 145 / 0.12)", border: "oklch(0.70 0.22 145 / 0.25)" },
  { icon: Zap,           color: "oklch(0.78 0.22 60)",  bg: "oklch(0.78 0.22 60 / 0.12)",  border: "oklch(0.78 0.22 60 / 0.25)"  },
];

const STEP_META = [
  { icon: Target,       color: "oklch(0.72 0.29 280)", bg: "oklch(0.72 0.29 280 / 0.15)", badge: "oklch(0.52 0.27 280)" },
  { icon: MessageSquare,color: "oklch(0.78 0.27 340)", bg: "oklch(0.78 0.27 340 / 0.15)", badge: "oklch(0.62 0.26 340)" },
  { icon: Rocket,       color: "oklch(0.75 0.22 200)", bg: "oklch(0.75 0.22 200 / 0.15)", badge: "oklch(0.55 0.22 200)" },
];

const STAT_COLORS = [
  "var(--primary)",
  "var(--accent)",
  "oklch(0.75 0.22 200)",
  "oklch(0.72 0.20 145)",
];

// ─── Scroll-aware floating navbar ─────────────────────────────────────────────

function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const navLinks = [
    { href: "#features", label: t.nav.features },
    { href: "#how", label: t.nav.howItWorks },
    { href: "#pricing", label: t.nav.pricing },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <header
        className={cn(
          "transition-all duration-500 rounded-2xl",
          scrolled
            ? "bg-background/85 backdrop-blur-xl border border-border/60 shadow-lg shadow-black/10"
            : "bg-transparent"
        )}
      >
        <nav className="px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Latzu" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="text-xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Latzu
            </span>
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-foreground transition-colors duration-200">
                {link.label}
              </a>
            ))}
          </div>

          {/* CTA + lang toggle + mobile toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/login">{t.nav.login}</Link>
            </Button>
            <Button size="sm" className="gap-1.5 hidden md:inline-flex" asChild>
              <Link href="/login">
                <Sparkles className="w-3.5 h-3.5" />
                {t.nav.tryFree}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border/50 shadow-2xl overflow-hidden bg-background/95 backdrop-blur-xl"
          >
            <nav className="flex flex-col p-3 gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 pt-3 border-t border-border/40 flex flex-col gap-2 px-1">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>{t.nav.login}</Link>
                </Button>
                <Button size="sm" className="gap-1.5 w-full" asChild>
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    <Sparkles className="w-3.5 h-3.5" />
                    {t.nav.tryFree}
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
  features: readonly string[];
}

function PricingCard({ tier, delay = 0 }: { tier: PricingTier; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
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
  const toggle = () => setOpen((v) => !v);
  return (
    <div
      role="button"
      tabIndex={0}
      className="border border-border/40 rounded-xl overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      onClick={toggle}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggle()}
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

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const isGuest = useIsGuest();
  const { t } = useLanguage();

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
          <p className="text-muted-foreground text-sm">{t.loading}</p>
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

  const features = t.featuresSection.items.map((item, i) => ({ ...FEATURE_META[i], ...item }));
  const steps = t.howSection.steps.map((step, i) => ({ ...STEP_META[i], ...step }));
  const pricingTiers = [...t.pricingSection.tiers] as PricingTier[];
  const faqs = t.faqSection.items;
  const stats = t.stats.map((s, i) => ({ ...s, color: STAT_COLORS[i] }));

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-gradient-latzu overflow-x-hidden">
      <Navbar />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-100 pointer-events-none" aria-hidden />

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
          {t.hero.badge}
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-7xl font-heading font-bold text-center max-w-4xl mx-auto leading-[1.1] tracking-tight"
        >
          {t.hero.headline1}{" "}
          <span
            className="bg-clip-text text-transparent animate-gradient"
            style={{
              backgroundImage: "linear-gradient(135deg, var(--primary), oklch(0.72 0.28 320), var(--accent), oklch(0.75 0.22 200))",
              backgroundSize: "300% 300%",
            }}
          >
            {t.hero.headline2}
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-base sm:text-xl text-muted-foreground text-center max-w-2xl mx-auto leading-relaxed"
        >
          {t.hero.subtitle}
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
              {t.hero.ctaPrimary}
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-primary/30 hover:bg-primary/8" asChild>
            <Link href="#how">
              <PlayCircle className="w-4 h-4" />
              {t.hero.ctaSecondary}
            </Link>
          </Button>
        </motion.div>

        {/* Social proof */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-4 text-xs text-muted-foreground/60 flex items-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          {t.hero.socialProof}
        </motion.p>

        {/* Hero visual */}
        <div className="relative mt-16 w-full max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "oklch(0.13 0.025 265 / 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid oklch(0.72 0.29 280 / 0.25)",
              boxShadow: "0 25px 80px oklch(0.52 0.27 280 / 0.25), 0 0 0 1px oklch(0.72 0.29 280 / 0.15)",
            }}
          >
            {/* App chrome: tab bar */}
            <div className="flex items-center border-b border-border/30 px-4 pt-3 text-xs">
              {["Chat", "Knowledge", "Study"].map((tab, ti) => (
                <div
                  key={tab}
                  className={cn(
                    "px-3 py-2 font-medium border-b-2 -mb-px transition-colors",
                    ti === 0 ? "border-primary text-foreground" : "border-transparent text-muted-foreground/50"
                  )}
                >
                  {tab}
                </div>
              ))}
              <div className="ml-auto flex items-center gap-1.5 pb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-emerald-400 font-medium">{t.hero.onlineStatus}</span>
              </div>
            </div>
            {/* Chat content */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg, var(--primary), var(--accent))"}}>
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold">AI Tutor — Latzu</span>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, oklch(0.72 0.29 280 / 0.25), oklch(0.78 0.27 340 / 0.15))"}}>
                    <Brain className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/30 rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-sm border border-border/20">
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {t.hero.chatMessage1}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 justify-end">
                  <div className="rounded-xl rounded-tr-none px-3.5 py-2.5 max-w-sm" style={{background:"oklch(0.72 0.29 280 / 0.18)", border:"1px solid oklch(0.72 0.29 280 / 0.30)"}}>
                    <p className="text-xs leading-relaxed">
                      {t.hero.chatUserMessage}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{background:"linear-gradient(135deg, oklch(0.72 0.29 280 / 0.25), oklch(0.78 0.27 340 / 0.15))"}}>
                    <Brain className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/30 rounded-xl rounded-tl-none px-3.5 py-2.5 max-w-sm border border-border/20">
                    <p className="text-xs leading-relaxed text-foreground/80">
                      {t.hero.chatMessage2}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:"0ms"}}/>
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{animationDelay:"150ms"}}/>
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{animationDelay:"300ms"}}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating cards */}
          <FloatingCard className="-top-4 -left-4 md:-left-20 gap-2 flex items-center animate-float" delay={0.8}>
            <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{background:"linear-gradient(135deg, var(--primary), var(--accent))"}}>
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-foreground/90">{t.hero.floatingMemory}</span>
          </FloatingCard>

          <FloatingCard className="-top-4 -right-4 md:-right-20 gap-2 flex items-center animate-float [animation-delay:1s]" delay={0.9}>
            <Star className="w-3.5 h-3.5 shrink-0" style={{color:"oklch(0.78 0.27 340)"}} />
            <span className="text-foreground/90">{t.hero.floatingStreak}</span>
          </FloatingCard>

          <FloatingCard className="-bottom-4 left-8 gap-2 flex items-center animate-float [animation-delay:2s]" delay={1.0}>
            <GraduationCap className="w-4 h-4 shrink-0" style={{color:"oklch(0.75 0.22 200)"}} />
            <span className="text-foreground/90">{t.hero.floatingConcepts}</span>
          </FloatingCard>
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────────────────────────── */}
      <section className="py-12 border-y border-border/30" style={{background:"oklch(0.52 0.27 280 / 0.04)"}}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0">
            {stats.map((s, i) => (
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
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{t.featuresSection.badge}</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold max-w-2xl mx-auto leading-tight">
              {t.featuresSection.title1}{" "}
              <span className="text-primary">{t.featuresSection.title2}</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              {t.featuresSection.subtitle}
            </p>
          </FadeIn>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.07}>
                <div
                  className="group rounded-2xl p-6 h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
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
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{t.howSection.badge}</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              {t.howSection.title1}{" "}
              <span className="text-primary">{t.howSection.title2}</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px" style={{background:"linear-gradient(90deg, transparent, oklch(0.72 0.29 280 / 0.5), oklch(0.78 0.27 340 / 0.5), transparent)"}} />

            {steps.map((step, i) => (
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
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{t.pricingSection.badge}</p>
            <h2 className="text-3xl md:text-5xl font-heading font-bold">
              {t.pricingSection.title1}{" "}
              <span className="text-primary">{t.pricingSection.title2}</span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              {t.pricingSection.subtitle}
            </p>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
            {pricingTiers.map((tier, i) => (
              <PricingCard key={tier.name} tier={tier} delay={i * 0.1} />
            ))}
          </div>

          <FadeIn className="mt-10 text-center">
            <p className="text-sm text-muted-foreground">
              {t.pricingSection.educationalText}{" "}
              <a href="mailto:latzuapp@gmail.com" className="text-primary hover:underline">
                {t.pricingSection.educationalLink}
              </a>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-20 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{t.testimonialsSection.badge}</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              {t.testimonialsSection.title1}{" "}
              <span className="text-primary">{t.testimonialsSection.title2}</span>
            </h2>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {t.testimonialsSection.items.map((item, i) => (
              <FadeIn key={item.name} delay={i * 0.1}>
                <div className="glass rounded-2xl p-5 h-full flex flex-col gap-4">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed flex-1">"{item.quote}"</p>
                  <div>
                    <p className="text-sm font-semibold">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.role}</p>
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
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">{t.faqSection.badge}</p>
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              {t.faqSection.title}
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
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="animate-blob absolute top-[-30%] left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-[80px]" style={{background:"oklch(0.52 0.27 280 / 0.35)"}} />
                <div className="animate-blob [animation-delay:3s] absolute bottom-[-20%] right-[-10%] w-64 h-64 rounded-full blur-[60px]" style={{background:"oklch(0.62 0.26 340 / 0.30)"}} />
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
                  {t.finalCtaSection.title1}{" "}
                  <span className="bg-clip-text text-transparent animate-gradient" style={{backgroundImage:"linear-gradient(135deg, var(--primary), oklch(0.72 0.28 320), var(--accent))", backgroundSize:"300% 300%"}}>
                    {t.finalCtaSection.title2}
                  </span>
                </h2>
                <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                  {t.finalCtaSection.subtitle}
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
                      {t.finalCtaSection.ctaPrimary}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="gap-2 px-8 h-12 text-base border-primary/40 hover:bg-primary/10" asChild>
                    <Link href="/login">
                      {t.finalCtaSection.ctaSecondary}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  {t.finalCtaSection.socialProof}
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
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Latzu" width={28} height={28} className="w-7 h-7 object-contain" />
              <span className="font-heading font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Latzu
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="#features" className="hover:text-foreground transition-colors">{t.footerSection.features}</a>
              <a href="#pricing" className="hover:text-foreground transition-colors">{t.footerSection.pricing}</a>
              <a href="mailto:latzuapp@gmail.com" className="hover:text-foreground transition-colors">{t.footerSection.contact}</a>
              <Link href="/privacidad" className="hover:text-foreground transition-colors">{t.footerSection.privacy}</Link>
              <Link href="/terminos" className="hover:text-foreground transition-colors">{t.footerSection.terms}</Link>
            </div>

            <p className="text-sm text-muted-foreground/60">
              {t.footerSection.copyright}
            </p>
          </div>
        </div>
      </footer>
    </div>
    </MotionConfig>
  );
}

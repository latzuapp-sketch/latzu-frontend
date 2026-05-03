"use client";

import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

const STATIC_NODES = Array.from({ length: 40 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  const angle = i * 0.618 * Math.PI * 2;
  const radius = 120 + r * 280;
  return {
    id: i,
    x: 50 + Math.cos(angle) * radius * 0.08,
    y: 50 + Math.sin(angle) * radius * 0.08,
    size: 0.4 + r * 0.7,
    color: ["violet", "amber", "teal", "rose"][i % 4],
  };
});

const COLOR_MAP: Record<string, string> = {
  violet: "oklch(0.67 0.22 268)",
  amber: "oklch(0.78 0.18 68)",
  teal: "oklch(0.72 0.16 195)",
  rose: "oklch(0.68 0.20 350)",
};

export function Hero() {
  const { t } = useLanguage();
  const h = t.landing.hero;

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16 overflow-hidden">
      {/* Background: faint cosmos illustration */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <svg className="w-full h-full opacity-70" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="hero-vignette" cx="50%" cy="50%">
              <stop offset="0%" stopColor="oklch(0.07 0.018 268)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.07 0.018 268)" stopOpacity="0.6" />
            </radialGradient>
          </defs>
          {STATIC_NODES.map((n) => (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={n.size}
              fill={COLOR_MAP[n.color]}
              opacity={0.5 + (n.id % 5) * 0.08}
            />
          ))}
          <rect width="100" height="100" fill="url(#hero-vignette)" />
        </svg>
      </div>

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-mono-display tracking-wide uppercase"
        style={{
          background: "oklch(0.78 0.18 68 / 0.10)",
          border: "1px solid oklch(0.78 0.18 68 / 0.30)",
          color: "oklch(0.78 0.18 68)",
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {h.badge}
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative font-display text-5xl sm:text-6xl md:text-8xl text-center max-w-5xl mx-auto leading-[0.95] text-foreground"
      >
        {h.headline1}
        <br />
        <span style={{ color: "oklch(0.78 0.18 68)" }}>{h.headline2}</span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.6 }}
        className="relative mt-7 text-base sm:text-lg text-muted-foreground text-center max-w-xl mx-auto leading-relaxed"
      >
        {h.sub}
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="relative mt-10 flex flex-col sm:flex-row items-center gap-3"
      >
        <Button
          size="lg"
          className="gap-2 px-8 h-12 text-base"
          style={{
            background: "linear-gradient(135deg, oklch(0.67 0.22 268), oklch(0.78 0.18 68))",
            boxShadow: "0 0 0 1px oklch(0.78 0.18 68 / 0.25), 0 8px 40px oklch(0.67 0.22 268 / 0.35)",
            border: "none",
          }}
          asChild
        >
          <Link href="/register">
            <Sparkles className="w-4 h-4" />
            {h.ctaPrimary}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
        <Button size="lg" variant="ghost" className="gap-2 px-6 h-12 text-base text-muted-foreground hover:text-foreground" asChild>
          <Link href="#problem">
            <PlayCircle className="w-4 h-4" />
            {h.ctaSecondary}
          </Link>
        </Button>
      </motion.div>

      {/* Mono ticker */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="relative mt-8 font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/50 flex items-center gap-2"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {h.mono}
      </motion.p>

      {/* Social proof */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.95 }}
        className="relative mt-3 text-xs text-muted-foreground/60 flex items-center gap-1.5"
      >
        <Shield className="w-3.5 h-3.5" />
        {h.socialProof}
      </motion.p>
    </section>
  );
}

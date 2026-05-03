"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Shield } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";

export function FinalCTA() {
  const { t } = useLanguage();
  const c = t.finalCtaSection;

  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, oklch(0.67 0.22 268 / 0.50), transparent)",
        }}
        aria-hidden
      />
      <div className="container mx-auto px-4 max-w-4xl text-center relative">
        {/* Logomark glow placeholder — gets the dissolving-into-CTA morph in task 3 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="relative mx-auto w-48 h-32 mb-12"
          aria-hidden
        >
          <svg viewBox="0 0 120 80" className="w-full h-full">
            <defs>
              <radialGradient id="cta-glow" cx="50%" cy="50%">
                <stop offset="0%" stopColor="oklch(0.78 0.18 68)" stopOpacity="0.45" />
                <stop offset="60%" stopColor="oklch(0.67 0.22 268)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="oklch(0.67 0.22 268)" stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx="60" cy="40" rx="55" ry="35" fill="url(#cta-glow)" />
            {[
              [40, 30], [60, 26], [80, 30], [50, 50], [70, 50],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.2" fill={i === 1 ? "oklch(0.78 0.18 68)" : "oklch(0.67 0.22 268)"} />
            ))}
            <line x1="40" y1="30" x2="60" y2="26" stroke="oklch(0.67 0.22 268 / 0.5)" strokeWidth="0.6" />
            <line x1="60" y1="26" x2="80" y2="30" stroke="oklch(0.67 0.22 268 / 0.5)" strokeWidth="0.6" />
            <line x1="40" y1="30" x2="50" y2="50" stroke="oklch(0.67 0.22 268 / 0.5)" strokeWidth="0.6" />
            <line x1="80" y1="30" x2="70" y2="50" stroke="oklch(0.67 0.22 268 / 0.5)" strokeWidth="0.6" />
            <line x1="50" y1="50" x2="70" y2="50" stroke="oklch(0.78 0.18 68 / 0.7)" strokeWidth="0.6" />
          </svg>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="font-display text-5xl md:text-7xl leading-[1.0] max-w-3xl mx-auto"
        >
          {c.title1}
          <br />
          <span style={{ color: "oklch(0.78 0.18 68)" }}>{c.title2}</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-6 text-base text-muted-foreground max-w-md mx-auto"
        >
          {c.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <Button
            size="lg"
            className="gap-2 px-10 h-12 text-base"
            style={{
              background: "linear-gradient(135deg, oklch(0.67 0.22 268), oklch(0.78 0.18 68))",
              boxShadow: "0 0 0 1px oklch(0.78 0.18 68 / 0.30), 0 12px 50px oklch(0.67 0.22 268 / 0.45)",
              border: "none",
            }}
            asChild
          >
            <Link href="/register">
              <Sparkles className="w-4 h-4" />
              {c.ctaPrimary}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button size="lg" variant="ghost" className="gap-2 px-6 h-12 text-base text-muted-foreground hover:text-foreground" asChild>
            <Link href="/login">
              {c.ctaSecondary}
            </Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ delay: 0.5 }}
          className="mt-5 text-xs text-muted-foreground/60 flex items-center justify-center gap-1.5"
        >
          <Shield className="w-3.5 h-3.5" />
          {c.socialProof}
        </motion.p>
      </div>
    </section>
  );
}

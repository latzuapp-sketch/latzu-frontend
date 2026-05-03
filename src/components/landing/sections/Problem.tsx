"use client";

import { motion } from "framer-motion";
import { useLanguage } from "@/lib/i18n";

export function Problem() {
  const { t } = useLanguage();
  const p = t.landing.problem;

  const clusters = [
    { cx: 22, cy: 32, color: "oklch(0.67 0.22 268)" },
    { cx: 50, cy: 60, color: "oklch(0.78 0.18 68)" },
    { cx: 78, cy: 35, color: "oklch(0.72 0.16 195)" },
  ];

  return (
    <section id="problem" className="relative py-28 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        <div className="order-2 md:order-1">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4"
          >
            {p.label}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-md"
          >
            {p.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md"
          >
            {p.sub}
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.4 }}
            className="mt-6 font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/50"
          >
            ── {p.mono}
          </motion.p>
        </div>

        <div className="order-1 md:order-2 relative aspect-square w-full max-w-md mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {clusters.map((c, ci) => (
              <g key={ci}>
                {Array.from({ length: 10 }).map((_, i) => {
                  const a = (i / 10) * Math.PI * 2 + ci;
                  const r = 4 + ((i * 7 + ci * 3) % 6);
                  return (
                    <motion.circle
                      key={i}
                      cx={c.cx + Math.cos(a) * r}
                      cy={c.cy + Math.sin(a) * r}
                      r={0.7 + (i % 3) * 0.15}
                      fill={c.color}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 0.9 }}
                      viewport={{ once: true, margin: "-100px" }}
                      transition={{ delay: ci * 0.15 + i * 0.02 }}
                    />
                  );
                })}
                <motion.text
                  x={c.cx}
                  y={c.cy + 14}
                  textAnchor="middle"
                  fill="oklch(0.62 0.014 270)"
                  fontSize="2.5"
                  fontFamily="JetBrains Mono"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: ci * 0.15 + 0.4 }}
                >
                  {p.clusters[ci].label.toUpperCase()}
                </motion.text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

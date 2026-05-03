"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export function Knowledge() {
  const { t } = useLanguage();
  const k = t.landing.knowledge;

  const nodes = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.5;
    const r = 18 + (i % 4) * 6;
    return {
      x: 50 + Math.cos(a) * r,
      y: 50 + Math.sin(a) * r,
      color: ["oklch(0.67 0.22 268)", "oklch(0.78 0.18 68)", "oklch(0.72 0.16 195)"][i % 3],
    };
  });
  const edges: [number, number][] = [];
  for (let i = 0; i < nodes.length; i++) {
    edges.push([i, (i + 3) % nodes.length]);
    if (i % 2 === 0) edges.push([i, (i + 7) % nodes.length]);
  }

  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4"
          >
            {k.label}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-md"
          >
            {k.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md"
          >
            {k.sub}
          </motion.p>
          <ul className="mt-7 space-y-3 max-w-md">
            {k.bullets.map((b, i) => (
              <motion.li
                key={b}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: 0.3 + i * 0.08 }}
                className="flex items-start gap-3 text-sm text-foreground/80"
              >
                <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "oklch(0.78 0.18 68)" }} />
                <span>{b}</span>
              </motion.li>
            ))}
          </ul>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.7 }}
            className="mt-7 font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/50"
          >
            ── {k.mono}
          </motion.p>
        </div>

        <div className="relative aspect-square w-full max-w-md mx-auto">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {edges.map(([a, b], i) => (
              <motion.line
                key={i}
                x1={nodes[a].x}
                y1={nodes[a].y}
                x2={nodes[b].x}
                y2={nodes[b].y}
                stroke="oklch(0.67 0.22 268 / 0.3)"
                strokeWidth="0.15"
                initial={{ pathLength: 0, opacity: 0 }}
                whileInView={{ pathLength: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: 0.2 + (i / edges.length) * 0.4 }}
              />
            ))}
            {nodes.map((n, i) => (
              <motion.circle
                key={i}
                cx={n.x}
                cy={n.y}
                r={1.1 + (i % 3) * 0.2}
                fill={n.color}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.025 }}
              />
            ))}
          </svg>
        </div>
      </div>
    </section>
  );
}

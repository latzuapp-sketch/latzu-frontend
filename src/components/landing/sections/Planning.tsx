"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

const COLORS = [
  "oklch(0.67 0.22 268)",
  "oklch(0.78 0.18 68)",
  "oklch(0.72 0.16 195)",
  "oklch(0.68 0.20 350)",
];

export function Planning() {
  const { t } = useLanguage();
  const p = t.landing.planning;

  return (
    <section className="relative py-28 md:py-40 overflow-hidden">
      <div className="container mx-auto px-4 grid md:grid-cols-2 gap-16 items-center max-w-6xl">
        <div className="order-2 md:order-1 relative w-full">
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {p.columns.map((col, ci) => (
              <div key={col} className="space-y-2">
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ delay: ci * 0.05 }}
                  className="font-mono-display text-[9px] tracking-widest uppercase text-muted-foreground/60 text-center"
                >
                  {col}
                </motion.p>
                {Array.from({ length: 3 + ((ci + 1) % 2) }).map((_, ri) => (
                  <motion.div
                    key={ri}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ delay: 0.1 + ci * 0.06 + ri * 0.04 }}
                    className="h-9 rounded-md border"
                    style={{
                      background: `${COLORS[(ci + ri) % 4]} / 0.10`.replace(") / 0.10", " / 0.10)"),
                      backgroundColor: `color-mix(in oklch, ${COLORS[(ci + ri) % 4]} 14%, transparent)`,
                      borderColor: `color-mix(in oklch, ${COLORS[(ci + ri) % 4]} 30%, transparent)`,
                    }}
                  >
                    <div className="px-1.5 py-1.5 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full shrink-0" style={{ background: COLORS[(ci + ri) % 4] }} />
                      <span className="h-1 w-full rounded-full" style={{ background: `color-mix(in oklch, ${COLORS[(ci + ri) % 4]} 30%, transparent)` }} />
                    </div>
                    <div className="px-1.5">
                      <span className="block h-0.5 w-1/2 rounded-full" style={{ background: `color-mix(in oklch, ${COLORS[(ci + ri) % 4]} 22%, transparent)` }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="order-1 md:order-2">
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
          <ul className="mt-7 space-y-3 max-w-md">
            {p.bullets.map((b, i) => (
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
        </div>
      </div>
    </section>
  );
}

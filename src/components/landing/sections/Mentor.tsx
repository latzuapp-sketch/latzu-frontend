"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Mentor() {
  const { t } = useLanguage();
  const m = t.landing.mentor;

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
            {m.label}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-md"
          >
            {m.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-5 text-base text-muted-foreground leading-relaxed max-w-md"
          >
            {m.sub}
          </motion.p>
        </div>

        <div className="relative">
          <div
            className="rounded-3xl p-5 md:p-6 max-w-md mx-auto backdrop-blur-md"
            style={{
              background: "oklch(0.10 0.018 268 / 0.6)",
              border: "1px solid oklch(0.67 0.22 268 / 0.20)",
              boxShadow: "0 30px 80px oklch(0.67 0.22 268 / 0.15)",
            }}
          >
            <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-border/30">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, oklch(0.67 0.22 268), oklch(0.78 0.18 68))",
                }}
              >
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{m.agentName}</p>
                <p className="font-mono-display text-[10px] tracking-widest uppercase text-muted-foreground/60">{m.typing}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono-display text-[10px] tracking-widest uppercase text-emerald-400">{m.statusLabel}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {m.bubbles.map((bubble, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ delay: 0.3 + i * 0.2 }}
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    bubble.from === "user"
                      ? "self-end rounded-tr-sm text-foreground"
                      : "self-start rounded-tl-sm text-foreground/90"
                  )}
                  style={
                    bubble.from === "user"
                      ? { background: "oklch(0.67 0.22 268 / 0.20)", border: "1px solid oklch(0.67 0.22 268 / 0.35)" }
                      : { background: "oklch(0.16 0.020 268)", border: "1px solid oklch(0.22 0.025 268)" }
                  }
                >
                  {bubble.text}
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: 0.3 + m.bubbles.length * 0.2 }}
                className="self-start mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-full"
                style={{ background: "oklch(0.16 0.020 268)" }}
              >
                <span className="w-1 h-1 rounded-full" style={{ background: "oklch(0.78 0.18 68)" }} />
                <span className="w-1 h-1 rounded-full" style={{ background: "oklch(0.78 0.18 68)" }} />
                <span className="w-1 h-1 rounded-full" style={{ background: "oklch(0.78 0.18 68)" }} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

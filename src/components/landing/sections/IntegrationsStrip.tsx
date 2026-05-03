"use client";

import { motion } from "framer-motion";
import { MessageCircle, CalendarDays, HardDrive, Youtube, Globe } from "lucide-react";
import type { ComponentType } from "react";
import { useLanguage } from "@/lib/i18n";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  WhatsApp: MessageCircle,
  "Google Calendar": CalendarDays,
  "Google Drive": HardDrive,
  YouTube: Youtube,
  "Web & PDF": Globe,
};

export function IntegrationsStrip() {
  const { t } = useLanguage();
  const i = t.landing.integrations;

  return (
    <section className="relative py-20 md:py-24 border-y border-border/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-10">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-3"
          >
            {i.label}
          </motion.p>
          <motion.h3
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="font-display text-3xl md:text-4xl leading-tight"
          >
            {i.headline}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: 0.15 }}
            className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto"
          >
            {i.sub}
          </motion.p>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3">
          {i.items.map((item, idx) => {
            const Icon = ICONS[item.name] ?? Globe;
            return (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ delay: idx * 0.06 }}
                className="group flex items-center gap-2.5 rounded-full px-4 py-2.5 border border-border/40 hover:border-border/70 transition-colors cursor-default"
                style={{ background: "oklch(0.10 0.018 268 / 0.5)" }}
              >
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                <span className="text-sm font-medium text-foreground/85">{item.name}</span>
                <span className="font-mono-display text-[10px] tracking-wider uppercase text-muted-foreground/50 hidden sm:inline">·</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">{item.desc}</span>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/50 flex items-center justify-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {i.mono}
        </motion.p>
      </div>
    </section>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Tier {
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  cta: string;
  featured?: boolean;
  features: readonly string[];
}

function PricingCard({ tier, delay = 0 }: { tier: Tier; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay }}
      className={cn(
        "relative rounded-3xl p-7 flex flex-col gap-6 border transition-all duration-300 hover:-translate-y-1",
        tier.featured ? "border-[oklch(0.78_0.18_68_/_0.50)]" : "border-border/40"
      )}
      style={{
        background: tier.featured
          ? "linear-gradient(160deg, oklch(0.67 0.22 268 / 0.16) 0%, oklch(0.10 0.018 268 / 0.4) 60%, oklch(0.78 0.18 68 / 0.10) 100%)"
          : "oklch(0.10 0.018 268 / 0.5)",
        boxShadow: tier.featured
          ? "0 30px 80px oklch(0.67 0.22 268 / 0.20), inset 0 1px 0 oklch(0.78 0.18 68 / 0.10)"
          : "none",
      }}
    >
      {tier.badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 font-mono-display text-[10px] tracking-widest uppercase px-3 py-1 rounded-full"
          style={{
            background: "oklch(0.78 0.18 68)",
            color: "oklch(0.10 0.018 268)",
          }}
        >
          {tier.badge}
        </span>
      )}
      <div>
        <p className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/70 mb-2">{tier.name}</p>
        <div className="flex items-end gap-1.5">
          <span className="font-display text-5xl">{tier.price}</span>
          <span className="text-muted-foreground text-sm mb-2">{tier.period}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-2.5">{tier.description}</p>
      </div>
      <Button size="lg" variant={tier.featured ? "default" : "outline"} className="w-full gap-2" asChild>
        <Link href="/register">
          {tier.cta}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </Button>
      <ul className="space-y-3">
        {tier.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tier.featured ? "oklch(0.78 0.18 68)" : "oklch(0.67 0.22 268)" }} />
            <span className="text-foreground/80">{f}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function Pricing() {
  const { t } = useLanguage();
  const p = t.pricingSection;
  const tiers = [...p.tiers] as Tier[];

  return (
    <section id="pricing" className="relative py-28 md:py-36">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-16"
        >
          <p className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground/60 mb-4">{p.badge}</p>
          <h2 className="font-display text-4xl md:text-6xl leading-[1.05] tracking-tight max-w-2xl mx-auto">
            {p.title}
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-xl mx-auto">{p.subtitle}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-start">
          {tiers.map((tier, i) => (
            <PricingCard key={tier.name} tier={tier} delay={i * 0.08} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center text-sm text-muted-foreground"
        >
          {p.educationalText}{" "}
          <a href="mailto:latzuapp@gmail.com" className="text-foreground hover:text-[oklch(0.78_0.18_68)] transition-colors underline underline-offset-4">
            {p.educationalLink}
          </a>
        </motion.p>
      </div>
    </section>
  );
}

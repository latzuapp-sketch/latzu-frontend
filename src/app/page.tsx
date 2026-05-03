"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, MotionConfig } from "framer-motion";
import { useIsGuest } from "@/stores/userStore";
import { useLanguage } from "@/lib/i18n";

import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/sections/Hero";
import { Problem } from "@/components/landing/sections/Problem";
import { Knowledge } from "@/components/landing/sections/Knowledge";
import { Planning } from "@/components/landing/sections/Planning";
import { Mentor } from "@/components/landing/sections/Mentor";
import { IntegrationsStrip } from "@/components/landing/sections/IntegrationsStrip";
import { Pricing } from "@/components/landing/sections/Pricing";
import { FinalCTA } from "@/components/landing/sections/FinalCTA";

export default function HomePage() {
  const { status } = useSession();
  const router = useRouter();
  const isGuest = useIsGuest();
  const { t } = useLanguage();

  useEffect(() => {
    if (status === "authenticated" || isGuest) {
      router.replace("/brain");
    }
  }, [status, isGuest, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-landing flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse mx-auto mb-4" />
          <p className="font-mono-display text-[11px] tracking-widest uppercase text-muted-foreground">{t.loading}</p>
        </motion.div>
      </div>
    );
  }

  if (status === "authenticated" || isGuest) {
    return (
      <div className="min-h-screen bg-landing flex items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-landing text-foreground overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <Problem />
          <Knowledge />
          <Planning />
          <Mentor />
          <IntegrationsStrip />
          <Pricing />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  );
}

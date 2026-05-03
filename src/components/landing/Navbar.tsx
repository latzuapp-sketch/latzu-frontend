"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LangToggle, useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-4 left-4 right-4 z-50">
      <header
        className={cn(
          "transition-all duration-500 rounded-2xl",
          scrolled
            ? "bg-[oklch(0.07_0.018_268_/_0.78)] backdrop-blur-xl border border-border/50 shadow-2xl shadow-black/30"
            : "bg-transparent"
        )}
      >
        <nav className="px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="Latzu" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-display text-xl text-foreground">Latzu</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-[13px] text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">{t.nav.pricing}</a>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <LangToggle />
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/login">{t.nav.login}</Link>
            </Button>
            <Button size="sm" className="gap-1.5 hidden md:inline-flex" asChild>
              <Link href="/register">
                <Sparkles className="w-3.5 h-3.5" />
                {t.nav.tryFree}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden cursor-pointer"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-border/50 shadow-2xl overflow-hidden bg-[oklch(0.07_0.018_268_/_0.95)] backdrop-blur-xl"
          >
            <nav className="flex flex-col p-3 gap-1">
              <a href="#pricing" onClick={() => setOpen(false)} className="px-4 py-3 rounded-xl text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer">
                {t.nav.pricing}
              </a>
              <div className="mt-2 pt-3 border-t border-border/40 flex flex-col gap-2 px-1">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href="/login" onClick={() => setOpen(false)}>{t.nav.login}</Link>
                </Button>
                <Button size="sm" className="gap-1.5 w-full" asChild>
                  <Link href="/register" onClick={() => setOpen(false)}>
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

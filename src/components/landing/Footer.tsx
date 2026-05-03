"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";

export function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-border/30 py-10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Latzu" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="font-display text-lg">Latzu</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <a href="#pricing" className="hover:text-foreground transition-colors">{t.footerSection.pricing}</a>
            <a href="mailto:latzuapp@gmail.com" className="hover:text-foreground transition-colors">{t.footerSection.contact}</a>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">{t.footerSection.privacy}</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">{t.footerSection.terms}</Link>
          </div>
          <p className="font-mono-display text-xs text-muted-foreground/60">{t.footerSection.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

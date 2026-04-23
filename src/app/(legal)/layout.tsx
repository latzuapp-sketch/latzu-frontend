import Link from "next/link";
import { Brain } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-base bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Latzu
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link href="/privacidad" className="hover:text-foreground transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">
              Términos
            </Link>
            <Link href="/eliminar-datos" className="hover:text-foreground transition-colors">
              Eliminar datos
            </Link>
          </nav>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 mt-16">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-5">
            <Link href="/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">Términos de Servicio</Link>
            <Link href="/eliminar-datos" className="hover:text-foreground transition-colors">Eliminar datos</Link>
          </div>
          <p className="text-muted-foreground/60">© 2025 Latzu · latzuapp@gmail.com</p>
        </div>
      </footer>
    </div>
  );
}

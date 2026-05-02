"use client";

/**
 * DeckViewer — opens a flashcard Deck inside the brain's UniversalViewer.
 *
 * Layout:
 *   - Header: deck name, description, due/total counts
 *   - Action: "Repasar ahora" → /study (filters to this deck)
 *   - Card list: each card shows front + click to flip and reveal back
 */

import { useState } from "react";
import Link from "next/link";
import {
  Layers3, ArrowRight, Loader2, ChevronDown, ChevronUp, Pin,
  Calendar,
} from "lucide-react";
import type { Deck, Flashcard } from "@/types/flashcards";
import { useDeckCards } from "@/hooks/useFlashcards";
import { deckColorCls } from "@/types/flashcards";
import { cn } from "@/lib/utils";

function formatDue(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    const due = new Date(iso);
    const now = Date.now();
    const days = Math.round((due.getTime() - now) / 86_400_000);
    if (days === 0) return "Hoy";
    if (days === 1) return "Mañana";
    if (days === -1) return "Ayer";
    if (days < 0) return `Atrasada ${Math.abs(days)}d`;
    if (days < 7) return `En ${days}d`;
    return due.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  } catch {
    return null;
  }
}

export function DeckViewer({ deck }: { deck: Deck }) {
  const { cards, loading } = useDeckCards(deck.id);
  const colorCls = deckColorCls(deck.color);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0", colorCls)}>
          <Layers3 className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300">Mazo</span>
          <h1 className="text-xl font-heading font-bold leading-tight mt-0.5">{deck.name}</h1>
          {deck.description && (
            <p className="text-sm text-muted-foreground mt-1">{deck.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground/70">
            <span>{deck.cardCount} {deck.cardCount === 1 ? "tarjeta" : "tarjetas"}</span>
            {deck.dueCount > 0 && (
              <span className="text-amber-300">{deck.dueCount} para repasar</span>
            )}
            {deck.newCount > 0 && (
              <span className="text-sky-300">{deck.newCount} nuevas</span>
            )}
          </div>
        </div>
      </div>

      {/* Review action */}
      {deck.dueCount > 0 && (
        <Link
          href={`/study?deck=${deck.id}`}
          className="flex items-center justify-between rounded-xl border border-teal-500/30 bg-teal-500/5 hover:bg-teal-500/10 p-3 transition-colors"
        >
          <div>
            <p className="text-sm font-semibold">Repasar ahora</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {deck.dueCount} {deck.dueCount === 1 ? "tarjeta lista" : "tarjetas listas"} para repaso SRS
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-teal-300" />
        </Link>
      )}

      {/* Cards */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 px-1">
          Tarjetas
        </div>
        {loading && cards.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && cards.length === 0 && (
          <p className="text-sm text-muted-foreground italic px-1">Este mazo todavía no tiene tarjetas.</p>
        )}
        {cards.map((card) => (
          <CardRow key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}

function CardRow({ card }: { card: Flashcard }) {
  const [expanded, setExpanded] = useState(false);
  const due = formatDue(card.dueDate);

  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="w-full text-left rounded-lg border border-border/40 bg-card/30 hover:bg-card/50 transition-colors overflow-hidden"
    >
      <div className="p-3 flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            {card.pinned && <Pin className="w-3 h-3 text-yellow-300" fill="currentColor" />}
            <span className="text-[9px] font-medium text-muted-foreground/60">
              Tarjeta · reps {card.reps}
            </span>
            {due && (
              <span className="inline-flex items-center gap-0.5 text-[9px] text-muted-foreground/60">
                <Calendar className="w-2.5 h-2.5" />
                {due}
              </span>
            )}
          </div>
          <p className="text-sm font-medium leading-snug">{card.front}</p>
          {expanded && (
            <p className="text-sm text-muted-foreground leading-relaxed mt-2 pt-2 border-t border-border/30 whitespace-pre-line">
              {card.back || "(Sin contenido)"}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/60 mt-1 shrink-0" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 mt-1 shrink-0" />
        )}
      </div>
    </button>
  );
}

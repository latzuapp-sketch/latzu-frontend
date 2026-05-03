"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainDeckCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useDecks, useDueCount } from "@/hooks/useFlashcards";

/** Flashcards — deck cards with due-count summary up top. */
export default function BrainFlashcardsPage() {
  const { decks, loading, refetch } = useDecks();
  const dueCount = useDueCount();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  return (
    <BrainPageShell
      title="Flashcards"
      subtitle={dueCount > 0
        ? `${dueCount} ${dueCount === 1 ? "carta vence" : "cartas vencen"} hoy — repaso espaciado SM-2`
        : "Repaso espaciado SM-2 — todas al día"}
      count={decks.length}
      onCreated={refetch}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {loading && decks.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No tenés decks. Usá el botón <span className="text-teal-300 font-medium">Deck</span> de arriba.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {decks.map((d) => (
            <BrainDeckCard key={d.id} deck={d} onClick={() => setViewing({ kind: "deck", deck: d })} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

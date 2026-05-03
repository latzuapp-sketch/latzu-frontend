"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Layers3 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainDeckCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useDecks, useDueCount } from "@/hooks/useFlashcards";

/** Flashcards — deck grid + inline teal-themed deck creator. */
export default function BrainFlashcardsPage() {
  const { decks, loading, createDeck, refetch } = useDecks();
  const dueCount = useDueCount();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 50); }, [open]);

  const submit = async () => {
    const n = name.trim();
    if (!n || busy) return;
    setBusy(true);
    try {
      await createDeck(n);
      setName("");
      setOpen(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrainPageShell
      title="Flashcards"
      subtitle={dueCount > 0
        ? `${dueCount} ${dueCount === 1 ? "carta vence" : "cartas vencen"} hoy — repaso espaciado SM-2`
        : "Repaso espaciado SM-2 — todas al día"}
      count={decks.length}
      toolbar={
        !open && (
          <button
            onClick={() => setOpen(true)}
            className="h-8 px-3 rounded-md border border-teal-500/40 bg-teal-500/15 hover:bg-teal-500/25 text-teal-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo deck
          </button>
        )
      }
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 rounded-xl border border-teal-500/40 bg-teal-500/10 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Layers3 className="w-4 h-4 text-teal-300" />
              <span className="text-sm font-semibold text-teal-200">Nuevo deck</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">Enter · Esc</span>
            </div>
            <input
              ref={ref}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setOpen(false); setName(""); }
                if (e.key === "Enter") { e.preventDefault(); submit(); }
              }}
              placeholder="Ej. 'Anatomía — sistema nervioso'"
              className="w-full bg-background/60 rounded-md p-2 text-sm outline-none placeholder:text-muted-foreground/40 border border-border/40"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setOpen(false); setName(""); }} className="text-xs px-3 py-1 rounded-md text-muted-foreground hover:text-foreground" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!name.trim() || busy}
                className="text-xs px-3 py-1 rounded-md bg-teal-500/25 text-teal-100 hover:bg-teal-500/35 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Crear deck
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && decks.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">No tenés decks.</div>
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

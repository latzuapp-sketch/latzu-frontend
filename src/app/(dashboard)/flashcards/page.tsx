"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDecks, useDeckCards, useDueCards } from "@/hooks/useFlashcards";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { deckColorCls, DECK_COLORS, type Deck } from "@/types/flashcards";
import {
  Brain, Plus, Trash2, Layers, Flame, BookOpen,
  ChevronRight, Sparkles, X, Check, AlertCircle, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useIsMobile";

// ─── Create Deck Modal ────────────────────────────────────────────────────────

function CreateDeckModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string, color: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("teal");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onCreate(name.trim(), description.trim(), color);
    setLoading(false);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-md glass rounded-2xl p-6 border border-border/50"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading font-semibold text-lg">Nuevo mazo</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nombre *</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Biología Celular"
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Descripción (opcional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Conceptos de la unidad 3"
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {DECK_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    "w-8 h-8 rounded-lg border-2 transition-all",
                    c.cls,
                    color === c.value ? "border-foreground/60 scale-110" : "border-transparent"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading || !name.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Crear mazo
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Deck Card ────────────────────────────────────────────────────────────────

function DeckCard({
  deck,
  onDelete,
}: {
  deck: Deck;
  onDelete: (id: string) => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const colorCls = deckColorCls(deck.color);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group glass rounded-2xl border border-border/50 p-5 hover:border-border transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center shrink-0", colorCls)}>
          <Layers className="w-5 h-5" />
        </div>
        <button
          onClick={() => {
            if (!confirmDel) { setConfirmDel(true); return; }
            onDelete(deck.id);
          }}
          onBlur={() => setConfirmDel(false)}
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-all p-1 rounded text-muted-foreground/50",
            confirmDel ? "text-destructive opacity-100" : "hover:text-destructive"
          )}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <h3 className="font-semibold text-sm mb-1 line-clamp-1">{deck.name}</h3>
      {deck.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{deck.description}</p>
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" />
          {deck.cardCount} tarjetas
        </span>
        {deck.dueCount > 0 && (
          <span className="flex items-center gap-1 text-amber-400">
            <Flame className="w-3 h-3" />
            {deck.dueCount} para repasar
          </span>
        )}
        {deck.newCount > 0 && (
          <span className="flex items-center gap-1 text-primary">
            <Sparkles className="w-3 h-3" />
            {deck.newCount} nuevas
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-xs">
          <Link href={`/flashcards/${deck.id}`}>Ver mazo</Link>
        </Button>
        {(deck.dueCount > 0 || deck.newCount > 0) && (
          <Button asChild size="sm" className="flex-1 h-8 text-xs gap-1">
            <Link href={`/flashcards/review?deck=${deck.id}`}>
              <Brain className="w-3.5 h-3.5" />
              Repasar
            </Link>
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FlashcardsPage() {
  const { decks, loading, createDeck, deleteDeck } = useDecks();
  const { dueCards } = useDueCards(null, 5);
  const [showCreate, setShowCreate] = useState(false);

  const totalDue = decks.reduce((s, d) => s + d.dueCount + d.newCount, 0);

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Repetición espaciada · recuerda más, olvida menos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalDue > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/flashcards/review">
                <Flame className="w-3.5 h-3.5" />
                Repasar {totalDue}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nuevo mazo</span>
          </Button>
        </div>
      </motion.div>

      {/* Today's session strip */}
      {totalDue > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.05 } }}
          className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-primary/5 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Sesión de repaso pendiente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalDue} tarjeta{totalDue !== 1 ? "s" : ""} esperan · ~{Math.ceil(totalDue * 0.5)} min estimados
              </p>
            </div>
            <Button asChild size="sm" className="gap-1.5 shrink-0">
              <Link href="/flashcards/review">
                <Brain className="w-3.5 h-3.5" />
                Empezar
              </Link>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Decks grid */}
      {loading && decks.length === 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-3">
              <div className="w-10 h-10 rounded-xl bg-muted/40" />
              <div className="h-3.5 bg-muted/40 rounded w-2/3" />
              <div className="h-2.5 bg-muted/30 rounded w-full" />
              <div className="h-7 bg-muted/30 rounded-lg" />
            </div>
          ))}
        </div>
      ) : decks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Layers className="w-8 h-8 text-primary/60" />
          </div>
          <div>
            <p className="font-semibold">Crea tu primer mazo</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              Organiza tus tarjetas en mazos por tema, materia o proyecto.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Crear mazo
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} onDelete={deleteDeck} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateDeckModal
            onClose={() => setShowCreate(false)}
            onCreate={async (name, desc, color) => {
              await createDeck(name, desc, color);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

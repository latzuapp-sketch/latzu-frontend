"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDecks, useDeckCards } from "@/hooks/useFlashcards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deckColorCls, type Flashcard } from "@/types/flashcards";
import {
  ArrowLeft, Plus, Trash2, Brain, Sparkles, Loader2,
  BookOpen, Eye, EyeOff, X, Flame,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Add Card Modal ───────────────────────────────────────────────────────────

function AddCardModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (front: string, back: string) => Promise<void>;
}) {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) return;
    setLoading(true);
    await onCreate(front.trim(), back.trim());
    setFront("");
    setBack("");
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        className="w-full max-w-lg glass rounded-2xl p-5 border border-border/50"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Nueva tarjeta</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Pregunta (frente)</label>
            <textarea
              autoFocus
              value={front}
              onChange={(e) => setFront(e.target.value)}
              rows={3}
              placeholder="¿Qué es la mitosis?"
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Respuesta (reverso)</label>
            <textarea
              value={back}
              onChange={(e) => setBack(e.target.value)}
              rows={3}
              placeholder="División celular que produce dos células hijas genéticamente idénticas..."
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50 resize-none"
            />
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading || !front.trim() || !back.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Agregar
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Card Row ─────────────────────────────────────────────────────────────────

function CardRow({ card, onDelete }: { card: Flashcard; onDelete: (id: string) => void }) {
  const [showBack, setShowBack] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isDue = new Date(card.dueDate) <= new Date();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group glass rounded-xl border border-border/40 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <p className="text-sm font-medium leading-snug">{card.front}</p>
          <AnimatePresence>
            {showBack && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-1.5 mt-1.5"
              >
                {card.back}
              </motion.p>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground/50">
              Intervalo: {card.interval}d · Reps: {card.reps} · EF: {card.easeFactor.toFixed(1)}
            </span>
            {isDue && (
              <span className="text-[10px] text-amber-400 flex items-center gap-1">
                <Flame className="w-2.5 h-2.5" />
                Para repasar
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowBack((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            {showBack ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => {
              if (!confirmDel) { setConfirmDel(true); return; }
              onDelete(card.id);
            }}
            onBlur={() => setConfirmDel(false)}
            className={cn(
              "p-1.5 rounded-lg transition-colors",
              confirmDel
                ? "text-destructive"
                : "text-muted-foreground/50 hover:text-destructive hover:bg-muted/30"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DeckPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { decks } = useDecks();
  const { cards, loading, createCard, deleteCard, generateFromNode } = useDeckCards(id);
  const [showAdd, setShowAdd] = useState(false);
  const [generating, setGenerating] = useState(false);

  const deck = decks.find((d) => d.id === id);
  const colorCls = deckColorCls(deck?.color ?? "teal");
  const dueCount = cards.filter((c) => new Date(c.dueDate) <= new Date()).length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/flashcards">
            <ArrowLeft className="w-4 h-4" />
            Mazos
          </Link>
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0", colorCls)}>
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">{deck?.name ?? "Mazo"}</h1>
            <p className="text-sm text-muted-foreground">
              {cards.length} tarjetas
              {dueCount > 0 && ` · ${dueCount} para repasar`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/flashcards/review?deck=${id}`}>
                <Brain className="w-3.5 h-3.5" />
                Repasar {dueCount}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Agregar</span>
          </Button>
        </div>
      </motion.div>

      {/* Cards list */}
      {loading && cards.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <Brain className="w-12 h-12 mx-auto text-primary/30" />
          <div>
            <p className="font-semibold">Mazo vacío</p>
            <p className="text-sm text-muted-foreground mt-1">Agrega tarjetas manualmente o genera con IA.</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Agregar tarjeta
            </Button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {cards.map((card) => (
              <CardRow key={card.id} card={card} onDelete={deleteCard} />
            ))}
          </div>
        </AnimatePresence>
      )}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <AddCardModal
            onClose={() => setShowAdd(false)}
            onCreate={async (front, back) => {
              await createCard(front, back);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

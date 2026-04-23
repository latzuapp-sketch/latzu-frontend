"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDueCards } from "@/hooks/useFlashcards";
import { qualityLabel, qualityColor, type ReviewQuality } from "@/lib/sm2";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Flashcard } from "@/types/flashcards";
import {
  ArrowLeft, CheckCircle2, RotateCcw, NotebookPen, Flame,
  ChevronDown, Brain,
} from "lucide-react";
import Link from "next/link";

// ─── Note Review Card ─────────────────────────────────────────────────────────

function NoteCard({
  note,
  revealed,
  onReveal,
}: {
  note: Flashcard;
  revealed: boolean;
  onReveal: () => void;
}) {
  return (
    <div className="w-full space-y-3">
      {/* Title always visible */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Título</p>
        <h2 className="text-xl sm:text-2xl font-heading font-bold leading-snug">{note.front}</h2>
        {!revealed && (
          <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
            <ChevronDown className="w-3.5 h-3.5" />
            ¿Recuerdas el contenido? Intenta recordar antes de revelar
          </p>
        )}
      </div>

      {/* Reveal button or content */}
      <AnimatePresence mode="wait">
        {!revealed ? (
          <motion.div
            key="reveal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              onClick={onReveal}
              className="w-full rounded-2xl border border-dashed border-border/50 bg-muted/20 hover:bg-muted/30 transition-colors p-6 text-center text-sm text-muted-foreground hover:text-foreground group"
            >
              <Brain className="w-6 h-6 mx-auto mb-2 text-primary/40 group-hover:text-primary/60 transition-colors" />
              Toca para revelar el contenido
              <span className="block text-xs mt-1 opacity-50">o presiona Espacio</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/8 to-card p-6 sm:p-8"
          >
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">Contenido</p>
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-foreground/90">
              {note.back || "Sin contenido"}
            </p>
            {note.reps > 0 && (
              <p className="text-xs text-muted-foreground/40 mt-4">
                Repaso #{note.reps + 1} · intervalo actual: {note.interval}d
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Quality buttons ─────────────────────────────────────────────────────────

const QUALITIES: ReviewQuality[] = [1, 2, 3, 4];

function QualityBar({ onSelect }: { onSelect: (q: ReviewQuality) => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const q = Number(e.key) as ReviewQuality;
      if ([1, 2, 3, 4].includes(q)) onSelect(q);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSelect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <p className="text-xs text-center text-muted-foreground">
        ¿Qué tan bien recordabas el contenido?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {QUALITIES.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-semibold transition-all hover:scale-105 active:scale-95",
              qualityColor(q)
            )}
          >
            <span className="text-base font-bold">{q}</span>
            <span>{qualityLabel(q)}</span>
          </button>
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground/50">
        Teclas <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono text-[10px]">1</kbd>–<kbd className="px-1 py-0.5 rounded border border-border/50 font-mono text-[10px]">4</kbd>
      </p>
    </motion.div>
  );
}

// ─── Session summary ─────────────────────────────────────────────────────────

function Summary({
  results,
  onRepeat,
}: {
  results: { quality: ReviewQuality }[];
  onRepeat: () => void;
}) {
  const counts = {
    again: results.filter((r) => r.quality === 1).length,
    hard: results.filter((r) => r.quality === 2).length,
    good: results.filter((r) => r.quality === 3).length,
    easy: results.filter((r) => r.quality === 4).length,
  };
  const score = Math.round(
    (results.reduce((s, r) => s + r.quality, 0) / (results.length * 4)) * 100
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-4 max-w-sm mx-auto text-center"
    >
      <div className={cn(
        "w-20 h-20 rounded-full flex items-center justify-center",
        score >= 70 ? "bg-emerald-500/15" : "bg-amber-500/15"
      )}>
        {score >= 70
          ? <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          : <Flame className="w-10 h-10 text-amber-400" />}
      </div>

      <div>
        <p className="text-2xl font-heading font-bold">
          {score >= 90 ? "¡Excelente!" : score >= 70 ? "¡Buen trabajo!" : "Sigue repasando"}
        </p>
        <p className="text-muted-foreground mt-1">
          {results.length} nota{results.length !== 1 ? "s" : ""} · {score}% retención
        </p>
      </div>

      <div className="grid grid-cols-4 gap-3 w-full">
        {[
          { label: "Otra vez", count: counts.again, color: "text-red-400" },
          { label: "Difícil", count: counts.hard, color: "text-orange-400" },
          { label: "Bien", count: counts.good, color: "text-emerald-400" },
          { label: "Fácil", count: counts.easy, color: "text-sky-400" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl p-2.5 text-center">
            <p className={cn("text-xl font-bold", s.color)}>{s.count}</p>
            <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3 w-full">
        <Button variant="outline" className="flex-1 gap-2" onClick={onRepeat}>
          <RotateCcw className="w-4 h-4" />
          Repetir difíciles
        </Button>
        <Button asChild className="flex-1 gap-2">
          <Link href="/notes">Volver</Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesReviewPage() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deck");

  const { dueCards, loading, refetch, reviewCard } = useDueCards(deckId, 50);

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<{ cardId: string; quality: ReviewQuality }[]>([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && dueCards.length > 0 && queue.length === 0) {
      setQueue([...dueCards]);
    }
  }, [loading, dueCards, queue.length]);

  // Space reveals content
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !revealed && !done) {
        e.preventDefault();
        setRevealed(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [revealed, done]);

  const handleQuality = useCallback(
    async (quality: ReviewQuality) => {
      if (submitting) return;
      const note = queue[index];
      if (!note) return;

      setSubmitting(true);
      await reviewCard(note.id, quality);
      setSubmitting(false);

      const newResults = [...results, { cardId: note.id, quality }];
      setResults(newResults);

      if (index + 1 >= queue.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setRevealed(false);
      }
    },
    [index, queue, results, reviewCard, submitting]
  );

  const handleRepeat = () => {
    const failed = results
      .filter((r) => r.quality <= 2)
      .map((r) => queue.find((c) => c.id === r.cardId))
      .filter(Boolean) as Flashcard[];

    setQueue(failed.length > 0 ? failed : [...dueCards]);
    setIndex(0);
    setRevealed(false);
    setResults([]);
    setDone(false);
  };

  const note = queue[index];
  const progress = queue.length > 0 ? index / queue.length : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Nav + progress */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/notes">
            <ArrowLeft className="w-4 h-4" />
            Cuadernos
          </Link>
        </Button>
        {!done && queue.length > 0 && (
          <>
            <div className="flex-1 h-2 bg-muted/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${progress * 100}%` }}
                transition={{ ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">
              {index}/{queue.length}
            </span>
          </>
        )}
      </div>

      {/* Loading */}
      {loading && queue.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando notas...</p>
        </div>
      )}

      {/* No notes due */}
      {!loading && dueCards.length === 0 && queue.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-lg">¡Todo al día!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No tienes notas pendientes. Vuelve mañana.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/notes">Ver cuadernos</Link>
          </Button>
        </motion.div>
      )}

      {/* Done */}
      {done && <Summary results={results} onRepeat={handleRepeat} />}

      {/* Active review */}
      {!done && note && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.18 }}
            >
              <NoteCard note={note} revealed={revealed} onReveal={() => setRevealed(true)} />
            </motion.div>
          </AnimatePresence>

          {revealed && !submitting && <QualityBar onSelect={handleQuality} />}

          {revealed && submitting && (
            <div className="flex justify-center py-3">
              <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

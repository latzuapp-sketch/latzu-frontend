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
  Brain, CheckCircle2, RotateCcw, ArrowLeft, Keyboard,
  ChevronRight, BarChart3, Flame, Zap,
} from "lucide-react";
import Link from "next/link";

// ─── CSS for 3D flip ─────────────────────────────────────────────────────────

const HIDDEN: React.CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

// ─── Card Flip ────────────────────────────────────────────────────────────────

function ReviewCard({
  card,
  flipped,
  onFlip,
}: {
  card: Flashcard;
  flipped: boolean;
  onFlip: () => void;
}) {
  return (
    <div
      className="relative w-full cursor-pointer select-none"
      style={{ perspective: "1400px", minHeight: "260px" }}
      onClick={onFlip}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-8 text-center"
          style={HIDDEN}
        >
          <Brain className="w-8 h-8 text-primary/40 mb-4 shrink-0" />
          <p className="text-lg sm:text-xl font-semibold leading-snug max-w-lg">{card.front}</p>
          <p className="text-xs text-muted-foreground mt-5 flex items-center gap-1.5">
            <Keyboard className="w-3.5 h-3.5" />
            Toca o presiona Espacio para revelar
          </p>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/10 to-card p-8 text-center"
          style={{ ...HIDDEN, transform: "rotateY(180deg)" }}
        >
          <p className="text-xs font-medium text-primary uppercase tracking-wider mb-4">Respuesta</p>
          <p className="text-base sm:text-lg leading-relaxed max-w-lg">{card.back}</p>
          {card.reps > 0 && (
            <p className="text-xs text-muted-foreground/50 mt-5">
              Repaso #{card.reps + 1} · intervalo actual: {card.interval}d
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Quality buttons ─────────────────────────────────────────────────────────

const QUALITIES: ReviewQuality[] = [1, 2, 3, 4];

function QualityButtons({
  onSelect,
}: {
  onSelect: (q: ReviewQuality) => void;
}) {
  // Keyboard shortcuts: 1-4
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-4 gap-2 w-full"
    >
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
    </motion.div>
  );
}

// ─── Session summary ─────────────────────────────────────────────────────────

function SessionSummary({
  total,
  results,
  onRepeat,
}: {
  total: number;
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
          {score >= 90 ? "¡Excelente!" : score >= 70 ? "¡Buen trabajo!" : "Sigue practicando"}
        </p>
        <p className="text-muted-foreground mt-1">
          {results.length} tarjetas · {score}% dominio
        </p>
      </div>

      {/* Breakdown */}
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
          Repetir errores
        </Button>
        <Button asChild className="flex-1 gap-2">
          <Link href="/flashcards">
            <ChevronRight className="w-4 h-4" />
            Volver
          </Link>
        </Button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deck");

  const { dueCards, loading, refetch, reviewCard } = useDueCards(deckId, 50);

  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<{ cardId: string; quality: ReviewQuality }[]>([]);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialise queue when cards load
  useEffect(() => {
    if (!loading && dueCards.length > 0 && queue.length === 0) {
      setQueue([...dueCards]);
    }
  }, [loading, dueCards, queue.length]);

  // Spacebar flips card
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Space" && !flipped && !done) {
        e.preventDefault();
        setFlipped(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [flipped, done]);

  const handleQuality = useCallback(
    async (quality: ReviewQuality) => {
      if (submitting) return;
      const card = queue[index];
      if (!card) return;

      setSubmitting(true);
      await reviewCard(card.id, quality);
      setSubmitting(false);

      const newResults = [...results, { cardId: card.id, quality }];
      setResults(newResults);

      if (index + 1 >= queue.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
    },
    [index, queue, results, reviewCard, submitting]
  );

  const handleRepeat = () => {
    const failed = results
      .filter((r) => r.quality <= 2)
      .map((r) => queue.find((c) => c.id === r.cardId))
      .filter(Boolean) as Flashcard[];

    if (failed.length === 0) {
      refetch();
      setQueue([...dueCards]);
    } else {
      setQueue(failed);
    }
    setIndex(0);
    setFlipped(false);
    setResults([]);
    setDone(false);
  };

  const card = queue[index];
  const progress = queue.length > 0 ? index / queue.length : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Back link + progress */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/flashcards">
            <ArrowLeft className="w-4 h-4" />
            Mazos
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
          <p className="text-sm text-muted-foreground">Cargando tarjetas...</p>
        </div>
      )}

      {/* No cards due */}
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
              No tienes tarjetas pendientes. Vuelve mañana.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/flashcards">Ver mis mazos</Link>
          </Button>
        </motion.div>
      )}

      {/* Done / summary */}
      {done && (
        <SessionSummary
          total={queue.length}
          results={results}
          onRepeat={handleRepeat}
        />
      )}

      {/* Active review */}
      {!done && card && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Card flip */}
          <AnimatePresence mode="wait">
            <motion.div
              key={card.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.18 }}
            >
              <ReviewCard
                card={card}
                flipped={flipped}
                onFlip={() => setFlipped((f) => !f)}
              />
            </motion.div>
          </AnimatePresence>

          {/* Quality buttons (only shown after flip) */}
          <AnimatePresence>
            {flipped && !submitting && (
              <QualityButtons onSelect={handleQuality} />
            )}
            {flipped && submitting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-3"
              >
                <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>

          {!flipped && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-muted-foreground"
            >
              Presiona <kbd className="px-1.5 py-0.5 rounded border border-border/50 font-mono text-[10px]">Espacio</kbd> o toca la tarjeta para revelar la respuesta
            </motion.p>
          )}

          {flipped && (
            <p className="text-center text-xs text-muted-foreground">
              Califica tu respuesta · teclas <kbd className="px-1 py-0.5 rounded border border-border/50 font-mono text-[10px]">1</kbd>–<kbd className="px-1 py-0.5 rounded border border-border/50 font-mono text-[10px]">4</kbd>
            </p>
          )}
        </motion.div>
      )}
    </div>
  );
}

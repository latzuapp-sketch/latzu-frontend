"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, RotateCcw, ThumbsUp, ThumbsDown, CheckCircle2, Maximize2, X } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardSessionProps {
  cards: Flashcard[];
  onComplete: () => void;
  onClose: () => void;
}

// ── Card Flip ─────────────────────────────────────────────────────────────────

const BACKFACE: React.CSSProperties = {
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
};

function FlipCard({ card, flipped, onFlip }: { card: Flashcard; flipped: boolean; onFlip: () => void }) {
  return (
    <div className="relative w-full h-56 cursor-pointer" style={{ perspective: "1200px" }} onClick={onFlip}>
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front — question */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-card border-border/60 p-6 text-center"
          style={BACKFACE}
        >
          <Brain className="w-8 h-8 text-amber-400 mb-3 opacity-60" />
          <p className="text-lg font-semibold leading-snug">{card.front}</p>
          <p className="text-xs text-muted-foreground mt-3">Toca para revelar</p>
        </div>

        {/* Back — answer */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border bg-amber-950 border-amber-500/40 p-6 text-center"
          style={{ ...BACKFACE, transform: "rotateY(180deg)" }}
        >
          <p className="text-base leading-relaxed text-amber-100">{card.back}</p>
        </div>
      </motion.div>
    </div>
  );
}

// ── Session body (reused in normal + fullscreen) ───────────────────────────────

function SessionBody({
  cards,
  onComplete,
}: {
  cards: Flashcard[];
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [results, setResults] = useState<Record<number, "know" | "review">>({});
  const [done, setDone] = useState(false);

  const card = cards[index];
  const total = cards.length;
  const known = Object.values(results).filter((v) => v === "know").length;

  const handleAnswer = (answer: "know" | "review") => {
    const next = { ...results, [index]: answer };
    setResults(next);
    if (index + 1 >= total) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
  };

  const restart = () => {
    setIndex(0);
    setFlipped(false);
    setResults({});
    setDone(false);
  };

  if (done) {
    const score = Math.round((known / total) * 100);
    return (
      <div className="flex flex-col items-center gap-6 py-4">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold">¡Sesión completada!</p>
          <p className="text-muted-foreground mt-1">
            {known}/{total} tarjetas dominadas ({score}%)
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={restart} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Repetir
          </Button>
          <Button size="sm" onClick={onComplete}>
            Marcar tarea como hecha
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{index + 1} / {total}</span>
        <div className="flex-1 mx-4 h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-amber-400 rounded-full"
            animate={{ width: `${(index / total) * 100}%` }}
            transition={{ ease: "easeOut" }}
          />
        </div>
        <span>{known} dominadas</span>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
        >
          <FlipCard card={card} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />
        </motion.div>
      </AnimatePresence>

      {/* Actions — only after flip */}
      <AnimatePresence>
        {flipped && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex gap-3"
          >
            <Button
              variant="outline"
              className="flex-1 gap-2 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-400"
              onClick={() => handleAnswer("review")}
            >
              <ThumbsDown className="w-4 h-4" />
              Repasar
            </Button>
            <Button
              className="flex-1 gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
              variant="outline"
              onClick={() => handleAnswer("know")}
            >
              <ThumbsUp className="w-4 h-4" />
              Lo sé
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!flipped && (
        <p className="text-center text-xs text-muted-foreground">
          Toca la tarjeta para ver la respuesta
        </p>
      )}
    </div>
  );
}

// ── Fullscreen modal ──────────────────────────────────────────────────────────

function FlashcardFullscreen({ cards, onComplete, onClose }: FlashcardSessionProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/95 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
        className="relative z-10 flex flex-col w-full h-full"
      >
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
          <p className="font-semibold text-sm">Flashcards</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          <div className="w-full max-w-xl">
            <SessionBody cards={cards} onComplete={onComplete} />
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground py-2 shrink-0">
          ESC para cerrar
        </p>
      </motion.div>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function FlashcardSession({ cards, onComplete, onClose }: FlashcardSessionProps) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <>
      <div className="relative">
        <SessionBody cards={cards} onComplete={onComplete} />
        <button
          onClick={() => setFullscreen(true)}
          title="Ver en pantalla completa"
          className="absolute top-0 right-0 w-7 h-7 rounded-lg bg-card/80 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-card transition-colors shadow-sm z-10"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {fullscreen && (
          <FlashcardFullscreen
            cards={cards}
            onComplete={() => { setFullscreen(false); onComplete(); }}
            onClose={() => setFullscreen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

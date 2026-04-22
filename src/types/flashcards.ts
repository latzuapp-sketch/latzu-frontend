export interface Deck {
  id: string;
  userId: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  cardCount: number;
  dueCount: number;
  newCount: number;
}

export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  easeFactor: number;
  reps: number;
  interval: number;
  dueDate: string;
  createdAt: string;
  lastReviewedAt: string | null;
  sourceNodeId: string | null;
}

export type ReviewQuality = 1 | 2 | 3 | 4;

export interface ReviewSession {
  cards: Flashcard[];
  results: { cardId: string; quality: ReviewQuality }[];
}

export const DECK_COLORS = [
  { value: "teal", label: "Verde azulado", cls: "bg-teal-500/20 border-teal-500/40 text-teal-400" },
  { value: "amber", label: "Ámbar", cls: "bg-amber-500/20 border-amber-500/40 text-amber-400" },
  { value: "violet", label: "Violeta", cls: "bg-violet-500/20 border-violet-500/40 text-violet-400" },
  { value: "rose", label: "Rosa", cls: "bg-rose-500/20 border-rose-500/40 text-rose-400" },
  { value: "sky", label: "Cielo", cls: "bg-sky-500/20 border-sky-500/40 text-sky-400" },
  { value: "emerald", label: "Esmeralda", cls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" },
] as const;

export function deckColorCls(color: string): string {
  return DECK_COLORS.find((c) => c.value === color)?.cls ??
    "bg-primary/20 border-primary/40 text-primary";
}

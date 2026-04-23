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
  // Note / Google Keep metadata
  color: string;
  pinned: boolean;
  archived: boolean;
  isChecklist: boolean;
  labels: string; // JSON string array
  updatedAt: string | null;
  deckName: string | null;
}

export type ReviewQuality = 1 | 2 | 3 | 4;

export interface ReviewSession {
  cards: Flashcard[];
  results: { cardId: string; quality: ReviewQuality }[];
}

export const NOTE_COLORS = [
  { value: "default", label: "Sin color",  bg: "",                        ring: "" },
  { value: "red",     label: "Tomate",     bg: "bg-rose-500/15",          ring: "ring-rose-500/40" },
  { value: "orange",  label: "Llama",      bg: "bg-orange-500/15",        ring: "ring-orange-500/40" },
  { value: "yellow",  label: "Plátano",    bg: "bg-yellow-500/15",        ring: "ring-yellow-500/40" },
  { value: "green",   label: "Salvia",     bg: "bg-emerald-500/15",       ring: "ring-emerald-500/40" },
  { value: "teal",    label: "Teal",       bg: "bg-teal-500/15",          ring: "ring-teal-500/40" },
  { value: "blue",    label: "Cielo",      bg: "bg-sky-500/15",           ring: "ring-sky-500/40" },
  { value: "purple",  label: "Uva",        bg: "bg-violet-500/15",        ring: "ring-violet-500/40" },
] as const;

export type NoteColor = typeof NOTE_COLORS[number]["value"];

export function noteColorBg(color: string): string {
  return NOTE_COLORS.find((c) => c.value === color)?.bg ?? "";
}

export const NOTE_COLOR_SWATCHES: Record<string, string> = {
  default: "bg-zinc-500",
  red:     "bg-rose-400",
  orange:  "bg-orange-400",
  yellow:  "bg-yellow-400",
  green:   "bg-emerald-400",
  teal:    "bg-teal-400",
  blue:    "bg-sky-400",
  purple:  "bg-violet-400",
};

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

"use client";

/**
 * /brain — Notion-like adaptive encyclopedia.
 *
 * 2-col layout:
 *   - Left:   BrainSidebar    — agent-driven tree (kinds + lifeAreas + topics)
 *   - Center: Either the adaptive grid OR the universal viewer for the
 *             selected item. Click an item → the viewer takes over the center
 *             pane and shows it natively (note editor / task editor / node
 *             detail / workspace preview). Back to the grid via "← Volver".
 *
 *   - Floating: BrainAgentPanel — slide-out helper (proposals, hot jumps, ask)
 */

import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Sparkles, X, Loader2, Brain, Filter,
  StickyNote, ListTodo, Layers, Loader, Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AdaptiveItemCard, detectVariant } from "@/components/brain/AdaptiveItemCard";
import { BrainNoteCard, BrainTaskCard, BrainPageCard, BrainPlanCard } from "@/components/brain/BrainItemCards";
import type { BrainSelection } from "@/components/brain/BrainSidebar";
import { BrainAgentPanel, BrainAgentTrigger } from "@/components/brain/BrainAgentPanel";
import { BrainCreateToolbar } from "@/components/brain/BrainCreateToolbar";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { GroupedConcepts } from "@/components/brain/GroupedConcepts";
import { MentorPanel } from "@/components/brain/MentorPanel";
import {
  AutoFilterChips,
  facetsFromNodes,
  facetsFromTasks,
  facetsFromPlans,
  facetsFromGoals,
  facetsFromFiles,
  facetsFromBooks,
  facetsFromAllContent,
  matchesChip,
  matchesChipTask,
  matchesChipPlan,
  matchesChipGoal,
  matchesChipFile,
  matchesChipBook,
  matchesChipContentKind,
  type ChipValue,
} from "@/components/brain/AutoFilterChips";
import { useKnowledgeNodes, useLibraryBooks } from "@/hooks/useLibrary";
import { BookCard } from "@/components/biblioteca/BookCard";
import type { LibraryBook, LibraryFile } from "@/types/library";
import { useUserModel, useAgentActions } from "@/hooks/useOrganizerAgent";
import { useAllNotes, useDecks } from "@/hooks/useFlashcards";
import { useTasks } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { useAllPlanHealth } from "@/hooks/usePlanHealth";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useUserGoals } from "@/hooks/useGoals";
import { useLibraryFiles } from "@/hooks/useLibraryFiles";
import {
  BrainGoalCard, BrainFileCard, BrainDeckCard, BrainQuizCard,
} from "@/components/brain/BrainItemCards";
import type { Deck } from "@/types/flashcards";
import type { GoalNode } from "@/graphql/types";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { QUICK_CAPTURE } from "@/graphql/ai/operations";
import type { KnowledgeNode } from "@/graphql/types";
import type { Flashcard } from "@/types/flashcards";
import type { PlanningTask, TaskStatus, ActionPlan } from "@/types/planning";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function viewerItemId(item: ViewerItem): string {
  switch (item.kind) {
    case "node":      return item.node.id;
    case "note":      return item.note.id;
    case "task":      return item.task.id;
    case "book":      return item.book.id;
    case "goal":      return item.goal.id;
    case "file":      return item.file.id;
    case "deck":      return item.deck.id;
    case "quiz":      return item.task.id;
    case "workspace": return item.workspace.id;
  }
}

interface LifeAreaParsed {
  name: string;
  node_ids?: string[];
  description?: string;
}

/**
 * A KnowledgeNode is treated as a book ONLY when its type is 'book'.
 * Used to EXCLUDE the curated book Neo4j entries from the Conceptos view —
 * the actual "Libros" view in /brain comes from useLibraryBooks() (same
 * source as /library → Lecturas), not from KnowledgeNodes.
 */
function isBookNode(n: KnowledgeNode): boolean {
  return n.type === "book";
}

/** Library-book filter for the brain. Books appear in Books and Lecturas views. */
function filterBooks(books: LibraryBook[], s: BrainSelection, search: string): LibraryBook[] {
  if (s.kind !== "books" && s.kind !== "readings") return [];
  const q = search.trim().toLowerCase();
  if (!q) return books;
  return books.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.tags ?? []).some((t) => t.toLowerCase().includes(q)),
  );
}

/** Goals visible in: all, goals. */
function filterGoals(goals: GoalNode[], s: BrainSelection, search: string): GoalNode[] {
  const showHere = s.kind === "all" || s.kind === "goals" || s.kind === "recent";
  if (!showHere) return [];
  const q = search.trim().toLowerCase();
  let out = goals;
  if (s.kind === "all") {
    out = out.filter((g) => g.status === "active" || g.status === "clear");
  }
  if (q) {
    out = out.filter(
      (g) => g.title.toLowerCase().includes(q) || g.rawStatement.toLowerCase().includes(q),
    );
  }
  return s.kind === "recent" ? out.slice(0, 5) : out;
}

/** Files visible in: all, files. */
function filterFiles(files: LibraryFile[], s: BrainSelection, search: string): LibraryFile[] {
  const showHere = s.kind === "all" || s.kind === "files" || s.kind === "recent";
  if (!showHere) return [];
  const q = search.trim().toLowerCase();
  if (!q) return s.kind === "recent" ? files.slice(0, 5) : files;
  return files.filter(
    (f) => f.name.toLowerCase().includes(q) || f.extractedText.toLowerCase().includes(q),
  );
}

/** Decks visible in: flashcards. */
function filterDecks(decks: Deck[], s: BrainSelection, search: string): Deck[] {
  if (s.kind !== "flashcards") return [];
  const q = search.trim().toLowerCase();
  if (!q) return decks;
  return decks.filter(
    (d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q),
  );
}

/** Quiz tasks visible in: quizzes. */
function filterQuizTasks(tasks: PlanningTask[], s: BrainSelection, search: string): PlanningTask[] {
  if (s.kind !== "quizzes") return [];
  const q = search.trim().toLowerCase();
  let out = tasks.filter((t) => t.category === "quiz" || t.contentType === "quiz");
  if (q) {
    out = out.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  return out;
}

function selectionTitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":        return "Mi conocimiento";
    case "recent":     return "Recientes";
    case "mentor":     return "Tu mentor";
    case "knowledge":  return "Conceptos";
    case "books":      return "Libros";
    case "plans":      return "Planes";
    case "goals":      return "Metas";
    case "notes":      return "Notas";
    case "tasks":      return "Tareas";
    case "files":      return "Archivos";
    case "pages":      return "Spaces";
    case "flashcards": return "Flashcards";
    case "quizzes":    return "Quizzes";
    case "readings":   return "Lecturas";
    case "topic":      return s.topic;
    case "lifeArea":   return s.area;
    case "workspace":  return s.title;
    case "type":       return `Tipo: ${s.nodeType}`;
  }
}

function selectionSubtitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":        return "Todo tu mundo: planes, metas, tareas, notas, archivos y spaces.";
    case "recent":     return "Lo último que creaste o editaste.";
    case "mentor":     return "Foco actual, metas activas, lo que el mentor te quiere decir.";
    case "knowledge":  return "Conceptos puros: ideas, nodos extraídos. (Lecturas aparte en Estudio.)";
    case "books":      return "Libros disponibles — curados + los que vos sumaste.";
    case "plans":      return "Planes que estás corriendo con la IA. Adaptan su carga según tu progreso.";
    case "goals":      return "Tus metas — la IA detecta cuáles avanzás y cuáles se enfrían.";
    case "notes":      return "Tus notas, tipo Google-Keep — siempre tuyas.";
    case "tasks":      return "Cosas por hacer, ordenadas por prioridad ABCDE.";
    case "files":      return "Archivos que subiste — PDFs, docs, transcripts.";
    case "pages":      return "Spaces estilo Notion para organizar páginas.";
    case "flashcards": return "Tus mazos de tarjetas SRS — abrir para ver tarjetas y repasar.";
    case "quizzes":    return "Tareas con quiz generado — listas para repasar.";
    case "readings":   return "Lecturas para estudio — libros + material que estás absorbiendo.";
    case "topic":      return "Tema agrupado por tu agente.";
    case "lifeArea":   return "Área de vida detectada por tu agente.";
    case "workspace":  return "Tu space personalizado.";
    case "type":       return "Filtrado por tipo de contenido.";
  }
}

// ─── Apply selection filter (knowledge nodes only) ────────────────────────────

function filterNodes(
  nodes: KnowledgeNode[],
  s: BrainSelection,
  lifeAreas: LifeAreaParsed[],
  search: string
): KnowledgeNode[] {
  let out = nodes;
  const q = search.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.content?.toLowerCase().includes(q) ?? false)
    );
  }
  switch (s.kind) {
    // "Todo" no longer includes knowledge nodes — concepts/books only show
    // under their own dedicated tree rows.
    case "all":        return [];
    case "mentor":     return [];                                   // MentorPanel renders separately
    case "recent":     return [];
    case "knowledge":  return out.filter((n) => !isBookNode(n));   // exclude type='book' nodes
    case "books":      return [];                                   // books come from useLibraryBooks
    case "plans":      return [];
    case "goals":      return [];
    case "notes":      return [];
    case "tasks":      return [];
    case "files":      return [];
    case "pages":      return [];
    case "flashcards": return [];
    case "quizzes":    return [];
    case "readings":   return [];
    case "topic": {
      const topic = s.topic.toLowerCase();
      return out.filter((n) => n.name.toLowerCase().includes(topic) || (n.content?.toLowerCase().includes(topic) ?? false));
    }
    case "lifeArea": {
      const area = lifeAreas.find((a) => a.name === s.area);
      const ids = new Set(area?.node_ids ?? []);
      if (ids.size === 0) {
        const lower = s.area.toLowerCase();
        return out.filter((n) => n.name.toLowerCase().includes(lower));
      }
      return out.filter((n) => ids.has(n.id));
    }
    case "workspace": {
      const lower = s.title.toLowerCase();
      return out.filter((n) => n.sourceRef?.toLowerCase().includes(lower) || n.name.toLowerCase().includes(lower));
    }
    case "type":
      return out.filter((n) => n.type === s.nodeType);
  }
}

function filterNotes(notes: Flashcard[], s: BrainSelection, search: string): Flashcard[] {
  const showHere = s.kind === "all" || s.kind === "notes" || s.kind === "recent";
  if (!showHere) return [];
  const q = search.trim().toLowerCase();
  let out = notes;
  if (q) {
    out = out.filter((n) => n.front.toLowerCase().includes(q) || n.back.toLowerCase().includes(q));
  }
  return s.kind === "recent" ? out.slice(0, 10) : out;
}

function filterTasks(tasks: PlanningTask[], s: BrainSelection, search: string): PlanningTask[] {
  const showHere = s.kind === "all" || s.kind === "tasks" || s.kind === "recent";
  if (!showHere) return [];
  const q = search.trim().toLowerCase();
  let out = tasks;
  if (q) {
    out = out.filter((t) => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }
  if (s.kind === "tasks") {
    // Active first, then done
    out = [...out].sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return 0;
    });
  }
  return s.kind === "recent" ? out.slice(0, 10) : out;
}

function filterPlans(
  plans: ActionPlan[],
  s: BrainSelection,
  search: string,
): ActionPlan[] {
  const showHere = s.kind === "all" || s.kind === "plans" || s.kind === "recent";
  if (!showHere) return [];
  const q = search.trim().toLowerCase();
  let out = plans.filter((p) => p.status === "active");  // only active plans by default
  if (s.kind === "plans") {
    // In the dedicated view, also show paused/completed for transparency
    out = plans;
  }
  if (q) {
    out = out.filter(
      (p) => p.title.toLowerCase().includes(q) || p.goal.toLowerCase().includes(q),
    );
  }
  return s.kind === "recent" ? out.slice(0, 5) : out;
}

function sortNodesForView(nodes: KnowledgeNode[]): KnowledgeNode[] {
  // Synthesis pinned to top
  return [...nodes].sort((a, b) => {
    const aSyn = detectVariant(a) === "synthesis" ? 0 : 1;
    const bSyn = detectVariant(b) === "synthesis" ? 0 : 1;
    return aSyn - bSyn;
  });
}

// ─── Quick create composer ────────────────────────────────────────────────────

type QuickKind = "note" | "task";

function QuickCreate({ kind, onClose, onDone }: { kind: QuickKind; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { createTask } = useTasks();
  const [capture] = useMutation(QUICK_CAPTURE, { client: aiClient });

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      if (kind === "note") {
        // Use QUICK_CAPTURE to AI-classify and persist as note
        await capture({ variables: { text: t } });
      } else {
        await createTask({ title: t, status: "todo" });
      }
      setText("");
      onDone();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") onClose();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const Icon = kind === "note" ? StickyNote : ListTodo;
  const label = kind === "note" ? "Nueva nota" : "Nueva tarea";
  const placeholder = kind === "note"
    ? "Escribí una idea, recordatorio, lo que sea…"
    : "¿Qué tenés que hacer?";
  const accent = kind === "note" ? "text-yellow-300" : "text-primary";
  const accentBg = kind === "note" ? "bg-yellow-500/10 border-yellow-500/30" : "bg-primary/10 border-primary/30";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn("rounded-xl border p-3 mb-4 space-y-2", accentBg)}
    >
      <div className="flex items-center gap-2">
        <Icon className={cn("w-3.5 h-3.5", accent)} />
        <span className={cn("text-xs font-semibold", accent)}>{label}</span>
        <span className="text-[10px] text-muted-foreground/50 ml-auto">⌘Enter para crear · Esc para cerrar</span>
      </div>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40"
      />
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={onClose}
          className="text-xs px-3 py-1 rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className={cn(
            "text-xs px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5",
            text.trim() && !busy
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
          )}
        >
          {busy ? <Loader className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          Crear
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();
  const { userModel } = useUserModel();
  const searchParams = useSearchParams();

  // Hydrate selection from URL ?kind=... (driven by the outer NotionSidebar)
  const selectionFromParams = useMemo<BrainSelection>(() => {
    const kind = searchParams.get("kind") || "all";
    switch (kind) {
      case "all":
      case "recent":
      case "mentor":
      case "plans":
      case "goals":
      case "tasks":
      case "notes":
      case "files":
      case "pages":
      case "flashcards":
      case "quizzes":
      case "readings":
      case "knowledge":
      case "books":
        return { kind } as BrainSelection;
      case "topic": {
        const topic = searchParams.get("topic");
        return topic ? { kind: "topic", topic } : { kind: "all" };
      }
      case "lifeArea": {
        const area = searchParams.get("area");
        return area ? { kind: "lifeArea", area } : { kind: "all" };
      }
      case "workspace": {
        const id = searchParams.get("id");
        const title = searchParams.get("title") ?? "Space";
        return id ? { kind: "workspace", id, title } : { kind: "all" };
      }
      case "type": {
        const nodeType = searchParams.get("t") ?? searchParams.get("nodeType");
        return nodeType ? { kind: "type", nodeType } : { kind: "all" };
      }
      default:
        return { kind: "all" };
    }
  }, [searchParams]);

  const [selection, setSelection] = useState<BrainSelection>(selectionFromParams);
  useEffect(() => { setSelection(selectionFromParams); }, [selectionFromParams]);
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [quickKind, setQuickKind] = useState<QuickKind | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);
  const [activeChip, setActiveChip] = useState<ChipValue | null>(null);

  // Reset chip selection when the user jumps to another section/area.
  useEffect(() => {
    setActiveChip(null);
  }, [selection]);

  const { nodes, total, loading } = useKnowledgeNodes({ limit: 300 });
  const { notes, refetch: refetchNotes } = useAllNotes();
  const { tasks, setStatus, refetch: refetchTasks } = useTasks();
  const { plans } = usePlans();
  const { healthByPlanId } = useAllPlanHealth();
  const { workspaces } = useWorkspaces();
  const { books } = useLibraryBooks();   // same source as /library → Lecturas
  const { goals } = useUserGoals();
  const { files } = useLibraryFiles();
  const { decks } = useDecks();

  const bookCount = books.length;
  const activePlanCount = useMemo(() => plans.filter((p) => p.status === "active").length, [plans]);
  const activeGoalCount = useMemo(
    () => goals.filter((g) => g.status === "active" || g.status === "clear").length,
    [goals],
  );
  const quizTaskCount = useMemo(
    () => tasks.filter((t) => t.category === "quiz" || t.contentType === "quiz").length,
    [tasks],
  );
  const { actions: pendingProposals } = useAgentActions({ status: "pending", limit: 20 });
  const visibleProposalsCount = pendingProposals.filter(
    (a) => a.visibility !== "silent" && a.type !== "clarification_question"
  ).length;

  const lifeAreas = useMemo(
    () => safeJsonArray<LifeAreaParsed>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );

  const filteredNodes = useMemo(
    () => sortNodesForView(filterNodes(nodes, selection, lifeAreas, deferredSearch)),
    [nodes, selection, lifeAreas, deferredSearch]
  );
  const filteredNotes = useMemo(
    () => filterNotes(notes, selection, deferredSearch),
    [notes, selection, deferredSearch]
  );
  const filteredTasks = useMemo(
    () => filterTasks(tasks, selection, deferredSearch),
    [tasks, selection, deferredSearch]
  );
  const filteredPlans = useMemo(
    () => filterPlans(plans, selection, deferredSearch),
    [plans, selection, deferredSearch]
  );
  const filteredBooks = useMemo(
    () => filterBooks(books, selection, deferredSearch),
    [books, selection, deferredSearch]
  );
  const filteredGoals = useMemo(
    () => filterGoals(goals, selection, deferredSearch),
    [goals, selection, deferredSearch],
  );
  const filteredFiles = useMemo(
    () => filterFiles(files, selection, deferredSearch),
    [files, selection, deferredSearch],
  );
  const filteredDecks = useMemo(
    () => filterDecks(decks, selection, deferredSearch),
    [decks, selection, deferredSearch],
  );
  const filteredQuizTasks = useMemo(
    () => filterQuizTasks(tasks, selection, deferredSearch),
    [tasks, selection, deferredSearch],
  );
  const showWorkspaces = selection.kind === "all" || selection.kind === "pages";

  // ── Chip facets: computed from the right source per tab (pre-chip, so
  //    available options don't disappear when one is selected).
  const chipFacets = useMemo(() => {
    switch (selection.kind) {
      case "knowledge": return facetsFromNodes(filteredNodes);
      case "tasks":     return facetsFromTasks(filteredTasks);
      case "plans":     return facetsFromPlans(filteredPlans);
      case "goals":     return facetsFromGoals(filteredGoals);
      case "files":     return facetsFromFiles(filteredFiles);
      case "books":
      case "readings":  return facetsFromBooks(filteredBooks);
      case "all":       return facetsFromAllContent({
        goals:      filteredGoals.length,
        plans:      filteredPlans.length,
        tasks:      filteredTasks.length,
        notes:      filteredNotes.length,
        files:      filteredFiles.length,
        books:      filteredBooks.length,
        workspaces: showWorkspaces ? workspaces.length : 0,
      });
      default: return [];
    }
  }, [
    selection.kind,
    filteredNodes, filteredTasks, filteredPlans, filteredGoals,
    filteredFiles, filteredBooks, filteredNotes, workspaces.length, showWorkspaces,
  ]);

  // ── Post-chip display arrays — each type filtered by the active chip.
  const displayNodes = useMemo(
    () => filteredNodes.filter((n) => matchesChip(n, activeChip)),
    [filteredNodes, activeChip],
  );
  const displayTasks = useMemo(
    () => filteredTasks.filter((t) =>
      matchesChipContentKind("tasks", activeChip) && matchesChipTask(t, activeChip)
    ),
    [filteredTasks, activeChip],
  );
  const displayPlans = useMemo(
    () => filteredPlans.filter((p) =>
      matchesChipContentKind("plans", activeChip) && matchesChipPlan(p, activeChip)
    ),
    [filteredPlans, activeChip],
  );
  const displayGoals = useMemo(
    () => filteredGoals.filter((g) =>
      matchesChipContentKind("goals", activeChip) && matchesChipGoal(g, activeChip)
    ),
    [filteredGoals, activeChip],
  );
  const displayFiles = useMemo(
    () => filteredFiles.filter((f) =>
      matchesChipContentKind("files", activeChip) && matchesChipFile(f, activeChip)
    ),
    [filteredFiles, activeChip],
  );
  const displayBooks = useMemo(
    () => filteredBooks.filter((b) =>
      matchesChipContentKind("books", activeChip) && matchesChipBook(b, activeChip)
    ),
    [filteredBooks, activeChip],
  );
  const displayNotes = useMemo(
    () => filteredNotes.filter(() => matchesChipContentKind("notes", activeChip)),
    [filteredNotes, activeChip],
  );
  const displayDecks = useMemo(
    () => filteredDecks,
    [filteredDecks],
  );
  const displayQuizTasks = useMemo(
    () => filteredQuizTasks,
    [filteredQuizTasks],
  );
  const displayWorkspaces = showWorkspaces && matchesChipContentKind("workspaces", activeChip)
    ? workspaces : [];

  const chipsHaveAny = chipFacets.some((f) => f.values.length > 0);

  const totalShown =
    displayNodes.length + displayNotes.length + displayTasks.length +
    displayPlans.length + displayBooks.length +
    displayGoals.length + displayFiles.length +
    displayDecks.length + displayQuizTasks.length +
    displayWorkspaces.length;

  const synthesisCount = useMemo(
    () => displayNodes.filter((n) => detectVariant(n) === "synthesis").length,
    [displayNodes]
  );

  const onJumpTopic = (topic: string) => {
    setSelection({ kind: "topic", topic });
    setViewing(null);
  };
  const onJumpArea = (area: string) => {
    setSelection({ kind: "lifeArea", area });
    setViewing(null);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-3 md:-m-6 overflow-hidden bg-background relative">
      {/* Center: viewer when an item is open, otherwise the grid */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewing && (
            <UniversalViewer
              key={`view-${viewing.kind}-${viewerItemId(viewing)}`}
              item={viewing}
              onClose={() => setViewing(null)}
            />
          )}
        </AnimatePresence>

        {viewing ? null : (
        <>
        <header className="px-6 py-4 border-b border-border/30 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-heading font-bold capitalize truncate">{selectionTitle(selection)}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{selectionSubtitle(selection)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {synthesisCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  <Sparkles className="w-3 h-3" />
                  {synthesisCount} síntesis
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {totalShown} {totalShown === 1 ? "item" : "items"}
              </span>

              {/* Agent panel trigger */}
              <BrainAgentTrigger
                onClick={() => setAgentPanelOpen((v) => !v)}
                pendingCount={visibleProposalsCount}
                active={agentPanelOpen}
              />
            </div>
          </div>

          {/* Prominent per-type create toolbar */}
          <BrainCreateToolbar
            onCreated={(kind) => {
              if (kind === "note") refetchNotes();
              else if (kind === "task") refetchTasks();
            }}
          />

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en esta vista…"
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Auto-classifier chip row (YouTube-style) — shows when the section
              has classified knowledge nodes. Filters the cards inline. */}
          {chipsHaveAny && (
            <AutoFilterChips
              available={chipFacets}
              active={activeChip}
              onChange={setActiveChip}
            />
          )}
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence>
            {quickKind && (
              <QuickCreate
                kind={quickKind}
                onClose={() => setQuickKind(null)}
                onDone={() => {
                  if (quickKind === "note") refetchNotes();
                  else refetchTasks();
                }}
              />
            )}
          </AnimatePresence>

          {loading && totalShown === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && totalShown === 0 && selection.kind !== "mentor" && (
            <EmptyState selection={selection} hasAny={nodes.length + notes.length + tasks.length > 0} hasSearch={!!search || !!activeChip} onCreateNote={() => setQuickKind("note")} onCreateTask={() => setQuickKind("task")} />
          )}

          {/* Mentor unified panel — focus + goals + signals + history. */}
          {selection.kind === "mentor" && <MentorPanel />}

          {/* Conceptos view — grouped by autoCategory when present, falling back
              to life area. Chips filter the underlying node set. */}
          {selection.kind === "knowledge" && displayNodes.length > 0 && (
            <GroupedConcepts
              nodes={displayNodes}
              lifeAreas={lifeAreas}
              onPick={(node) => setViewing({ kind: "node", node })}
            />
          )}

          {totalShown > 0 && selection.kind !== "knowledge" && selection.kind !== "mentor" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {/* Goals first — the north star */}
                {displayGoals.map((goal) => (
                  <BrainGoalCard
                    key={`goal-${goal.id}`}
                    goal={goal}
                    onClick={() => setViewing({ kind: "goal", goal })}
                  />
                ))}
                {/* Active plans — what the user + agent are growing on */}
                {displayPlans.map((plan) => (
                  <BrainPlanCard
                    key={`plan-${plan.id}`}
                    plan={plan}
                    health={healthByPlanId[plan.id] ?? null}
                    onClick={() => router.push(`/plans/${plan.id}`)}
                  />
                ))}
                {/* Decks (Estudio → Flashcards) */}
                {displayDecks.map((deck) => (
                  <BrainDeckCard
                    key={`deck-${deck.id}`}
                    deck={deck}
                    onClick={() => setViewing({ kind: "deck", deck })}
                  />
                ))}
                {/* Quiz tasks (Estudio → Quizzes) */}
                {displayQuizTasks.map((task) => (
                  <BrainQuizCard
                    key={`quiz-${task.id}`}
                    task={task}
                    onClick={() => setViewing({ kind: "quiz", task })}
                  />
                ))}
                {/* Books from the library catalog */}
                {displayBooks.map((book, i) => (
                  <BookCard
                    key={`book-${book.id}`}
                    book={book}
                    index={i}
                    onClick={() => setViewing({ kind: "book", book })}
                  />
                ))}
                {/* Tasks (action items) */}
                {displayTasks.map((task) => (
                  <BrainTaskCard
                    key={`task-${task.id}`}
                    task={task}
                    onToggle={(id, next) => setStatus(id, next)}
                    onClick={() => setViewing({ kind: "task", task })}
                  />
                ))}
                {/* Notes */}
                {displayNotes.map((note) => (
                  <BrainNoteCard
                    key={`note-${note.id}`}
                    note={note}
                    onClick={() => setViewing({ kind: "note", note })}
                  />
                ))}
                {/* Files */}
                {displayFiles.map((file) => (
                  <BrainFileCard
                    key={`file-${file.id}`}
                    file={file}
                    onClick={() => setViewing({ kind: "file", file })}
                  />
                ))}
                {/* Knowledge nodes */}
                {displayNodes.map((node) => (
                  <AdaptiveItemCard
                    key={`node-${node.id}`}
                    node={node}
                    onClick={() => setViewing({ kind: "node", node })}
                  />
                ))}
                {/* Workspaces (when relevant) */}
                {displayWorkspaces.map((w) => (
                  <BrainPageCard
                    key={`ws-${w.id}`}
                    workspace={w}
                    onClick={() => setViewing({ kind: "workspace", workspace: w })}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {displayNodes.length > 0 && total > nodes.length && (
            <p className="text-[10px] text-muted-foreground text-center mt-6">
              Mostrando {nodes.length} de {total} ideas. Tirá más con <kbd className="px-1 py-0.5 rounded border border-border/40 bg-muted/40 font-mono">⌘U</kbd>.
            </p>
          )}
        </div>
        </>
        )}
      </div>

      {/* Agent slide-out panel */}
      <BrainAgentPanel
        open={agentPanelOpen}
        onClose={() => setAgentPanelOpen(false)}
        selection={selection}
        onJumpTopic={onJumpTopic}
        onJumpArea={onJumpArea}
      />
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  selection, hasAny, hasSearch, onCreateNote, onCreateTask,
}: {
  selection: BrainSelection;
  hasAny: boolean;
  hasSearch: boolean;
  onCreateNote: () => void;
  onCreateTask: () => void;
}) {
  if (hasSearch) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center space-y-2">
        <Filter className="w-8 h-8 mx-auto text-muted-foreground/30" />
        <p className="text-sm font-medium">Nada coincide con esa búsqueda.</p>
      </div>
    );
  }

  if (!hasAny) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 p-12 text-center space-y-3 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <p className="font-heading font-bold">Tu enciclopedia está vacía</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tirá tu primera nota, link, PDF, video — o creá una tarea o una página.
        </p>
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={onCreateNote}
            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors flex items-center gap-1.5"
          >
            <StickyNote className="w-3 h-3" /> Crear nota
          </button>
          <button
            onClick={onCreateTask}
            className="text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            <ListTodo className="w-3 h-3" /> Crear tarea
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground/70 pt-1">
          También: <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 font-mono">⌘U</kbd> para tirar archivos / links / texto.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center space-y-2">
      <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/30" />
      <p className="text-sm font-medium">
        {selection.kind === "lifeArea" || selection.kind === "topic"
          ? "Tu agente todavía no agrupó nada acá."
          : "Sin items en esta vista."}
      </p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        A medida que agregues más contenido, el agente va a empezar a llenar este espacio.
      </p>
    </div>
  );
}

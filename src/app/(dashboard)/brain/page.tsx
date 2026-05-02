"use client";

/**
 * /brain — Notion-like adaptive encyclopedia.
 *
 * 3-col layout:
 *   - Left:   BrainSidebar    — agent-driven tree (kinds + lifeAreas + topics)
 *   - Center: Adaptive grid   — renders nodes / notes / tasks / pages with
 *                                 type-aware visuals; "+" creates inline.
 *   - Right:  Detail panel    — full content of selected item
 *
 *   - Floating: BrainAgentPanel — slide-out helper (proposals, hot jumps, ask)
 */

import { useMemo, useState, useDeferredValue, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, X, Loader2, Brain, Plus, Filter,
  StickyNote, ListTodo, Layers, Loader, Send,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { AdaptiveItemCard, detectVariant } from "@/components/brain/AdaptiveItemCard";
import { BrainNoteCard, BrainTaskCard, BrainPageCard } from "@/components/brain/BrainItemCards";
import { BrainSidebar, type BrainSelection } from "@/components/brain/BrainSidebar";
import { BrainAgentPanel, BrainAgentTrigger } from "@/components/brain/BrainAgentPanel";
import { useKnowledgeNodes } from "@/hooks/useLibrary";
import { useUserModel, useAgentActions } from "@/hooks/useOrganizerAgent";
import { useAllNotes } from "@/hooks/useFlashcards";
import { useTasks } from "@/hooks/usePlanning";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { QUICK_CAPTURE } from "@/graphql/ai/operations";
import type { KnowledgeNode } from "@/graphql/types";
import type { Flashcard } from "@/types/flashcards";
import type { PlanningTask, TaskStatus } from "@/types/planning";
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

interface LifeAreaParsed {
  name: string;
  node_ids?: string[];
  description?: string;
}

function selectionTitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":       return "Todo lo que sabés";
    case "recent":    return "Recientes";
    case "knowledge": return "Conocimiento";
    case "notes":     return "Notas";
    case "tasks":     return "Tareas";
    case "pages":     return "Spaces";
    case "topic":     return s.topic;
    case "lifeArea":  return s.area;
    case "workspace": return s.title;
    case "type":      return `Tipo: ${s.nodeType}`;
  }
}

function selectionSubtitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":       return "Tu enciclopedia completa, ordenada por tu agente.";
    case "recent":    return "Lo último que tiraste a tu enciclopedia.";
    case "knowledge": return "Conocimiento puro: ideas, libros, links, archivos.";
    case "notes":     return "Tus notas, tipo Google-Keep — siempre tuyas.";
    case "tasks":     return "Cosas por hacer, ordenadas por prioridad ABCDE.";
    case "pages":     return "Spaces estilo Notion para organizar pages.";
    case "topic":     return "Tema marcado como caliente por tu agente.";
    case "lifeArea":  return "Área de vida detectada por tu agente.";
    case "workspace": return "Tu space personalizado.";
    case "type":      return "Filtrado por tipo de contenido.";
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
    case "all":       return out;
    case "recent":    return out.slice(0, 30);
    case "knowledge": return out;
    case "notes":     return [];
    case "tasks":     return [];
    case "pages":     return [];
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
  const [selection, setSelection] = useState<BrainSelection>({ kind: "all" });
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [quickKind, setQuickKind] = useState<QuickKind | null>(null);
  const [agentPanelOpen, setAgentPanelOpen] = useState(false);

  const { nodes, total, loading } = useKnowledgeNodes({ limit: 300 });
  const { notes, refetch: refetchNotes } = useAllNotes();
  const { tasks, setStatus, refetch: refetchTasks } = useTasks();
  const { workspaces } = useWorkspaces();
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
  const showWorkspaces = selection.kind === "all" || selection.kind === "pages";

  const totalShown =
    filteredNodes.length + filteredNotes.length + filteredTasks.length + (showWorkspaces ? workspaces.length : 0);

  const synthesisCount = useMemo(
    () => filteredNodes.filter((n) => detectVariant(n) === "synthesis").length,
    [filteredNodes]
  );

  const onJumpTopic = (topic: string) => {
    setSelection({ kind: "topic", topic });
    setSelectedNode(null);
  };
  const onJumpArea = (area: string) => {
    setSelection({ kind: "lifeArea", area });
    setSelectedNode(null);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-3 md:-m-6 overflow-hidden bg-background relative">
      {/* Left: Tree sidebar */}
      <BrainSidebar
        nodes={nodes}
        noteCount={notes.length}
        taskCount={tasks.length}
        selection={selection}
        onSelect={(s) => {
          setSelection(s);
          setSelectedNode(null);
        }}
      />

      {/* Center: Items */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
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

              {/* "+" Quick create menu */}
              <div className="flex items-center rounded-lg border border-border/40 bg-card/60 overflow-hidden">
                <button
                  onClick={() => setQuickKind(quickKind === "note" ? null : "note")}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-1.5 transition-colors",
                    quickKind === "note" ? "bg-yellow-500/15 text-yellow-300" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                  title="Nueva nota"
                >
                  <StickyNote className="w-3 h-3" /> Nota
                </button>
                <span className="w-px h-4 bg-border/50" />
                <button
                  onClick={() => setQuickKind(quickKind === "task" ? null : "task")}
                  className={cn(
                    "flex items-center gap-1 text-[10px] px-2 py-1.5 transition-colors",
                    quickKind === "task" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                  title="Nueva tarea"
                >
                  <ListTodo className="w-3 h-3" /> Tarea
                </button>
                <span className="w-px h-4 bg-border/50" />
                <button
                  onClick={() => router.push("/workspace")}
                  className="flex items-center gap-1 text-[10px] px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                  title="Crear space"
                >
                  <Layers className="w-3 h-3" /> Space
                </button>
              </div>

              {/* Agent panel trigger */}
              <BrainAgentTrigger
                onClick={() => setAgentPanelOpen((v) => !v)}
                pendingCount={visibleProposalsCount}
                active={agentPanelOpen}
              />
            </div>
          </div>

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

          {!loading && totalShown === 0 && (
            <EmptyState selection={selection} hasAny={nodes.length + notes.length + tasks.length > 0} hasSearch={!!search} onCreateNote={() => setQuickKind("note")} onCreateTask={() => setQuickKind("task")} />
          )}

          {totalShown > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {/* Tasks first (action items) */}
                {filteredTasks.map((task) => (
                  <BrainTaskCard
                    key={`task-${task.id}`}
                    task={task}
                    onToggle={(id, next) => setStatus(id, next)}
                    onClick={() => router.push("/planning")}
                  />
                ))}
                {/* Then notes */}
                {filteredNotes.map((note) => (
                  <BrainNoteCard
                    key={`note-${note.id}`}
                    note={note}
                    onClick={() => router.push(`/notes/${note.id}`)}
                  />
                ))}
                {/* Then knowledge nodes */}
                {filteredNodes.map((node) => (
                  <AdaptiveItemCard
                    key={`node-${node.id}`}
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onClick={() => setSelectedNode(node)}
                  />
                ))}
                {/* Then workspaces (when relevant) */}
                {showWorkspaces && workspaces.map((w) => (
                  <BrainPageCard
                    key={`ws-${w.id}`}
                    workspace={w}
                    onClick={() => router.push(`/workspace/${w.id}`)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredNodes.length > 0 && total > nodes.length && (
            <p className="text-[10px] text-muted-foreground text-center mt-6">
              Mostrando {nodes.length} de {total} ideas. Tirá más con <kbd className="px-1 py-0.5 rounded border border-border/40 bg-muted/40 font-mono">⌘U</kbd>.
            </p>
          )}
        </div>
      </div>

      {/* Right: Detail panel */}
      <AnimatePresence initial={false}>
        {selectedNode && (
          <motion.aside
            key="detail"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col shrink-0 border-l border-border/40 bg-card/20 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalle</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NodeDetail
                nodeId={selectedNode.id}
                onClose={() => setSelectedNode(null)}
                onNavigate={(id) => router.push(`/library/${id}`)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

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

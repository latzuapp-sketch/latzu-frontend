"use client";

import { use, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDecks, useDeckCards } from "@/hooks/useFlashcards";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deckColorCls, type Flashcard } from "@/types/flashcards";
import {
  ArrowLeft, Plus, Trash2, Brain, Loader2,
  NotebookPen, X, Flame, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";

// ─── Add Note Modal ───────────────────────────────────────────────────────────

function AddNoteModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, content: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onCreate(title.trim(), content.trim());
    setTitle("");
    setContent("");
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
        className="w-full max-w-xl glass rounded-2xl border border-border/50 overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
          <h3 className="font-semibold">Nueva nota</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-3">
          <div>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título de la nota..."
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-base font-medium outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido de tu nota aquí. Puedes incluir definiciones, explicaciones, ejemplos, fórmulas..."
              rows={8}
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground/60">
            Durante el repaso verás el título y deberás recordar el contenido antes de revelarlo.
          </p>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading || !title.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Guardar nota
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Generate Notes Modal ─────────────────────────────────────────────────────

function GenerateModal({
  onClose,
  onGenerate,
}: {
  onClose: () => void;
  onGenerate: (nodeId: string, count: number) => Promise<void>;
}) {
  const [nodeId, setNodeId] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeId.trim()) return;
    setLoading(true);
    await onGenerate(nodeId.trim(), count);
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
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold">Generar notas con IA</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          La IA generará notas de estudio a partir de un nodo de tu biblioteca de conocimiento.
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block uppercase tracking-wider">ID del nodo de conocimiento</label>
            <input
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              placeholder="Pega el ID del nodo aquí"
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block uppercase tracking-wider">Número de notas</label>
            <input
              type="number"
              min={1}
              max={10}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full rounded-xl border border-border/50 bg-muted/30 px-3.5 py-2.5 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1 gap-2" disabled={loading || !nodeId.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Generar
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Note Row ─────────────────────────────────────────────────────────────────

function NoteRow({ note, onDelete }: { note: Flashcard; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const isDue = new Date(note.dueDate) <= new Date();
  const hasContent = !!note.back.trim();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="group glass rounded-xl border border-border/40 overflow-hidden"
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => hasContent && setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          <NotebookPen className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
          <p className="text-sm font-medium leading-snug truncate">{note.front}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isDue && (
            <span className="text-[10px] text-amber-400 flex items-center gap-0.5 border border-amber-500/20 bg-amber-500/8 px-1.5 py-0.5 rounded-full">
              <Flame className="w-2.5 h-2.5" />
              Repasar
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/40">
            {note.interval > 0 ? `cada ${note.interval}d` : "nueva"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!confirmDel) { setConfirmDel(true); return; }
              onDelete(note.id);
            }}
            onBlur={() => setConfirmDel(false)}
            className={cn(
              "p-1 rounded opacity-0 group-hover:opacity-100 transition-all",
              confirmDel ? "text-destructive opacity-100" : "text-muted-foreground/40 hover:text-destructive"
            )}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {hasContent && (
            expanded
              ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" />
              : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border/30">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mt-3">
                {note.back}
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-3">
                Reps: {note.reps} · EF: {note.easeFactor.toFixed(1)} · Próximo repaso: {
                  new Date(note.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })
                }
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotebookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { decks } = useDecks();
  const { cards, loading, createCard, deleteCard, generateFromNode } = useDeckCards(id);
  const [showAdd, setShowAdd] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);

  const notebook = decks.find((d) => d.id === id);
  const colorCls = deckColorCls(notebook?.color ?? "teal");
  const dueCount = cards.filter((c) => new Date(c.dueDate) <= new Date()).length;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Back nav */}
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 -ml-2">
          <Link href="/notes">
            <ArrowLeft className="w-4 h-4" />
            Cuadernos
          </Link>
        </Button>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl border flex items-center justify-center shrink-0", colorCls)}>
            <NotebookPen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-bold">{notebook?.name ?? "Cuaderno"}</h1>
            {notebook?.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{notebook.description}</p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {cards.length} nota{cards.length !== 1 ? "s" : ""}
              {dueCount > 0 && ` · ${dueCount} para repasar`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {dueCount > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href={`/notes/review?deck=${id}`}>
                <Brain className="w-3.5 h-3.5" />
                Repasar {dueCount}
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowGenerate(true)}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Generar con IA</span>
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowAdd(true)}>
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Nueva nota</span>
          </Button>
        </div>
      </motion.div>

      {/* Notes list */}
      {loading && cards.length === 0 ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass rounded-xl p-4 animate-pulse h-14" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <NotebookPen className="w-12 h-12 mx-auto text-primary/30" />
          <div>
            <p className="font-semibold">Cuaderno vacío</p>
            <p className="text-sm text-muted-foreground mt-1">
              Agrega notas manualmente o genera con IA desde tu biblioteca.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button variant="outline" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" />
              Nueva nota
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => setShowGenerate(true)}>
              <Sparkles className="w-4 h-4" />
              Generar con IA
            </Button>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {cards.map((note) => (
              <NoteRow key={note.id} note={note} onDelete={deleteCard} />
            ))}
          </div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showAdd && (
          <AddNoteModal
            onClose={() => setShowAdd(false)}
            onCreate={async (title, content) => {
              await createCard(title, content);
            }}
          />
        )}
        {showGenerate && (
          <GenerateModal
            onClose={() => setShowGenerate(false)}
            onGenerate={async (nodeId, count) => {
              await generateFromNode(nodeId, count);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

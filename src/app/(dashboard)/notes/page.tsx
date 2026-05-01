"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { useAllNotes } from "@/hooks/useFlashcards";
import { useDecks } from "@/hooks/useFlashcards";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { CREATE_FLASHCARD, DELETE_FLASHCARD } from "@/graphql/ai/operations";
import { NoteCard } from "@/components/notes/NoteCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import {
  NOTE_COLORS, NOTE_COLOR_SWATCHES, noteColorBg,
  type Flashcard,
} from "@/types/flashcards";
import {
  Search, X, Pin, Archive, ArchiveRestore, Palette,
  CheckSquare, AlignLeft, Plus, NotebookPen, Loader2,
  StickyNote, Brain, Flame,
} from "lucide-react";
import Link from "next/link";

// ─── Quick-create widget (like Google Keep's "Take a note") ───────────────────

function QuickCreate({
  defaultDeckId,
  onCreated,
}: {
  defaultDeckId: string;
  onCreated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [color, setColor] = useState("default");
  const [isChecklist, setIsChecklist] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { track } = useTrackInteraction();

  const [_create] = useMutation(CREATE_FLASHCARD, { client: aiClient });
  const [_delete] = useMutation(DELETE_FLASHCARD, { client: aiClient });

  const colorBg = noteColorBg(color);

  async function submit() {
    if (!front.trim() && !back.trim()) { setExpanded(false); return; }
    setSaving(true);
    await _create({
      variables: { deckId: defaultDeckId, front: front.trim(), back: back.trim() },
    });
    track("note.created");
    setFront("");
    setBack("");
    setColor("default");
    setIsChecklist(false);
    setSaving(false);
    setExpanded(false);
    onCreated();
  }

  // Close on outside click
  useEffect(() => {
    if (!expanded) return;
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        submit();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded, front, back]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className={cn(
          "w-full max-w-2xl mx-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl",
          "glass border border-border/50 text-muted-foreground/50 hover:text-muted-foreground",
          "text-sm transition-all hover:border-border/80 hover:shadow-md text-left"
        )}
      >
        <span className="flex-1">Toma una nota...</span>
        <div className="flex items-center gap-1">
          <CheckSquare className="w-4 h-4" />
          <AlignLeft className="w-4 h-4" />
        </div>
      </button>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={cn(
        "w-full max-w-2xl mx-auto rounded-2xl border border-border/50 shadow-xl overflow-hidden",
        colorBg || "glass"
      )}
    >
      <div className="p-4 space-y-2">
        <input
          autoFocus
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Título"
          className="w-full bg-transparent font-semibold text-sm outline-none placeholder:text-muted-foreground/40"
          onKeyDown={(e) => { if (e.key === "Escape") { setExpanded(false); } }}
        />
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder={isChecklist ? "Elemento de la lista" : "Toma una nota..."}
          rows={3}
          className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/40"
          onKeyDown={(e) => {
            if (e.key === "Escape") setExpanded(false);
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") submit();
          }}
        />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-border/30">
        <div className="flex items-center gap-0.5 relative">
          <button
            onClick={() => setIsChecklist((v) => !v)}
            className={cn(
              "p-2 rounded-lg transition-colors text-muted-foreground/50",
              isChecklist ? "text-primary bg-primary/10" : "hover:bg-foreground/8 hover:text-foreground"
            )}
            title="Lista de verificación"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowColorPicker((v) => !v)}
            className="p-2 rounded-lg hover:bg-foreground/8 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute bottom-10 left-0 z-50 flex items-center gap-1.5 p-2 rounded-xl glass border border-border/50 shadow-xl">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all border-2",
                    NOTE_COLOR_SWATCHES[c.value],
                    color === c.value ? "border-white scale-110" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(false)}
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-foreground/8 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1.5"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Masonry grid section ─────────────────────────────────────────────────────

function MasonryGrid({
  notes,
  onUpdate,
  onDelete,
}: {
  notes: Flashcard[];
  onUpdate: (id: string, updates: Partial<Flashcard>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (notes.length === 0) return null;
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
      <AnimatePresence>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            onUpdate={(updates) => onUpdate(note.id, updates)}
            onDelete={() => onDelete(note.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotesPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      if (search.trim()) track("search.query");
    }, 300);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const { track } = useTrackInteraction();
  const { notes, loading, refetch, updateNote } = useAllNotes({
    search: debouncedSearch || undefined,
    includeArchived: showArchived,
  });

  const { decks, loading: decksLoading, createDeck } = useDecks();
  const [_deleteCard] = useMutation(DELETE_FLASHCARD, { client: aiClient });

  // Default deck for quick-create: first deck, or auto-create "Mis Notas"
  const [defaultDeckId, setDefaultDeckId] = useState<string | null>(null);
  useEffect(() => {
    if (decks.length > 0 && !defaultDeckId) {
      setDefaultDeckId(decks[0].id);
    }
  }, [decks, defaultDeckId]);

  async function ensureDefaultDeck() {
    if (defaultDeckId) return defaultDeckId;
    const deck = await createDeck("Mis Notas", "Cuaderno por defecto", "teal");
    if (deck) { setDefaultDeckId(deck.id); return deck.id; }
    return null;
  }

  const handleUpdate = useCallback(async (id: string, updates: Partial<Flashcard>) => {
    await updateNote(id, {
      color: updates.color,
      pinned: updates.pinned,
      archived: updates.archived,
      isChecklist: updates.isChecklist,
      front: updates.front,
      back: updates.back,
      labels: updates.labels,
    });
    track("note.updated", { targetId: id, targetType: "note" });
  }, [updateNote, track]);

  const handleDelete = useCallback(async (id: string) => {
    await _deleteCard({ variables: { cardId: id } });
    await refetch();
  }, [_deleteCard, refetch]);

  const pinnedNotes = notes.filter((n) => n.pinned && !n.archived);
  const regularNotes = notes.filter((n) => !n.pinned && !n.archived);
  const archivedNotes = notes.filter((n) => n.archived);

  const totalDue = decks.reduce((s, d) => s + d.dueCount, 0);

  // Loading state
  if (loading && notes.length === 0 && decksLoading) {
    return (
      <div className="space-y-4 max-w-6xl">
        <div className="h-8 bg-muted/30 rounded-xl w-48 animate-pulse" />
        <div className="h-12 bg-muted/20 rounded-2xl animate-pulse" />
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="break-inside-avoid mb-3 h-32 glass rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold">Notas</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {notes.length} nota{notes.length !== 1 ? "s" : ""}
            {totalDue > 0 && ` · ${totalDue} para repasar`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totalDue > 0 && (
            <Button asChild size="sm" className="gap-1.5">
              <Link href="/notes/review">
                <Flame className="w-3.5 h-3.5" />
                Repasar {totalDue}
              </Link>
            </Button>
          )}
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link href="/notes/notebooks">
              <NotebookPen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cuadernos</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative w-full max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en tus notas..."
          className="w-full pl-10 pr-10 py-3 rounded-2xl glass border border-border/50 text-sm outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/40 transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Toolbar: archive toggle */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all",
            showArchived
              ? "border-primary/50 bg-primary/10 text-primary"
              : "border-border/40 text-muted-foreground/60 hover:border-border/70 hover:text-foreground"
          )}
        >
          {showArchived ? <ArchiveRestore className="w-3 h-3" /> : <Archive className="w-3 h-3" />}
          {showArchived ? "Ver notas activas" : "Ver archivadas"}
        </button>
      </div>

      {/* Quick-create */}
      {!showArchived && !search && (
        <div className="py-1">
          {decksLoading ? (
            <div className="w-full max-w-2xl mx-auto h-12 glass rounded-2xl animate-pulse" />
          ) : decks.length === 0 ? (
            <button
              onClick={async () => { await ensureDefaultDeck(); }}
              className="w-full max-w-2xl mx-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl glass border border-border/50 text-muted-foreground/50 hover:text-muted-foreground text-sm transition-all hover:border-border/80"
            >
              <Plus className="w-4 h-4" />
              Crea tu primer cuaderno para empezar
            </button>
          ) : (
            <QuickCreate
              defaultDeckId={defaultDeckId ?? decks[0].id}
              onCreated={refetch}
            />
          )}
        </div>
      )}

      {/* Empty state */}
      {!loading && notes.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <StickyNote className="w-8 h-8 text-primary/50" />
          </div>
          <div>
            <p className="font-semibold">
              {showArchived ? "No hay notas archivadas" : search ? "Sin resultados" : "Aún no tienes notas"}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
              {showArchived
                ? "Archiva notas para guardarlas fuera de tu vista principal."
                : search
                ? `No se encontraron notas para "${search}"`
                : "Haz clic en el campo de arriba para tomar tu primera nota."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Pinned section */}
      {pinnedNotes.length > 0 && (
        <section className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5 px-0.5">
            <Pin className="w-3 h-3" />
            Fijadas
          </p>
          <MasonryGrid notes={pinnedNotes} onUpdate={handleUpdate} onDelete={handleDelete} />
        </section>
      )}

      {/* Regular / Archived notes */}
      {(regularNotes.length > 0 || (showArchived && archivedNotes.length > 0)) && (
        <section className="space-y-3">
          {pinnedNotes.length > 0 && !showArchived && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 px-0.5">
              Otras
            </p>
          )}
          {showArchived && archivedNotes.length > 0 ? (
            <>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5 px-0.5">
                <Archive className="w-3 h-3" />
                Archivadas
              </p>
              <MasonryGrid notes={archivedNotes} onUpdate={handleUpdate} onDelete={handleDelete} />
            </>
          ) : (
            <MasonryGrid notes={regularNotes} onUpdate={handleUpdate} onDelete={handleDelete} />
          )}
        </section>
      )}
    </div>
  );
}

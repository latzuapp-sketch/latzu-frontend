"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, StickyNote, Plus } from "lucide-react";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { QUICK_CAPTURE } from "@/graphql/ai/operations";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainNoteCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useAllNotes } from "@/hooks/useFlashcards";
import type { Flashcard } from "@/types/flashcards";

/** Notes — Keep-style masonry. Inline composer at top, pinned first. */
export default function BrainNotesPage() {
  const { notes, loading, refetch } = useAllNotes();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);
  const [capture] = useMutation(QUICK_CAPTURE, { client: aiClient });

  useEffect(() => {
    if (composing) setTimeout(() => ref.current?.focus(), 50);
  }, [composing]);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await capture({ variables: { text: t } });
      setText("");
      setComposing(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const ordered = useMemo(() => {
    const list = [...notes];
    list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    return list;
  }, [notes]);

  const open = (n: Flashcard) => setViewing({ kind: "note", note: n });

  return (
    <BrainPageShell
      title="Notas"
      subtitle="Capturas rápidas, recordatorios e ideas sueltas"
      count={notes.length}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {/* Inline composer — Keep-style centered card at the top */}
      <div className="max-w-xl mx-auto mb-6">
        {!composing ? (
          <button
            onClick={() => setComposing(true)}
            className="w-full h-11 px-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/15 text-yellow-200 text-sm flex items-center gap-2 transition-colors"
          >
            <StickyNote className="w-4 h-4" />
            Anotá algo… la IA lo clasifica y archiva.
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3"
          >
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setComposing(false); setText(""); }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
              }}
              placeholder="Escribí una idea, recordatorio…"
              rows={3}
              className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-yellow-300/40"
            />
            <div className="flex items-center justify-end gap-2 mt-1">
              <span className="text-[10px] text-muted-foreground/60 mr-auto">⌘Enter · Esc</span>
              <button onClick={() => { setComposing(false); setText(""); }} className="text-xs px-3 py-1 rounded-md text-muted-foreground hover:text-foreground">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || busy}
                className="text-xs px-3 py-1 rounded-md bg-yellow-500/20 text-yellow-100 hover:bg-yellow-500/30 disabled:opacity-40 inline-flex items-center gap-1"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Guardar
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {loading && notes.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aún no hay notas.
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 [column-fill:_balance]">
          {ordered.map((n) => (
            <div key={n.id} className="break-inside-avoid mb-3">
              <BrainNoteCard
                note={n}
                isSelected={viewing?.kind === "note" && viewing.note.id === n.id}
                onClick={() => open(n)}
              />
            </div>
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

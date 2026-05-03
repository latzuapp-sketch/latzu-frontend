"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainNoteCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useAllNotes } from "@/hooks/useFlashcards";
import type { Flashcard } from "@/types/flashcards";

/** Notes — Google Keep style staggered grid. Pinned first. */
export default function BrainNotesPage() {
  const { notes, loading, refetch } = useAllNotes();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  const ordered = useMemo(() => {
    const list = [...notes];
    list.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });
    return list;
  }, [notes]);

  const open = (n: Flashcard) => setViewing({ kind: "note", note: n });

  return (
    <BrainPageShell
      title="Notas"
      subtitle="Capturas rápidas, recordatorios e ideas sueltas"
      count={notes.length}
      onCreated={refetch}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
      </AnimatePresence>

      {loading && notes.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ordered.length === 0 ? (
        <EmptyState />
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

function EmptyState() {
  return (
    <div className="text-center py-20 text-sm text-muted-foreground">
      No tenés notas todavía. Usá el botón <span className="text-yellow-300 font-medium">Nota</span> de arriba.
    </div>
  );
}

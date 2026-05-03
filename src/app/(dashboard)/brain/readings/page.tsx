"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BookCard } from "@/components/biblioteca/BookCard";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useLibraryBooks } from "@/hooks/useLibrary";

/** Readings — curated book grid (78 enriched books). */
export default function BrainReadingsPage() {
  const { books, loading } = useLibraryBooks();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  return (
    <BrainPageShell
      title="Lecturas"
      subtitle="Biblioteca curada con resúmenes, capítulos y ejercicios generados por IA"
      count={books.length}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>

      {loading && books.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No hay libros disponibles.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {books.map((b, i) => (
            <BookCard
              key={b.id}
              book={b}
              isSelected={viewing?.kind === "book" && viewing.book.id === b.id}
              onClick={() => setViewing({ kind: "book", book: b })}
              index={i}
            />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

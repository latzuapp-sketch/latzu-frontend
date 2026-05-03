"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainFileCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useLibraryFiles } from "@/hooks/useLibraryFiles";

/** Files — grid of uploaded files with size + ext badge. */
export default function BrainFilesPage() {
  const { files } = useLibraryFiles();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);

  return (
    <BrainPageShell
      title="Archivos"
      subtitle="Tus PDFs, documentos y materiales subidos"
      count={files.length}
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>

      {files.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          No hay archivos todavía.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {files.map((f) => (
            <BrainFileCard key={f.id} file={f} onClick={() => setViewing({ kind: "file", file: f })} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

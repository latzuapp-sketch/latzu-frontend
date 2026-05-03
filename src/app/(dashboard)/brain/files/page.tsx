"use client";

import { useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import { Loader2, Upload } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainFileCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useLibraryFiles } from "@/hooks/useLibraryFiles";

/** Files — drop/upload at the top, then grid of file cards. */
export default function BrainFilesPage() {
  const { files, uploading, uploadFile } = useLibraryFiles();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await uploadFile(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <BrainPageShell
      title="Archivos"
      subtitle="Tus PDFs, documentos y materiales subidos"
      count={files.length}
      toolbar={
        <>
          <input ref={inputRef} type="file" onChange={onPick} className="hidden" />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="h-8 px-3 rounded-md border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-200 text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploading ? "Subiendo…" : "Subir archivo"}
          </button>
        </>
      }
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>

      {files.length === 0 ? (
        <div className="text-center py-20 text-sm text-muted-foreground">
          Aún no hay archivos. Usá el botón <span className="text-cyan-300 font-medium">Subir archivo</span>.
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

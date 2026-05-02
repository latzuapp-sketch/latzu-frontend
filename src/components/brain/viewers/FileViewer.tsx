"use client";

/**
 * FileViewer — opens a LibraryFile inside the brain's UniversalViewer.
 *
 * Shows file metadata + the extracted text (truncated indicator if relevant).
 */

import { FileText, AlertCircle } from "lucide-react";
import type { LibraryFile } from "@/types/library";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function FileViewer({ file }: { file: LibraryFile }) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-14 rounded-lg border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            {file.ext || "Archivo"}
          </span>
          <h1 className="text-xl font-heading font-bold leading-tight mt-0.5 break-words">
            {file.name}
          </h1>
          <p className="text-xs text-muted-foreground mt-1.5">
            {formatBytes(file.size)} · {file.chars.toLocaleString()} caracteres extraídos · subido {formatDate(file.uploadedAt)}
          </p>
        </div>
      </div>

      {file.truncated && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
          <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
          <span className="text-amber-200/90">
            El texto extraído fue truncado. Para archivos muy largos, sólo se procesó el inicio.
          </span>
        </div>
      )}

      <div className="rounded-xl border border-border/40 bg-card/30 p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Contenido extraído
        </div>
        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground/90">
          {file.extractedText || "(Sin texto disponible)"}
        </pre>
      </div>
    </div>
  );
}

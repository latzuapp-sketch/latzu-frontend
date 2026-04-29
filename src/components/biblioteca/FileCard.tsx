"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LibraryFile } from "@/types/library";
import { FileText, FileType, Trash2 } from "lucide-react";

const EXT_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pdf:  { label: "PDF",      color: "text-red-400",    bg: "bg-red-500/10" },
  txt:  { label: "TXT",      color: "text-slate-400",  bg: "bg-slate-500/10" },
  md:   { label: "Markdown", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  csv:  { label: "CSV",      color: "text-green-400",  bg: "bg-green-500/10" },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

interface FileCardProps {
  file: LibraryFile;
  isSelected?: boolean;
  onClick: () => void;
  onDelete: () => void;
  index?: number;
}

export function FileCard({ file, isSelected, onClick, onDelete, index = 0 }: FileCardProps) {
  const cfg = EXT_CONFIG[file.ext] ?? { label: file.ext.toUpperCase(), color: "text-muted-foreground", bg: "bg-muted/40" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      className={cn(
        "group rounded-xl border p-4 transition-all cursor-pointer relative",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
          : "border-border/50 bg-card/60 hover:border-border hover:bg-card/90"
      )}
      onClick={onClick}
    >
      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/0 group-hover:text-muted-foreground/60 hover:text-destructive hover:bg-muted/60 transition-all"
        title="Eliminar"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        {/* File icon */}
        <div className={cn("shrink-0 w-9 h-9 rounded-lg flex items-center justify-center", cfg.bg)}>
          <FileText className={cn("w-5 h-5", cfg.color)} />
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium truncate leading-snug mb-0.5", isSelected && "text-primary")}>
            {file.name}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <span className={cn("px-1.5 py-0.5 rounded text-[9px] font-bold uppercase", cfg.bg, cfg.color)}>
              {cfg.label}
            </span>
            <span>{formatSize(file.size)}</span>
            <span>·</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
        </div>
      </div>

      {/* Preview snippet */}
      {file.extractedText && (
        <p className="mt-2.5 text-xs text-muted-foreground/70 leading-relaxed line-clamp-2 pl-12">
          {file.extractedText.slice(0, 120)}…
        </p>
      )}

      {file.truncated && (
        <div className="mt-1.5 pl-12">
          <span className="flex items-center gap-1 text-[10px] text-amber-500/70">
            <FileType className="w-3 h-3" />
            Archivo grande — mostrando primeros 15,000 caracteres
          </span>
        </div>
      )}
    </motion.div>
  );
}

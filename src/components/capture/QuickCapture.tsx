"use client";

/**
 * QuickCapture — universal drop zone.
 *
 * One floating button (FAB) bottom-right, opens a modal with a single
 * unified surface to drop files, paste URLs (incl. YouTube) and type text.
 * Each input becomes a queue item. "Procesar todo" runs them through the
 * right backend pipeline and shows per-item status as they're indexed.
 *
 * Shortcut: Cmd+U / Ctrl+U opens the modal from anywhere in the dashboard.
 */

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle, Sparkles,
  FileText, Link2, Youtube, FileType, Send, UploadCloud,
} from "lucide-react";
import { useIngest, looksLikeUrl, type IngestItem, type IngestKind } from "@/hooks/useIngest";

// ─── Item icon ────────────────────────────────────────────────────────────────

const KIND_ICON: Record<IngestKind, React.ElementType> = {
  text: FileText,
  url: Link2,
  youtube: Youtube,
  file: FileType,
};

const KIND_COLOR: Record<IngestKind, string> = {
  text: "text-violet-400 bg-violet-500/10 border-violet-500/30",
  url: "text-sky-400 bg-sky-500/10 border-sky-500/30",
  youtube: "text-rose-400 bg-rose-500/10 border-rose-500/30",
  file: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

// ─── Queue item row ──────────────────────────────────────────────────────────

function QueueRow({ item, onRemove }: { item: IngestItem; onRemove: (id: string) => void }) {
  const Icon = KIND_ICON[item.kind];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex items-start gap-2.5 px-3 py-2 rounded-lg border border-border/40 bg-card/50"
    >
      <div className={cn("w-7 h-7 rounded-lg border flex items-center justify-center shrink-0", KIND_COLOR[item.kind])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{item.label}</p>
        {item.status === "done" && item.summary && (
          <p className="text-[10px] text-emerald-400 mt-0.5 truncate">
            {item.summary} · {item.nodesCreated ?? 0} ideas
          </p>
        )}
        {item.status === "error" && (
          <p className="text-[10px] text-destructive mt-0.5 truncate">{item.error}</p>
        )}
        {item.status === "processing" && (
          <p className="text-[10px] text-muted-foreground mt-0.5">Indexando…</p>
        )}
        {item.status === "pending" && (
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Listo para procesar</p>
        )}
      </div>
      <div className="shrink-0 mt-0.5">
        {item.status === "processing" ? (
          <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
        ) : item.status === "done" ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        ) : item.status === "error" ? (
          <AlertCircle className="w-3.5 h-3.5 text-destructive" />
        ) : (
          <button
            onClick={() => onRemove(item.id)}
            className="text-muted-foreground/40 hover:text-foreground transition-colors"
            title="Quitar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────────────

interface DropModalProps {
  onClose: () => void;
}

function DropModal({ onClose }: DropModalProps) {
  const {
    queue, isProcessing,
    addText, addFiles, addSmart,
    removeItem, clearDone, processQueue,
  } = useIngest();

  const [draft, setDraft] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pendingCount = queue.filter((i) => i.status === "pending").length;
  const doneCount = queue.filter((i) => i.status === "done").length;
  const errorCount = queue.filter((i) => i.status === "error").length;

  // Focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 60);
  }, []);

  // Esc closes
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        commitDraft();
        if (queue.some((i) => i.status === "pending")) processQueue();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, queue]);

  const commitDraft = () => {
    const t = draft.trim();
    if (!t) return;
    // Split lines: each non-empty line that looks like a URL becomes its own item
    const lines = t.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1 && lines.every(looksLikeUrl)) {
      lines.forEach((l) => addSmart(l));
    } else {
      addSmart(t);
    }
    setDraft("");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    const text = e.dataTransfer.getData("text/plain");
    if (text) addSmart(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-xl glass rounded-2xl border border-border/50 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Tirar a tu enciclopedia</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Texto, URLs, YouTube, PDFs, imágenes — todo va al grafo
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Drop area + composer */}
          <div
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => {
              if (e.currentTarget === e.target) setDragging(false);
            }}
            onDrop={handleDrop}
            className={cn(
              "p-4 m-3 rounded-xl border-2 border-dashed transition-colors space-y-2",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border/40 bg-card/20"
            )}
          >
            <textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onPaste={(e) => {
                // If user pastes a URL by itself, push directly to queue
                const txt = e.clipboardData.getData("text/plain").trim();
                if (txt && !draft && looksLikeUrl(txt) && !/\s/.test(txt)) {
                  e.preventDefault();
                  addSmart(txt);
                }
              }}
              placeholder="Pegá un link, escribí una idea, arrastrá un archivo aquí..."
              rows={3}
              className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/50"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                Subir archivo
              </button>
              <button
                type="button"
                disabled={!draft.trim()}
                onClick={commitDraft}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  draft.trim()
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-muted-foreground/40 cursor-not-allowed"
                )}
              >
                <Plus className="w-3 h-3" />
                Agregar a cola
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.csv,image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Queue */}
          {queue.length > 0 && (
            <div className="px-3 pb-3 space-y-1.5">
              <div className="flex items-center justify-between px-1 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Cola ({queue.length})
                </p>
                {doneCount > 0 && (
                  <button
                    onClick={clearDone}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Limpiar listos
                  </button>
                )}
              </div>
              <AnimatePresence>
                {queue.map((item) => (
                  <QueueRow key={item.id} item={item} onRemove={removeItem} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-4 py-3 flex items-center justify-between shrink-0 bg-card/30">
          <p className="text-[10px] text-muted-foreground">
            {queue.length === 0
              ? "Cmd+U para abrir · Esc para cerrar"
              : `${pendingCount} pendiente${pendingCount === 1 ? "" : "s"} · ${doneCount} indexado${doneCount === 1 ? "" : "s"}${errorCount ? ` · ${errorCount} con error` : ""}`}
          </p>
          <button
            onClick={() => {
              if (draft.trim()) commitDraft();
              processQueue();
            }}
            disabled={isProcessing || (pendingCount === 0 && !draft.trim())}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              isProcessing
                ? "bg-muted text-muted-foreground cursor-wait"
                : (pendingCount > 0 || draft.trim())
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {isProcessing ? "Indexando…" : "Procesar todo"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── FAB + global shortcut ────────────────────────────────────────────────────

export function QuickCapture() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const [open, setOpen] = useState(false);

  // Cmd+U / Ctrl+U opens the drop zone from anywhere
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "u") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!userId) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8",
          "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30",
          "hover:scale-110 active:scale-95 transition-all",
          "bg-gradient-to-br from-primary to-accent"
        )}
        title="Tirar contenido a tu enciclopedia (Cmd+U)"
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {open && <DropModal onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  );
}

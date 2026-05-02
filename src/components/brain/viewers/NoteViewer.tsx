"use client";

/**
 * NoteViewer — opens a Flashcard-as-note in the center pane of /brain.
 *
 * Live edit on title and body (debounced save). Color picker, pin, labels.
 * Uses useAllNotes().updateNote so the cache stays consistent.
 */

import { useEffect, useRef, useState } from "react";
import { Pin, Palette, Tag, Loader2, CheckCircle2, Archive, ArchiveRestore } from "lucide-react";
import { useAllNotes } from "@/hooks/useFlashcards";
import { NOTE_COLORS } from "@/types/flashcards";
import type { Flashcard } from "@/types/flashcards";
import { cn } from "@/lib/utils";

const COLOR_BG_BY_VALUE: Record<string, string> = Object.fromEntries(
  NOTE_COLORS.map((c) => [c.value, c.bg]),
);

interface NoteViewerProps {
  note: Flashcard;
}

export function NoteViewer({ note: initialNote }: NoteViewerProps) {
  const { updateNote } = useAllNotes();

  const [front, setFront] = useState(initialNote.front);
  const [back, setBack] = useState(initialNote.back);
  const [color, setColor] = useState(initialNote.color);
  const [pinned, setPinned] = useState(initialNote.pinned);
  const [archived, setArchived] = useState(initialNote.archived);
  const [colorOpen, setColorOpen] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [labels, setLabels] = useState<string[]>(() => {
    try { return JSON.parse(initialNote.labels) as string[]; } catch { return []; }
  });

  const [savingState, setSavingState] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Reset on note change (sidebar selected a different note)
  useEffect(() => {
    setFront(initialNote.front);
    setBack(initialNote.back);
    setColor(initialNote.color);
    setPinned(initialNote.pinned);
    setArchived(initialNote.archived);
    try { setLabels(JSON.parse(initialNote.labels) as string[]); } catch { setLabels([]); }
  }, [initialNote.id]);  // eslint-disable-line react-hooks/exhaustive-deps

  const queueSave = (patch: Parameters<typeof updateNote>[1]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSavingState("saving");
    debounceRef.current = setTimeout(async () => {
      await updateNote(initialNote.id, patch);
      setSavingState("saved");
      setTimeout(() => setSavingState((s) => (s === "saved" ? "idle" : s)), 1200);
    }, 600);
  };

  const onTitleChange = (v: string) => {
    setFront(v);
    queueSave({ front: v });
  };
  const onBodyChange = (v: string) => {
    setBack(v);
    queueSave({ back: v });
  };
  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    queueSave({ pinned: next });
  };
  const toggleArchive = () => {
    const next = !archived;
    setArchived(next);
    queueSave({ archived: next });
  };
  const pickColor = (v: string) => {
    setColor(v);
    setColorOpen(false);
    queueSave({ color: v });
  };
  const addLabel = () => {
    const t = labelDraft.trim();
    if (!t || labels.includes(t)) { setLabelDraft(""); return; }
    const next = [...labels, t];
    setLabels(next);
    setLabelDraft("");
    queueSave({ labels: JSON.stringify(next) });
  };
  const removeLabel = (l: string) => {
    const next = labels.filter((x) => x !== l);
    setLabels(next);
    queueSave({ labels: JSON.stringify(next) });
  };

  return (
    <div className={cn("rounded-2xl border p-6 space-y-5", COLOR_BG_BY_VALUE[color] || "bg-card/40", "border-border/50")}>
      {/* Title */}
      <input
        value={front}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Sin título"
        className="w-full bg-transparent text-2xl font-heading font-bold leading-snug outline-none placeholder:text-muted-foreground/40"
      />

      {/* Toolbar */}
      <div className="flex items-center gap-1 flex-wrap text-muted-foreground/70">
        <button
          onClick={togglePin}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted/40 transition-colors",
            pinned && "text-yellow-400"
          )}
          title={pinned ? "Desfijar" : "Fijar"}
        >
          <Pin className="w-3.5 h-3.5" fill={pinned ? "currentColor" : "none"} />
        </button>

        <div className="relative">
          <button
            onClick={() => setColorOpen((v) => !v)}
            className="p-1.5 rounded-md hover:bg-muted/40 transition-colors"
            title="Color"
          >
            <Palette className="w-3.5 h-3.5" />
          </button>
          {colorOpen && (
            <div className="absolute left-0 mt-1 z-20 flex items-center gap-1 p-1.5 bg-card rounded-lg border border-border/50 shadow-lg">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => pickColor(c.value)}
                  className={cn(
                    "w-5 h-5 rounded-full border ring-offset-1 ring-offset-card",
                    c.bg || "bg-muted",
                    color === c.value ? "ring-2 ring-primary" : "border-border/40"
                  )}
                  title={c.label}
                />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleArchive}
          className={cn(
            "p-1.5 rounded-md hover:bg-muted/40 transition-colors",
            archived && "text-muted-foreground/60"
          )}
          title={archived ? "Desarchivar" : "Archivar"}
        >
          {archived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
        </button>

        <span className="ml-auto text-[10px] flex items-center gap-1.5">
          {savingState === "saving" && <><Loader2 className="w-3 h-3 animate-spin" /> Guardando…</>}
          {savingState === "saved" && <><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Guardado</>}
        </span>
      </div>

      {/* Labels */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Tag className="w-3 h-3 text-muted-foreground/60" />
        {labels.map((l) => (
          <button
            key={l}
            onClick={() => removeLabel(l)}
            className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Quitar etiqueta"
          >
            {l} ×
          </button>
        ))}
        <input
          value={labelDraft}
          onChange={(e) => setLabelDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLabel(); } }}
          placeholder="+ etiqueta"
          className="text-[10px] bg-transparent outline-none placeholder:text-muted-foreground/40 w-20"
        />
      </div>

      {/* Body */}
      <textarea
        value={back}
        onChange={(e) => onBodyChange(e.target.value)}
        placeholder="Empezá a escribir…"
        rows={Math.max(8, back.split("\n").length + 2)}
        className="w-full bg-transparent text-base leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
}

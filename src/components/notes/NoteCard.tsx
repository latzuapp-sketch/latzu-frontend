"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Pin, PinOff, Archive, ArchiveRestore, Trash2, Palette,
  CheckSquare, AlignLeft, Bookmark,
} from "lucide-react";
import {
  noteColorBg, NOTE_COLORS, NOTE_COLOR_SWATCHES, type Flashcard,
} from "@/types/flashcards";

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({
  current,
  onChange,
  onClose,
}: {
  current: string;
  onChange: (color: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 p-2 rounded-xl glass border border-border/50 shadow-xl"
    >
      {NOTE_COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={(e) => { e.stopPropagation(); onChange(c.value); onClose(); }}
          className={cn(
            "w-6 h-6 rounded-full transition-all border-2",
            NOTE_COLOR_SWATCHES[c.value],
            current === c.value ? "border-white scale-110" : "border-transparent opacity-80 hover:opacity-100"
          )}
        />
      ))}
    </div>
  );
}

// ─── Checklist Renderer ───────────────────────────────────────────────────────

function ChecklistContent({ text }: { text: string }) {
  const lines = text.split("\n").filter(Boolean);
  return (
    <ul className="space-y-1">
      {lines.map((line, i) => {
        const checked = line.startsWith("[x] ") || line.startsWith("[X] ");
        const label = line.replace(/^\[[ xX]\] /, "");
        return (
          <li key={i} className={cn("flex items-start gap-2 text-sm", checked && "line-through opacity-50")}>
            <div className={cn(
              "mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center",
              checked ? "bg-primary/40 border-primary/60" : "border-border/60"
            )}>
              {checked && <span className="text-[10px] text-primary">✓</span>}
            </div>
            {label}
          </li>
        );
      })}
    </ul>
  );
}

// ─── Note Edit Modal ──────────────────────────────────────────────────────────

export function NoteEditModal({
  note,
  onSave,
  onClose,
  onDelete,
}: {
  note: Flashcard;
  onSave: (updates: Partial<Flashcard>) => Promise<void>;
  onClose: () => void;
  onDelete: () => Promise<void>;
}) {
  const [front, setFront] = useState(note.front);
  const [back, setBack] = useState(note.back);
  const [color, setColor] = useState(note.color);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const colorBg = noteColorBg(color);

  async function handleClose() {
    const changed = front !== note.front || back !== note.back || color !== note.color;
    if (changed) {
      setSaving(true);
      await onSave({ front, back, color });
      setSaving(false);
    }
    onClose();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <motion.div
        initial={{ scale: 0.96, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 16 }}
        className={cn(
          "w-full max-w-lg rounded-2xl border border-border/50 overflow-hidden shadow-2xl",
          colorBg || "glass"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 space-y-3">
          <input
            autoFocus
            value={front}
            onChange={(e) => setFront(e.target.value)}
            placeholder="Título"
            className="w-full bg-transparent font-semibold text-base outline-none placeholder:text-muted-foreground/40"
          />
          <textarea
            value={back}
            onChange={(e) => setBack(e.target.value)}
            placeholder="Escribe una nota..."
            rows={6}
            className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-muted-foreground/40"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
          <div className="flex items-center gap-1 relative">
            <button
              onClick={() => setShowColorPicker((v) => !v)}
              className="p-2 rounded-lg hover:bg-foreground/8 text-muted-foreground/60 hover:text-foreground transition-colors"
              title="Cambiar color"
            >
              <Palette className="w-4 h-4" />
            </button>
            {showColorPicker && (
              <ColorPicker
                current={color}
                onChange={setColor}
                onClose={() => setShowColorPicker(false)}
              />
            )}
            <button
              onClick={async () => { await onDelete(); onClose(); }}
              className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleClose}
            disabled={saving}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-foreground/8 transition-colors"
          >
            {saving ? "Guardando..." : "Cerrar"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── NoteCard ─────────────────────────────────────────────────────────────────

export function NoteCard({
  note,
  onUpdate,
  onDelete,
}: {
  note: Flashcard;
  onUpdate: (updates: Partial<Flashcard>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [showActions, setShowActions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const colorBg = noteColorBg(note.color);

  const labels: string[] = (() => {
    try { return JSON.parse(note.labels || "[]"); } catch { return []; }
  })();

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "group relative break-inside-avoid mb-3 rounded-2xl border border-border/40",
          "cursor-pointer transition-all hover:shadow-lg hover:border-border/70",
          colorBg || "glass"
        )}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => { setShowActions(false); setShowColorPicker(false); }}
        onClick={() => setEditOpen(true)}
      >
        {/* Pin badge */}
        {note.pinned && (
          <div className="absolute top-2.5 right-2.5 text-muted-foreground/40">
            <Pin className="w-3.5 h-3.5" />
          </div>
        )}

        <div className="p-4 space-y-2">
          {note.front && (
            <p className="font-semibold text-sm leading-snug pr-5 line-clamp-3">
              {note.front}
            </p>
          )}
          {note.back && (
            <div className="text-sm text-muted-foreground/80">
              {note.isChecklist ? (
                <ChecklistContent text={note.back} />
              ) : (
                <p className="whitespace-pre-wrap line-clamp-8 leading-relaxed">{note.back}</p>
              )}
            </div>
          )}
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {labels.map((l) => (
                <span key={l} className="text-[10px] px-2 py-0.5 rounded-full bg-foreground/8 text-muted-foreground">
                  {l}
                </span>
              ))}
            </div>
          )}
          {note.deckName && (
            <p className="text-[10px] text-muted-foreground/40 flex items-center gap-1 pt-0.5">
              <Bookmark className="w-2.5 h-2.5" />
              {note.deckName}
            </p>
          )}
        </div>

        {/* Hover action bar */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-gradient-to-t from-background/60 to-transparent rounded-b-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-0.5 relative">
                <button
                  onClick={() => setShowColorPicker((v) => !v)}
                  className="p-1.5 rounded-lg hover:bg-foreground/8 text-muted-foreground/50 hover:text-foreground transition-colors"
                  title="Color"
                >
                  <Palette className="w-3.5 h-3.5" />
                </button>
                {showColorPicker && (
                  <ColorPicker
                    current={note.color}
                    onChange={(c) => onUpdate({ color: c })}
                    onClose={() => setShowColorPicker(false)}
                  />
                )}
                <button
                  onClick={() => onUpdate({ pinned: !note.pinned })}
                  className="p-1.5 rounded-lg hover:bg-foreground/8 text-muted-foreground/50 hover:text-foreground transition-colors"
                  title={note.pinned ? "Desfijar" : "Fijar"}
                >
                  {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onUpdate({ archived: !note.archived })}
                  className="p-1.5 rounded-lg hover:bg-foreground/8 text-muted-foreground/50 hover:text-foreground transition-colors"
                  title={note.archived ? "Restaurar" : "Archivar"}
                >
                  {note.archived
                    ? <ArchiveRestore className="w-3.5 h-3.5" />
                    : <Archive className="w-3.5 h-3.5" />}
                </button>
              </div>
              <button
                onClick={async (e) => { e.stopPropagation(); await onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground/50 hover:text-destructive transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Extra bottom padding when actions visible */}
        {showActions && <div className="h-8" />}
      </motion.div>

      <AnimatePresence>
        {editOpen && (
          <NoteEditModal
            note={note}
            onSave={onUpdate}
            onClose={() => setEditOpen(false)}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </>
  );
}

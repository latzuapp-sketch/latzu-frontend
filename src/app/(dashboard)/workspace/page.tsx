"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/useWorkspace";
import {
  Plus, Layers, Loader2, X, CalendarDays, Trash2, AlertTriangle,
} from "lucide-react";
import { WorkspaceAgent } from "@/components/workspace/WorkspaceAgent";

// ─── Emoji picker ─────────────────────────────────────────────────────────────

const EMOJI_GRID = [
  "📁","📚","📖","🎓","💡","🧠","🔬","🎯","📊","📝","💼","🚀",
  "🌟","💻","📱","🎨","🎵","🎬","📷","📌","🏆","🌍","🧩","⚡",
  "🔭","🧪","🎤","📋","🗂️","🌐","🔐","✨","🏠","🌱","🔥","💎",
];

function EmojiPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (e: string) => void;
}) {
  return (
    <div className="p-2 rounded-xl border border-border/60 bg-muted/30">
      <div className="grid grid-cols-9 gap-1">
        {EMOJI_GRID.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className={cn(
              "w-8 h-8 flex items-center justify-center text-base rounded hover:bg-muted/60 transition-colors",
              selected === emoji && "bg-primary/20 ring-1 ring-primary/40"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Create workspace modal ───────────────────────────────────────────────────

function CreateWorkspaceModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string, icon: string, description: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📁");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    await onCreate(title.trim(), icon, description.trim());
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-md rounded-2xl border border-border/60 bg-card shadow-2xl p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-lg font-semibold mb-5">Nueva área de trabajo</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Emoji picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Icono — seleccionado: {icon}
            </label>
            <EmojiPicker selected={icon} onSelect={setIcon} />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Nombre
            </label>
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mi área de trabajo"
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Descripción <span className="normal-case font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para qué es este espacio…"
              rows={2}
              className="w-full bg-muted/30 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 gap-1.5"
              disabled={!title.trim() || loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Crear
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Workspace card ───────────────────────────────────────────────────────────

function WorkspaceCard({
  id,
  icon,
  title,
  description,
  createdAt,
  onDelete,
}: {
  id: string;
  icon: string;
  title: string;
  description: string;
  createdAt: string;
  onDelete: () => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative rounded-2xl border border-border/40 bg-card/60 hover:border-border hover:bg-card transition-all cursor-pointer overflow-hidden"
      onClick={() => router.push(`/workspace/${id}`)}
    >
      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirmDelete) onDelete();
          else setConfirmDelete(true);
        }}
        onBlur={() => setTimeout(() => setConfirmDelete(false), 200)}
        className={cn(
          "absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-lg transition-all",
          "opacity-0 group-hover:opacity-100",
          confirmDelete
            ? "bg-destructive/20 text-destructive opacity-100"
            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
        title={confirmDelete ? "Confirmar" : "Eliminar área"}
      >
        {confirmDelete ? <AlertTriangle className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
      </button>

      <div className="p-5">
        {/* Icon */}
        <div className="text-4xl mb-3">{icon}</div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-1 line-clamp-2">{title}</h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-muted-foreground/70 line-clamp-2 mb-3">{description}</p>
        )}

        {/* Date */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50 mt-auto pt-2 border-t border-border/30">
          <CalendarDays className="w-3 h-3" />
          <span>
            {new Date(createdAt).toLocaleDateString("es-ES", {
              day: "numeric", month: "short", year: "numeric",
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const { workspaces, loading, createWorkspace, deleteWorkspace } = useWorkspaces();
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  const handleCreate = async (title: string, icon: string, description: string) => {
    const ws = await createWorkspace({ title, icon, description });
    if (ws) router.push(`/workspace/${ws.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-heading font-semibold">Workspace</h1>
            <p className="text-sm text-muted-foreground/60">
              {workspaces.length === 0
                ? "Crea tu primera área de trabajo"
                : `${workspaces.length} área${workspaces.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WorkspaceAgent onOrganized={() => {}} />
          <Button onClick={() => setShowCreate(true)} className="gap-1.5">
            <Plus className="w-4 h-4" />
            Nueva área
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && workspaces.length === 0 && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty state */}
      {!loading && workspaces.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="text-6xl">📁</div>
          <div className="text-center space-y-1">
            <p className="font-medium text-foreground/80">Sin áreas de trabajo</p>
            <p className="text-sm text-muted-foreground/60">
              Crea un espacio para organizar tus páginas, apuntes y materiales de estudio.
            </p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-1.5 mt-2">
            <Plus className="w-4 h-4" />
            Crear área de trabajo
          </Button>
        </div>
      )}

      {/* Grid */}
      {workspaces.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                id={ws.id}
                icon={ws.icon}
                title={ws.title}
                description={ws.description}
                createdAt={ws.createdAt}
                onDelete={() => deleteWorkspace(ws.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreate && (
          <CreateWorkspaceModal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

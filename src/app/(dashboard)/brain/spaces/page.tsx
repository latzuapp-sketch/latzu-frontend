"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Folder } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { BrainPageCard } from "@/components/brain/BrainItemCards";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useWorkspaces } from "@/hooks/useWorkspace";

/** Spaces — workspace cards + inline violet creator (title + emoji). */
export default function BrainSpacesPage() {
  const { workspaces, loading, createWorkspace, refetch } = useWorkspaces();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📦");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) setTimeout(() => ref.current?.focus(), 50); }, [open]);

  const submit = async () => {
    const t = title.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await createWorkspace({ title: t.slice(0, 80), icon });
      setTitle(""); setIcon("📦");
      setOpen(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  return (
    <BrainPageShell
      title="Spaces"
      subtitle="Workspaces temáticos con sus páginas"
      count={workspaces.length}
      toolbar={
        !open && (
          <button
            onClick={() => setOpen(true)}
            className="h-8 px-3 rounded-md border border-violet-500/40 bg-violet-500/15 hover:bg-violet-500/25 text-violet-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo space
          </button>
        )
      }
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => { setViewing(null); refetch(); }} />
        )}
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 rounded-xl border border-violet-500/40 bg-violet-500/10 p-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Folder className="w-4 h-4 text-violet-300" />
              <span className="text-sm font-semibold text-violet-200">Nuevo space</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">Enter · Esc</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value.slice(0, 2))}
                placeholder="📦"
                className="w-12 text-center bg-background/60 rounded-md p-2 text-base outline-none border border-border/40"
              />
              <input
                ref={ref}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { setOpen(false); setTitle(""); }
                  if (e.key === "Enter") { e.preventDefault(); submit(); }
                }}
                placeholder="Ej. 'Tesis · estado del arte'"
                className="flex-1 bg-background/60 rounded-md p-2 text-sm outline-none placeholder:text-muted-foreground/40 border border-border/40"
              />
            </div>
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setOpen(false); setTitle(""); }} className="text-xs px-3 py-1 rounded-md text-muted-foreground hover:text-foreground" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!title.trim() || busy}
                className="text-xs px-3 py-1 rounded-md bg-violet-500/25 text-violet-100 hover:bg-violet-500/35 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Crear space
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && workspaces.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Aún no tenés spaces.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {workspaces.map((w) => (
            <BrainPageCard key={w.id} workspace={w} onClick={() => setViewing({ kind: "workspace", workspace: w })} />
          ))}
        </div>
      )}
    </BrainPageShell>
  );
}

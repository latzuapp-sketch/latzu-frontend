"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Lightbulb } from "lucide-react";
import { BrainPageShell } from "@/components/brain/BrainPageShell";
import { GroupedConcepts } from "@/components/brain/GroupedConcepts";
import { UniversalViewer, type ViewerItem } from "@/components/brain/UniversalViewer";
import { useKnowledgeNodes } from "@/hooks/useLibrary";
import { useExtractText } from "@/hooks/useKnowledge";
import { useUserModel } from "@/hooks/useOrganizerAgent";

interface LifeAreaParsed {
  name: string;
  description?: string;
  node_ids?: string[];
  strength?: number;
}

function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch { return []; }
}

/** Concepts — auto-grouped knowledge graph. Inline indigo extractor on top. */
export default function BrainConceptsPage() {
  const { nodes, loading, refetch } = useKnowledgeNodes({ limit: 300 });
  const { extract } = useExtractText();
  const { userModel } = useUserModel();
  const [viewing, setViewing] = useState<ViewerItem | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { if (composerOpen) setTimeout(() => ref.current?.focus(), 50); }, [composerOpen]);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    try {
      await extract({ text: t, sourceRef: "brain:concepts" });
      setText("");
      setComposerOpen(false);
      refetch();
    } finally {
      setBusy(false);
    }
  };

  const concepts = useMemo(() => nodes.filter((n) => n.type !== "book"), [nodes]);
  const lifeAreas = useMemo(
    () => safeJsonArray<LifeAreaParsed>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );

  return (
    <BrainPageShell
      title="Conceptos"
      subtitle="Tu grafo de conocimiento — agrupado por categoría detectada por la IA"
      count={concepts.length}
      toolbar={
        !composerOpen && (
          <button
            onClick={() => setComposerOpen(true)}
            className="h-8 px-3 rounded-md border border-indigo-500/40 bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200 text-xs font-medium inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Extraer texto
          </button>
        )
      }
    >
      <AnimatePresence>
        {viewing && (
          <UniversalViewer item={viewing} onClose={() => setViewing(null)} />
        )}
        {composerOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mb-4 rounded-xl border border-indigo-500/40 bg-indigo-500/10 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-300" />
              <span className="text-sm font-semibold text-indigo-200">Extraer conceptos</span>
              <span className="text-[10px] text-muted-foreground/60 ml-auto">⌘Enter · Esc</span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 mb-2">
              Pegá texto, apuntes o un párrafo. La IA crea nodos enlazados.
            </p>
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setComposerOpen(false); setText(""); }
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); }
              }}
              placeholder="Pegá apuntes, un capítulo, o cualquier texto…"
              rows={5}
              className="w-full bg-background/60 rounded-md p-2.5 text-sm outline-none resize-none placeholder:text-muted-foreground/40 border border-border/40"
            />
            <div className="flex items-center justify-end gap-2 mt-2">
              <button onClick={() => { setComposerOpen(false); setText(""); }} className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:text-foreground" disabled={busy}>
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={!text.trim() || busy}
                className="text-xs px-3 py-1.5 rounded-md bg-indigo-500/25 text-indigo-100 hover:bg-indigo-500/35 disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Extraer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading && concepts.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : concepts.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Aún no hay conceptos.
        </div>
      ) : (
        <GroupedConcepts
          nodes={concepts}
          lifeAreas={lifeAreas}
          onPick={(node) => setViewing({ kind: "node", node })}
        />
      )}
    </BrainPageShell>
  );
}

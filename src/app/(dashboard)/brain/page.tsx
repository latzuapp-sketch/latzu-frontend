"use client";

/**
 * /brain — Notion-like adaptive encyclopedia.
 *
 * 3-col layout:
 *   - Left:   BrainSidebar — agent-driven tree (Recientes, Caliente, Áreas, Spaces, Tipos)
 *   - Center: AdaptiveItemCard grid — type-aware visual rendering
 *   - Right:  NodeDetail — full content of selected item
 *
 * The agent's signals (UserModel.lifeAreas, momentumTopics, staleAreas) drive
 * the tree structure. The user never has to organize anything manually.
 */

import { useMemo, useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search, Sparkles, X, Loader2, Brain, Plus, Filter,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { AdaptiveItemCard, detectVariant } from "@/components/brain/AdaptiveItemCard";
import { BrainSidebar, type BrainSelection } from "@/components/brain/BrainSidebar";
import { useKnowledgeNodes } from "@/hooks/useLibrary";
import { useUserModel } from "@/hooks/useOrganizerAgent";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function safeJsonArray<T = unknown>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

interface LifeAreaParsed {
  name: string;
  node_ids?: string[];
  description?: string;
}

function selectionTitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":       return "Todo lo que sabés";
    case "recent":    return "Recientes";
    case "topic":     return s.topic;
    case "lifeArea":  return s.area;
    case "workspace": return s.title;
    case "type":      return `Tipo: ${s.nodeType}`;
  }
}

function selectionSubtitle(s: BrainSelection): string {
  switch (s.kind) {
    case "all":       return "Tu enciclopedia completa, ordenada por tu agente.";
    case "recent":    return "Lo último que tiraste a tu enciclopedia.";
    case "topic":     return "Tema marcado como caliente por tu agente.";
    case "lifeArea":  return "Área de vida detectada por tu agente.";
    case "workspace": return "Tu space personalizado.";
    case "type":      return "Filtrado por tipo de contenido.";
  }
}

// ─── Apply selection filter ───────────────────────────────────────────────────

function applySelection(
  nodes: KnowledgeNode[],
  s: BrainSelection,
  lifeAreas: LifeAreaParsed[],
  search: string
): KnowledgeNode[] {
  let out = nodes;

  // Search first (cross-cutting)
  const q = search.trim().toLowerCase();
  if (q) {
    out = out.filter(
      (n) =>
        n.name.toLowerCase().includes(q) ||
        (n.content?.toLowerCase().includes(q) ?? false)
    );
  }

  switch (s.kind) {
    case "all":
      return out;
    case "recent":
      // KnowledgeNode lacks timestamp in current query — fall back to id-based proxy
      return out.slice(0, 30);
    case "topic": {
      const topic = s.topic.toLowerCase();
      return out.filter(
        (n) => n.name.toLowerCase().includes(topic) || (n.content?.toLowerCase().includes(topic) ?? false)
      );
    }
    case "lifeArea": {
      const area = lifeAreas.find((a) => a.name === s.area);
      const ids = new Set(area?.node_ids ?? []);
      if (ids.size === 0) {
        // Fallback: name match
        const lower = s.area.toLowerCase();
        return out.filter((n) => n.name.toLowerCase().includes(lower));
      }
      return out.filter((n) => ids.has(n.id));
    }
    case "workspace": {
      // Workspaces stored as Entity, not directly tied to KnowledgeNode in this query.
      // Use sourceRef heuristic: nodes whose source includes the workspace id or title.
      const lower = s.title.toLowerCase();
      return out.filter(
        (n) => n.sourceRef?.toLowerCase().includes(lower) || n.name.toLowerCase().includes(lower)
      );
    }
    case "type":
      return out.filter((n) => n.type === s.nodeType);
  }
}

// ─── Sort helper — agent-influenced ordering ──────────────────────────────────

function sortForView(nodes: KnowledgeNode[], s: BrainSelection): KnowledgeNode[] {
  // Synthesis nodes always pinned to the top of any view
  const out = [...nodes];
  out.sort((a, b) => {
    const aSyn = detectVariant(a) === "synthesis" ? 0 : 1;
    const bSyn = detectVariant(b) === "synthesis" ? 0 : 1;
    if (aSyn !== bSyn) return aSyn - bSyn;
    // Otherwise stable
    return 0;
  });
  if (s.kind === "recent") {
    // No-op (already sliced)
  }
  return out;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();
  const { userModel } = useUserModel();
  const [selection, setSelection] = useState<BrainSelection>({ kind: "all" });
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { nodes, total, loading } = useKnowledgeNodes({ limit: 300 });

  const lifeAreas = useMemo(
    () => safeJsonArray<LifeAreaParsed>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );

  const filtered = useMemo(
    () => sortForView(applySelection(nodes, selection, lifeAreas, deferredSearch), selection),
    [nodes, selection, lifeAreas, deferredSearch]
  );

  const synthesisCount = useMemo(
    () => filtered.filter((n) => detectVariant(n) === "synthesis").length,
    [filtered]
  );

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-3 md:-m-6 overflow-hidden bg-background">
      {/* Left: Tree sidebar */}
      <BrainSidebar
        nodes={nodes}
        selection={selection}
        onSelect={(s) => {
          setSelection(s);
          setSelectedNode(null);
        }}
      />

      {/* Center: Items list */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border/30 shrink-0 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl font-heading font-bold capitalize truncate">{selectionTitle(selection)}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{selectionSubtitle(selection)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {synthesisCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/30">
                  <Sparkles className="w-3 h-3" />
                  {synthesisCount} síntesis del agente
                </span>
              )}
              <span className="text-[10px] text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "item" : "items"}
              </span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar en esta vista…"
              className="pl-8 h-8 text-xs"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading && filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <EmptyState selection={selection} hasNodes={nodes.length > 0} hasSearch={!!search} />
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((node) => (
                  <AdaptiveItemCard
                    key={node.id}
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onClick={() => setSelectedNode(node)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {filtered.length > 0 && total > nodes.length && (
            <p className="text-[10px] text-muted-foreground text-center mt-6">
              Mostrando {nodes.length} de {total}. Tirá más cosas con <kbd className="px-1 py-0.5 rounded border border-border/40 bg-muted/40 font-mono">⌘U</kbd>.
            </p>
          )}
        </div>
      </div>

      {/* Right: Detail panel */}
      <AnimatePresence initial={false}>
        {selectedNode && (
          <motion.aside
            key="detail"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden lg:flex flex-col shrink-0 border-l border-border/40 bg-card/20 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detalle</span>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <NodeDetail
                nodeId={selectedNode.id}
                onClose={() => setSelectedNode(null)}
                onNavigate={(id) => router.push(`/library/${id}`)}
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({
  selection, hasNodes, hasSearch,
}: { selection: BrainSelection; hasNodes: boolean; hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center space-y-2">
        <Filter className="w-8 h-8 mx-auto text-muted-foreground/30" />
        <p className="text-sm font-medium">Nada coincide con esa búsqueda.</p>
      </div>
    );
  }

  if (!hasNodes) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/30 p-12 text-center space-y-3 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <p className="font-heading font-bold">Tu enciclopedia está vacía</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Tirá tu primera nota, link, PDF o video. La IA lo lee, lo conecta y arma tu enciclopedia.
        </p>
        <p className="text-xs text-muted-foreground/70">
          <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 font-mono text-[10px]">⌘U</kbd> en cualquier lugar para abrir el drop zone.
        </p>
      </div>
    );
  }

  // Has nodes but this view is empty
  return (
    <div className="rounded-2xl border border-dashed border-border/50 p-10 text-center space-y-2">
      <Sparkles className="w-8 h-8 mx-auto text-muted-foreground/30" />
      <p className="text-sm font-medium">
        {selection.kind === "lifeArea" || selection.kind === "topic"
          ? "Tu agente todavía no agrupó nada acá."
          : "Sin items en esta vista."}
      </p>
      <p className="text-xs text-muted-foreground max-w-md mx-auto">
        A medida que agregues más contenido, el agente va a empezar a llenar este espacio.
      </p>
    </div>
  );
}

"use client";

/**
 * /brain — your unified personal encyclopedia.
 *
 * Single timeline of every KnowledgeNode + Note + Synthesis the user has,
 * with quick filters by source. Clicking a card opens it via /library/[id]
 * (existing detail page works for any KnowledgeNode).
 */

import { useMemo, useState, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Brain, Search, Sparkles, Library, FileText, Youtube, Globe, Link2,
  Layers, X, Loader2, BookOpen,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NodeCard } from "@/components/biblioteca/NodeCard";
import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { useKnowledgeNodes, useKnowledgeStats, useLibraryBooks } from "@/hooks/useLibrary";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Source filters ───────────────────────────────────────────────────────────

type SourceFilter = "all" | "mine" | "files" | "youtube" | "web" | "synthesis" | "books";

const FILTERS: Array<{
  id: SourceFilter;
  label: string;
  Icon: React.ElementType;
  match: (n: KnowledgeNode) => boolean;
}> = [
  { id: "all", label: "Todo", Icon: Brain, match: () => true },
  {
    id: "mine",
    label: "Mis ideas",
    Icon: Sparkles,
    match: (n) => !n.sourceRef || n.sourceRef.startsWith("quick-capture") || n.sourceRef === "manual",
  },
  {
    id: "files",
    label: "Archivos",
    Icon: FileText,
    match: (n) => !!n.sourceRef && n.sourceRef.startsWith("file:"),
  },
  {
    id: "youtube",
    label: "YouTube",
    Icon: Youtube,
    match: (n) => !!n.sourceRef && n.sourceRef.startsWith("youtube:"),
  },
  {
    id: "web",
    label: "Web",
    Icon: Globe,
    match: (n) => !!n.sourceRef && /^https?:\/\//.test(n.sourceRef),
  },
  {
    id: "synthesis",
    label: "Síntesis del agente",
    Icon: Sparkles,
    match: (n) => !!n.sourceRef && n.sourceRef.startsWith("synthesis"),
  },
  {
    id: "books",
    label: "Libros curados",
    Icon: BookOpen,
    match: (n) => !!n.sourceRef && n.sourceRef.startsWith("curated:"),
  },
];

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const { stats, loading } = useKnowledgeStats();
  const { books } = useLibraryBooks();

  if (loading && !stats) {
    return <div className="h-16 rounded-xl border border-border/40 bg-card/40 animate-pulse" />;
  }

  const items = [
    { label: "Ideas", value: stats?.totalNodes ?? 0, Icon: Brain },
    { label: "Conexiones", value: stats?.totalRelationships ?? 0, Icon: Link2 },
    { label: "Tipos", value: stats?.nodeTypes?.length ?? 0, Icon: Layers },
    { label: "Libros", value: books.length, Icon: BookOpen },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map(({ label, value, Icon }) => (
        <div
          key={label}
          className="rounded-xl border border-border/40 bg-card/40 p-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div>
            <p className="text-base font-bold leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrainPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [activeFilter, setActiveFilter] = useState<SourceFilter>("all");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  const { nodes, total, loading } = useKnowledgeNodes({
    search: deferredSearch || undefined,
    limit: 200,
  });

  const filtered = useMemo(() => {
    const matcher = FILTERS.find((f) => f.id === activeFilter)?.match ?? (() => true);
    return nodes.filter(matcher);
  }, [nodes, activeFilter]);

  // Counts per filter for the chip badges
  const counts = useMemo(() => {
    const m: Record<SourceFilter, number> = {
      all: nodes.length,
      mine: 0, files: 0, youtube: 0, web: 0, synthesis: 0, books: 0,
    };
    for (const n of nodes) {
      for (const f of FILTERS) {
        if (f.id !== "all" && f.match(n)) m[f.id]++;
      }
    }
    return m;
  }, [nodes]);

  return (
    <div className="space-y-5 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold">Tu enciclopedia</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Todo lo que sabés y lo que tu agente conectó por vos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/library">
              <Library className="w-3.5 h-3.5" />
              Lecturas curadas
            </Link>
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <StatsStrip />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar en toda tu enciclopedia…"
          className="pl-9 h-10"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const isActive = activeFilter === f.id;
          const count = counts[f.id];
          if (f.id !== "all" && count === 0) return null;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all whitespace-nowrap shrink-0",
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border/40 bg-card/40 text-muted-foreground hover:text-foreground hover:border-border/60"
              )}
            >
              <f.Icon className="w-3 h-3" />
              {f.label}
              <span className={cn("text-[10px]", isActive ? "text-primary/70" : "text-muted-foreground/50")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Body: grid + side panel for detail */}
      <div className="flex gap-4">
        <div className={cn("min-w-0 transition-all duration-300", selectedNode ? "flex-[0_0_60%]" : "flex-1")}>
          {loading && filtered.length === 0 && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border/50 p-12 text-center space-y-3">
              <Brain className="w-10 h-10 mx-auto text-muted-foreground/30" />
              <p className="font-heading font-bold">
                {search || activeFilter !== "all"
                  ? "Nada coincide con ese filtro"
                  : "Tu enciclopedia está vacía"}
              </p>
              {!search && activeFilter === "all" && (
                <>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Tirá tu primera nota, link, PDF o video. La IA lo lee, lo conecta y lo agrega acá.
                  </p>
                  <p className="text-xs text-muted-foreground/70">
                    Tip: pulsá <kbd className="px-1.5 py-0.5 rounded border border-border/50 bg-muted/40 font-mono text-[10px]">Cmd+U</kbd> en cualquier lugar para abrir el drop zone.
                  </p>
                </>
              )}
            </div>
          )}

          {filtered.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3 px-1">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} de {total} ideas
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {filtered.map((node, i) => (
                    <NodeCard
                      key={node.id}
                      node={node}
                      isSelected={selectedNode?.id === node.id}
                      onClick={() => setSelectedNode(node)}
                      index={i}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Detail side panel */}
        <AnimatePresence initial={false}>
          {selectedNode && (
            <motion.aside
              key="detail"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "40%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="hidden lg:block flex-shrink-0 overflow-hidden border-l border-border/40 pl-4"
            >
              <div className="sticky top-4 max-h-[calc(100vh-4rem)] overflow-y-auto">
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
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
    </div>
  );
}

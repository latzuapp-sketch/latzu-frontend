"use client";

import { useState, useCallback, useDeferredValue } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NodeCard } from "@/components/biblioteca/NodeCard";
import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { getNodeTypeConfig, TYPE_CONFIG } from "@/components/biblioteca/NodeTypeConfig";
import { useKnowledgeNodes, useKnowledgeStats } from "@/hooks/useLibrary";
import { cn } from "@/lib/utils";
import {
  Search,
  Library,
  Network,
  LayoutGrid,
  Layers,
  Loader2,
  X,
  Filter,
  SlidersHorizontal,
} from "lucide-react";

// ─── Source formatting ────────────────────────────────────────────────────────

function formatSourceRef(ref: string): string {
  if (ref.startsWith("youtube:")) return `▶ ${ref.slice(8)}`;
  return ref;
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        {hasFilters ? (
          <Filter className="w-7 h-7 text-muted-foreground/60" />
        ) : (
          <Library className="w-7 h-7 text-muted-foreground/60" />
        )}
      </div>
      <p className="font-semibold text-sm mb-1">
        {hasFilters ? "Sin resultados" : "Biblioteca vacía"}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {hasFilters
          ? "Prueba ajustando los filtros o la búsqueda."
          : "Extrae textos o procesa videos en la página de Conocimiento para poblar la biblioteca."}
      </p>
    </div>
  );
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip({ statsLoading }: { statsLoading: boolean }) {
  const { stats } = useKnowledgeStats();

  const items = [
    {
      icon: <Layers className="w-4 h-4 text-primary" />,
      label: "Nodos",
      value: stats?.totalNodes ?? 0,
    },
    {
      icon: <Network className="w-4 h-4 text-indigo-400" />,
      label: "Relaciones",
      value: stats?.totalRelationships ?? 0,
    },
    {
      icon: <LayoutGrid className="w-4 h-4 text-amber-400" />,
      label: "Tipos",
      value: stats?.nodeTypes.length ?? 0,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map((item) => (
        <Card key={item.label} className="glass">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
              {item.icon}
            </div>
            <div>
              <p className="text-xs text-muted-foreground leading-none mb-0.5">
                {item.label}
              </p>
              {statsLoading ? (
                <div className="h-4 w-10 bg-muted/40 rounded animate-pulse mt-0.5" />
              ) : (
                <p className="text-sm font-bold tabular-nums">{item.value}</p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [rawSearch, setRawSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSourceFilter, setShowSourceFilter] = useState(false);

  // Defer search so typing doesn't fire a query on every keystroke
  const search = useDeferredValue(rawSearch);

  const { nodes, total, loading } = useKnowledgeNodes({
    search: search || undefined,
    nodeType: activeType || undefined,
    sourceRef: activeSource || undefined,
    limit: 80,
  });

  const { stats, loading: statsLoading } = useKnowledgeStats();

  const hasFilters = !!rawSearch || !!activeType || !!activeSource;

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  const handleNavigate = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  const clearFilters = () => {
    setRawSearch("");
    setActiveType(null);
    setActiveSource(null);
  };

  // Node type tabs — only show types that exist in the current result set
  const availableTypes = stats?.nodeTypes ?? [];

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -mx-6 -mb-6">
      {/* ── Left panel ── */}
      <div
        className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          selectedNodeId ? "flex-[0_0_60%]" : "flex-1"
        )}
      >
        {/* Header + search */}
        <div className="px-6 pt-6 pb-4 space-y-4 border-b border-border/50">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-heading font-bold mb-0.5">Biblioteca</h1>
              <p className="text-sm text-muted-foreground">
                {loading
                  ? "Cargando…"
                  : `${total} nodo${total !== 1 ? "s" : ""} de conocimiento`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <StatsStrip statsLoading={statsLoading} />

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Buscar por nombre o contenido…"
                className="pl-9 h-9 text-sm"
              />
              {rawSearch && (
                <button
                  onClick={() => setRawSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Source filter toggle */}
            {stats && stats.sourceRefs.length > 0 && (
              <Button
                variant={activeSource ? "default" : "outline"}
                size="sm"
                onClick={() => setShowSourceFilter((v) => !v)}
                className="gap-1.5 h-9 shrink-0"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Fuente
              </Button>
            )}
          </div>

          {/* Source refs dropdown */}
          <AnimatePresence>
            {showSourceFilter && stats && stats.sourceRefs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-1.5 overflow-hidden"
              >
                <button
                  onClick={() => setActiveSource(null)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs border transition-all",
                    !activeSource
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  Todas las fuentes
                </button>
                {stats.sourceRefs.map((ref) => (
                  <button
                    key={ref}
                    onClick={() =>
                      setActiveSource(activeSource === ref ? null : ref)
                    }
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs border transition-all",
                      activeSource === ref
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {formatSourceRef(ref)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveType(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all",
                !activeType
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-border"
              )}
            >
              Todos
              {!activeType && (
                <span className="ml-1.5 tabular-nums">{total}</span>
              )}
            </button>

            {availableTypes.map((type) => {
              const cfg = getNodeTypeConfig(type);
              const { Icon } = cfg;
              return (
                <button
                  key={type}
                  onClick={() =>
                    setActiveType(activeType === type ? null : type)
                  }
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 transition-all",
                    activeType === type
                      ? cn(cfg.bg, cfg.text, cfg.border)
                      : "border-border text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/50 transition-all shrink-0"
              >
                <X className="w-3 h-3" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Node grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && nodes.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : nodes.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {nodes.map((node, i) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  index={i}
                  isSelected={node.id === selectedNodeId}
                  onClick={() => handleNodeClick(node.id)}
                />
              ))}
            </div>
          )}

          {/* Loading indicator for background refetch */}
          {loading && nodes.length > 0 && (
            <div className="flex justify-center pt-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: Node detail ── */}
      <AnimatePresence>
        {selectedNodeId && (
          <div className="flex-[0_0_40%] min-w-[320px] max-w-[480px] border-l border-border">
            <NodeDetail
              nodeId={selectedNodeId}
              onClose={() => setSelectedNodeId(null)}
              onNavigate={handleNavigate}
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

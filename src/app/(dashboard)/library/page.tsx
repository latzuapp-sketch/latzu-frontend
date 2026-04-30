"use client";

import { useState, useCallback, useDeferredValue } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NodeCard } from "@/components/biblioteca/NodeCard";
import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { BookCard } from "@/components/biblioteca/BookCard";
import { BookDetail } from "@/components/biblioteca/BookDetail";
import { FileCard } from "@/components/biblioteca/FileCard";
import { FileDetail } from "@/components/biblioteca/FileDetail";
import { FileUploadZone } from "@/components/biblioteca/FileUploadZone";
import { getNodeTypeConfig } from "@/components/biblioteca/NodeTypeConfig";
import { useKnowledgeNodes, useKnowledgeStats, useLibraryBooks } from "@/hooks/useLibrary";
import { useLibraryFiles } from "@/hooks/useLibraryFiles";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import { BOOK_CATEGORY_CONFIG } from "@/data/curated-books";
import type { LibraryBook } from "@/types/library";
import { cn } from "@/lib/utils";
import {
  Search,
  BookOpen,
  Network,
  Layers,
  Loader2,
  X,
  SlidersHorizontal,
  Upload,
  FileText,
  RefreshCw,
} from "lucide-react";

// ─── Tab type ────────────────────────────────────────────────────────────────

type LibTab = "lecturas" | "archivos" | "grafo";

const TABS: Array<{ id: LibTab; label: string; Icon: React.ComponentType<{ className?: string }> }> = [
  { id: "lecturas",  label: "Lecturas",   Icon: BookOpen  },
  { id: "archivos",  label: "Mis Archivos", Icon: FileText },
  { id: "grafo",     label: "Grafo",      Icon: Network   },
];

// ─── Readings tab ─────────────────────────────────────────────────────────────

function ReadingsTab() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  const { books, loading, error } = useLibraryBooks();
  const { track } = useTrackInteraction();

  const filtered = books.filter((b) => {
    const matchCat = !activeCategory || b.category === activeCategory;
    const q = search.toLowerCase();
    const matchQ = !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      b.tags.some((t) => t.toLowerCase().includes(q));
    return matchCat && matchQ;
  });

  const categories = Array.from(new Set(books.map((b) => b.category)));

  return (
    <div className="flex h-full gap-0">
      {/* Left: book grid */}
      <div className={cn("flex flex-col min-w-0 transition-all duration-300", selectedBook ? "flex-[0_0_60%]" : "flex-1")}>
        <div className="px-6 pt-5 pb-4 space-y-3 border-b border-border/50 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar libros…"
              className="pl-9 h-9 text-sm"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all",
                !activeCategory ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Todos
            </button>
            {categories.map((cat) => {
              const cfg = BOOK_CATEGORY_CONFIG[cat];
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 transition-all",
                    activeCategory === cat ? cn(cfg.bg, cfg.color, cfg.border) : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">{filtered.length} libro{filtered.length !== 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && books.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium mb-1">Error al cargar libros</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  isSelected={selectedBook?.id === book.id}
                  onClick={() => {
                    const next = selectedBook?.id === book.id ? null : book;
                    setSelectedBook(next);
                    if (next) {
                      track("book.opened", {
                        targetId: `book::${book.id}`,
                        targetType: "book",
                      });
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: book detail */}
      <AnimatePresence>
        {selectedBook && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-[0_0_40%] min-w-[320px] max-w-[520px] border-l border-border"
          >
            <BookDetail book={selectedBook} onClose={() => setSelectedBook(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Files tab ────────────────────────────────────────────────────────────────

function FilesTab() {
  const { files, uploading, uploadError, uploadFile, deleteFile } = useLibraryFiles();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedFile = files.find((f) => f.id === selectedId) ?? null;

  const handleDelete = (id: string) => {
    deleteFile(id);
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <div className="flex h-full gap-0">
      {/* Left */}
      <div className={cn("flex flex-col min-w-0 transition-all duration-300", selectedFile ? "flex-[0_0_60%]" : "flex-1")}>
        <div className="px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold">Mis Archivos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {files.length > 0 ? `${files.length} archivo${files.length !== 1 ? "s" : ""}` : "Sin archivos aún"}
              </p>
            </div>
          </div>
          <FileUploadZone onUpload={uploadFile} uploading={uploading} error={uploadError} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Sube tu primer archivo</p>
              <p className="text-xs text-muted-foreground/60 mt-1 max-w-xs">
                PDF, TXT, Markdown o CSV. Los exploramos con IA para extraer ideas clave.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {files.map((file, i) => (
                <FileCard
                  key={file.id}
                  file={file}
                  index={i}
                  isSelected={selectedId === file.id}
                  onClick={() => setSelectedId((prev) => prev === file.id ? null : file.id)}
                  onDelete={() => handleDelete(file.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: file detail */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="flex-[0_0_40%] min-w-[320px] max-w-[520px] border-l border-border"
          >
            <FileDetail file={selectedFile} onClose={() => setSelectedId(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Graph tab (existing knowledge nodes) ─────────────────────────────────────

function formatSourceRef(ref: string): string {
  if (ref.startsWith("youtube:")) return `▶ ${ref.slice(8)}`;
  return ref;
}

function GraphTab() {
  const [rawSearch, setRawSearch] = useState("");
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showSourceFilter, setShowSourceFilter] = useState(false);

  const search = useDeferredValue(rawSearch);

  const { nodes, total, loading } = useKnowledgeNodes({
    search: search || undefined,
    nodeType: activeType || undefined,
    sourceRef: activeSource || undefined,
    limit: 80,
  });

  const { stats, loading: statsLoading } = useKnowledgeStats();
  const hasFilters = !!rawSearch || !!activeType || !!activeSource;
  const availableTypes = stats?.nodeTypes ?? [];

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNodeId((prev) => (prev === id ? null : id));
  }, []);

  const handleNavigate = useCallback((id: string) => {
    setSelectedNodeId(id);
  }, []);

  return (
    <div className="flex h-full gap-0">
      {/* Left */}
      <div className={cn("flex flex-col min-w-0 transition-all duration-300", selectedNodeId ? "flex-[0_0_60%]" : "flex-1")}>
        <div className="px-6 pt-5 pb-4 space-y-3 border-b border-border/50 shrink-0">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Nodos", value: stats?.totalNodes ?? 0, loading: statsLoading },
              { label: "Relaciones", value: stats?.totalRelationships ?? 0, loading: statsLoading },
              { label: "Tipos", value: stats?.nodeTypes.length ?? 0, loading: statsLoading },
            ].map(({ label, value, loading: l }) => (
              <div key={label} className="rounded-lg border border-border/40 bg-card/40 px-3 py-2">
                <p className="text-[10px] text-muted-foreground/60">{label}</p>
                {l ? (
                  <div className="h-4 w-8 bg-muted/40 rounded animate-pulse mt-1" />
                ) : (
                  <p className="text-sm font-bold tabular-nums">{value}</p>
                )}
              </div>
            ))}
          </div>

          {/* Search + source filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={rawSearch}
                onChange={(e) => setRawSearch(e.target.value)}
                placeholder="Buscar nodos…"
                className="pl-9 h-9 text-sm"
              />
              {rawSearch && (
                <button onClick={() => setRawSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {stats && stats.sourceRefs.length > 0 && (
              <Button variant={activeSource ? "default" : "outline"} size="sm" onClick={() => setShowSourceFilter((v) => !v)} className="gap-1.5 h-9 shrink-0">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Fuente
              </Button>
            )}
          </div>

          <AnimatePresence>
            {showSourceFilter && stats && stats.sourceRefs.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex flex-wrap gap-1.5 overflow-hidden">
                <button onClick={() => setActiveSource(null)} className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all", !activeSource ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                  Todas
                </button>
                {stats.sourceRefs.map((ref) => (
                  <button key={ref} onClick={() => setActiveSource(activeSource === ref ? null : ref)} className={cn("px-2.5 py-1 rounded-lg text-xs border transition-all", activeSource === ref ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                    {formatSourceRef(ref)}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Type tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button onClick={() => setActiveType(null)} className={cn("px-3 py-1 rounded-full text-xs font-medium border shrink-0 transition-all", !activeType ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground")}>
              Todos {!activeType && <span className="ml-1 tabular-nums">{total}</span>}
            </button>
            {availableTypes.map((type) => {
              const cfg = getNodeTypeConfig(type);
              const { Icon } = cfg;
              return (
                <button key={type} onClick={() => setActiveType(activeType === type ? null : type)} className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 transition-all", activeType === type ? cn(cfg.bg, cfg.text, cfg.border) : "border-border text-muted-foreground hover:text-foreground")}>
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              );
            })}
            {hasFilters && (
              <button onClick={() => { setRawSearch(""); setActiveType(null); setActiveSource(null); }} className="flex items-center gap-1 px-2 py-1 rounded-full text-xs text-muted-foreground hover:text-destructive border border-border hover:border-destructive/50 transition-all shrink-0">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading && nodes.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium mb-1">{hasFilters ? "Sin resultados" : "Grafo vacío"}</p>
              <p className="text-xs text-muted-foreground max-w-xs">
                {hasFilters ? "Prueba ajustando los filtros." : "Extrae textos o procesa videos en IA Mentor para poblar el grafo."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {nodes.map((node, i) => (
                <NodeCard key={node.id} node={node} index={i} isSelected={node.id === selectedNodeId} onClick={() => handleNodeClick(node.id)} />
              ))}
            </div>
          )}
          {loading && nodes.length > 0 && (
            <div className="flex justify-center pt-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Right: node detail */}
      <AnimatePresence>
        {selectedNodeId && (
          <div className="flex-[0_0_40%] min-w-[320px] max-w-[480px] border-l border-border">
            <NodeDetail nodeId={selectedNodeId} onClose={() => setSelectedNodeId(null)} onNavigate={handleNavigate} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<LibTab>("lecturas");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mx-6 -mb-6">
      {/* Header + tabs */}
      <div className="px-6 pt-5 pb-0 border-b border-border/50 shrink-0">
        <h1 className="text-xl font-heading font-bold mb-4">Biblioteca</h1>
        <div className="flex items-center gap-0">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
                activeTab === id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "lecturas"  && <ReadingsTab />}
        {activeTab === "archivos"  && <FilesTab />}
        {activeTab === "grafo"     && <GraphTab />}
      </div>
    </div>
  );
}

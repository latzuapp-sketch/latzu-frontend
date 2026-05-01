"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Brain,
  BookOpen,
  FileText,
  Target,
  MessageSquare,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import type { SearchResultItem } from "@/graphql/types";

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  string,
  { label: string; Icon: React.ElementType; color: string; bg: string }
> = {
  knowledge: { label: "Conocimiento", Icon: Brain,          color: "text-violet-400", bg: "bg-violet-500/10" },
  book:      { label: "Libros",       Icon: BookOpen,       color: "text-amber-400",  bg: "bg-amber-500/10"  },
  note:      { label: "Notas",        Icon: FileText,       color: "text-sky-400",    bg: "bg-sky-500/10"    },
  plan:      { label: "Planes",       Icon: Target,         color: "text-emerald-400",bg: "bg-emerald-500/10"},
  chat:      { label: "Chats",        Icon: MessageSquare,  color: "text-blue-400",   bg: "bg-blue-500/10"   },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { query, setQuery, results, loading, recentItems, addRecent, clearQuery } =
    useGlobalSearch();

  const isSearching = query.trim().length >= 2;

  // Flat list used for keyboard navigation
  const flatItems = useMemo((): SearchResultItem[] => {
    if (isSearching) return results;
    return recentItems.map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      resultType: r.resultType,
      snippet: "",
      metadata: null,
    })) as SearchResultItem[];
  }, [isSearching, results, recentItems]);

  // Grouped + offset-aware sections for rendering
  const sections = useMemo(() => {
    const groups: { type: string; items: SearchResultItem[]; startIndex: number }[] = [];
    if (!isSearching) return groups;
    const typeOrder = ["knowledge", "book", "note", "plan", "chat"];
    const byType: Record<string, SearchResultItem[]> = {};
    for (const item of results) {
      if (!byType[item.resultType]) byType[item.resultType] = [];
      byType[item.resultType].push(item);
    }
    let offset = 0;
    for (const type of typeOrder) {
      if (byType[type]?.length) {
        groups.push({ type, items: byType[type], startIndex: offset });
        offset += byType[type].length;
      }
    }
    return groups;
  }, [isSearching, results]);

  // Reset selection when query or results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, results]);

  // Autofocus on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      clearQuery();
      setSelectedIndex(0);
    }
  }, [open, clearQuery]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = flatItems[selectedIndex];
        if (item) navigate(item);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flatItems, selectedIndex, onClose]);

  function navigate(item: SearchResultItem) {
    addRecent(item);
    router.push(item.url);
    onClose();
  }

  const noResults = isSearching && !loading && results.length === 0;
  const showRecent = !isSearching && recentItems.length > 0;
  const showEmpty = !isSearching && recentItems.length === 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Palette */}
          <motion.div
            key="palette"
            initial={{ opacity: 0, scale: 0.96, y: -16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -16 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed left-1/2 top-[12%] -translate-x-1/2 z-50 w-full max-w-[580px] px-4"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0d0d11] shadow-2xl overflow-hidden">

              {/* Search input row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.07]">
                {loading ? (
                  <Loader2 className="w-4 h-4 text-white/30 animate-spin flex-shrink-0" />
                ) : (
                  <Search className="w-4 h-4 text-white/30 flex-shrink-0" />
                )}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Busca en todo tu workspace…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/25 outline-none"
                />
                {query && (
                  <button
                    onClick={clearQuery}
                    className="text-white/25 hover:text-white/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <kbd className="hidden sm:inline text-white/20 text-[10px] font-mono border border-white/10 rounded px-1.5 py-0.5">
                  Esc
                </kbd>
              </div>

              {/* Results area */}
              <div className="max-h-[400px] overflow-y-auto overscroll-contain py-1.5">

                {/* Recent items */}
                {showRecent && (
                  <div>
                    <SectionHeader label="Recientes" Icon={Clock} iconColor="text-white/25" />
                    {recentItems.slice(0, 6).map((r, i) => (
                      <ResultRow
                        key={r.id}
                        item={{ id: r.id, title: r.title, url: r.url, resultType: r.resultType, snippet: "", metadata: null } as SearchResultItem}
                        isSelected={selectedIndex === i}
                        onSelect={navigate}
                      />
                    ))}
                  </div>
                )}

                {/* Search results grouped by type */}
                {sections.map(({ type, items, startIndex }) => {
                  const config = TYPE_CONFIG[type];
                  if (!config) return null;
                  return (
                    <div key={type}>
                      <SectionHeader label={config.label} Icon={config.Icon} iconColor={config.color} />
                      {items.map((item, i) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          isSelected={selectedIndex === startIndex + i}
                          onSelect={navigate}
                        />
                      ))}
                    </div>
                  );
                })}

                {/* Empty state: no query */}
                {showEmpty && (
                  <div className="py-12 text-center">
                    <Search className="w-8 h-8 mx-auto mb-3 text-white/15" />
                    <p className="text-sm text-white/25">Empieza a escribir para buscar</p>
                    <p className="text-xs text-white/15 mt-1">Notas, libros, planes, conocimiento…</p>
                  </div>
                )}

                {/* No results */}
                {noResults && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-white/30">Sin resultados para "{query}"</p>
                  </div>
                )}
              </div>

              {/* Keyboard hint footer */}
              <div className="px-4 py-2 border-t border-white/[0.05] flex items-center gap-4 text-[10px] text-white/20">
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono border border-white/10 rounded px-1">↑↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono border border-white/10 rounded px-1">↵</kbd>
                  abrir
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="font-mono border border-white/10 rounded px-1">Esc</kbd>
                  cerrar
                </span>
                <span className="ml-auto">Latzu Search</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  Icon,
  iconColor,
}: {
  label: string;
  Icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 pt-3 pb-1">
      <Icon className={cn("w-3 h-3", iconColor)} />
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
        {label}
      </span>
    </div>
  );
}

function ResultRow({
  item,
  isSelected,
  onSelect,
}: {
  item: SearchResultItem;
  isSelected: boolean;
  onSelect: (item: SearchResultItem) => void;
}) {
  const config = TYPE_CONFIG[item.resultType];
  const Icon = config?.Icon ?? Search;

  return (
    <button
      onClick={() => onSelect(item)}
      className={cn(
        "w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors",
        isSelected ? "bg-white/[0.07]" : "hover:bg-white/[0.03]"
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
          config?.bg ?? "bg-white/10"
        )}
      >
        <Icon className={cn("w-3.5 h-3.5", config?.color ?? "text-white/50")} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/85 font-medium truncate leading-snug">
          {item.title}
        </p>
        {item.snippet && (
          <p className="text-xs text-white/35 leading-snug line-clamp-1 mt-0.5">
            {item.snippet}
          </p>
        )}
      </div>

      {/* Arrow (only when selected) */}
      {isSelected && (
        <ArrowRight className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
      )}
    </button>
  );
}

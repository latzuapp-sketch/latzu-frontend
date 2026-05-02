"use client";

/**
 * AutoFilterChips — YouTube-style horizontal chip row driven by the
 * auto-classifier's facets (category / domain / difficulty / top tags).
 *
 * Used at the top of every section in /brain so the user can slice their
 * knowledge by intelligent buckets without re-querying the backend on every
 * pick — chips operate on the items already loaded for the current section.
 *
 * Selection model: a single active facet at a time. Pass `value=null` for
 * "Todo" (the implicit first chip). The parent computes `available` from
 * the current item set, plus an optional `globalFilters` prop to surface
 * categories that exist in the broader graph (faded styling).
 */

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { KnowledgeFacet } from "@/graphql/types";
import { cn } from "@/lib/utils";

export type ChipFacet = "category" | "domain" | "difficulty" | "tag";

export interface ChipValue {
  facet: ChipFacet;
  value: string;
}

interface AutoFilterChipsProps {
  /** Facets visible right now (computed from currently rendered items). */
  available: { facet: ChipFacet; values: KnowledgeFacet[] }[];
  /** Currently selected chip, or null for "Todo". */
  active: ChipValue | null;
  onChange: (next: ChipValue | null) => void;
  /** Hide the row entirely if no facet has more than 1 value. */
  hideWhenEmpty?: boolean;
  /** Optional small label rendered before chips ("Categorías", etc). */
  label?: string;
  /** Tiny banner shown when classifier hasn't tagged anything yet. */
  unclassifiedHint?: boolean;
}

const FACET_LABELS: Record<ChipFacet, string> = {
  category: "Categoría",
  domain: "Área",
  difficulty: "Nivel",
  tag: "Tag",
};

const FACET_COLORS: Record<ChipFacet, string> = {
  category: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  domain: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  difficulty: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

export function AutoFilterChips({
  available,
  active,
  onChange,
  hideWhenEmpty = true,
  label,
  unclassifiedHint = false,
}: AutoFilterChipsProps) {
  const meaningful = available.filter((f) => f.values.length > 0);
  const totalChips = meaningful.reduce((acc, f) => acc + f.values.length, 0);

  if (hideWhenEmpty && totalChips === 0) {
    if (unclassifiedHint) {
      return (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 px-1">
          <Sparkles className="w-3 h-3" />
          La IA todavía está clasificando tus nodos. Los filtros aparecerán acá.
        </div>
      );
    }
    return null;
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
          {label}
        </span>
      )}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
        <Chip
          isActive={active === null}
          onClick={() => onChange(null)}
          className="bg-foreground/10 text-foreground border-foreground/20"
        >
          Todo
        </Chip>
        {meaningful.flatMap((facet) =>
          facet.values.map((v) => {
            const isActive =
              active?.facet === facet.facet && active?.value === v.value;
            return (
              <Chip
                key={`${facet.facet}-${v.value}`}
                isActive={isActive}
                onClick={() =>
                  onChange(isActive ? null : { facet: facet.facet, value: v.value })
                }
                className={FACET_COLORS[facet.facet]}
                title={FACET_LABELS[facet.facet]}
              >
                <span className="capitalize">{v.value}</span>
                <span className="ml-1 opacity-60 text-[10px]">{v.count}</span>
              </Chip>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Chip({
  isActive,
  onClick,
  className,
  children,
  title,
}: {
  isActive: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      title={title}
      className={cn(
        "shrink-0 rounded-full border text-[11px] px-2.5 py-1 leading-none transition-all whitespace-nowrap",
        "hover:brightness-110",
        isActive
          ? "ring-2 ring-offset-1 ring-offset-background ring-current shadow-sm"
          : "opacity-80 hover:opacity-100",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

// ─── Helpers (re-exported for callers) ───────────────────────────────────────

/**
 * Bucket a list of nodes into facet → value → count, restricted to nodes
 * actually visible right now. Returns the same shape AutoFilterChips wants.
 *
 * Use a generic so it works for KnowledgeNode, but we only read auto* fields.
 */
export function facetsFromNodes<
  N extends {
    autoCategory?: string | null;
    autoDomain?: string | null;
    autoDifficulty?: string | null;
    autoTags?: string | null;
  },
>(nodes: N[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const cats = new Map<string, number>();
  const doms = new Map<string, number>();
  const diffs = new Map<string, number>();
  const tags = new Map<string, number>();

  for (const n of nodes) {
    if (n.autoCategory) cats.set(n.autoCategory, (cats.get(n.autoCategory) ?? 0) + 1);
    if (n.autoDomain) doms.set(n.autoDomain, (doms.get(n.autoDomain) ?? 0) + 1);
    if (n.autoDifficulty) diffs.set(n.autoDifficulty, (diffs.get(n.autoDifficulty) ?? 0) + 1);
    if (n.autoTags) {
      try {
        const parsed = JSON.parse(n.autoTags);
        if (Array.isArray(parsed)) {
          for (const t of parsed) {
            if (typeof t === "string" && t) {
              tags.set(t, (tags.get(t) ?? 0) + 1);
            }
          }
        }
      } catch {
        /* ignore malformed */
      }
    }
  }

  const order = (m: Map<string, number>, top: number): KnowledgeFacet[] =>
    [...m.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, top)
      .map(([value, count]) => ({ value, count }));

  return [
    { facet: "category", values: order(cats, 12) },
    { facet: "domain", values: order(doms, 8) },
    { facet: "difficulty", values: order(diffs, 3) },
    { facet: "tag", values: order(tags, 12) },
  ];
}

/**
 * Apply a chip selection to any item that exposes auto* fields. Items
 * without classification yet are kept out of filtered views (they show
 * up under "Todo" which is the default unfiltered state).
 */
export function matchesChip<
  N extends {
    autoCategory?: string | null;
    autoDomain?: string | null;
    autoDifficulty?: string | null;
    autoTags?: string | null;
  },
>(node: N, active: ChipValue | null): boolean {
  if (!active) return true;
  switch (active.facet) {
    case "category":
      return node.autoCategory === active.value;
    case "domain":
      return node.autoDomain === active.value;
    case "difficulty":
      return node.autoDifficulty === active.value;
    case "tag": {
      if (!node.autoTags) return false;
      try {
        const parsed = JSON.parse(node.autoTags);
        return Array.isArray(parsed) && parsed.includes(active.value);
      } catch {
        return false;
      }
    }
  }
}

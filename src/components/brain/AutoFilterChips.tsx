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
import type { PlanningTask, ActionPlan } from "@/types/planning";
import type { LibraryBook, LibraryFile } from "@/types/library";
import type { GoalNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

export type ChipFacet = "category" | "domain" | "difficulty" | "tag" | "status" | "priority" | "ext" | "contentKind";

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
  status: "Estado",
  priority: "Prioridad",
  ext: "Tipo",
  contentKind: "Ver",
};

const FACET_COLORS: Record<ChipFacet, string> = {
  category: "bg-violet-500/10 text-violet-300 border-violet-500/30",
  domain: "bg-sky-500/10 text-sky-300 border-sky-500/30",
  difficulty: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  tag: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
  status: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  priority: "bg-orange-500/10 text-orange-300 border-orange-500/30",
  ext: "bg-teal-500/10 text-teal-300 border-teal-500/30",
  contentKind: "bg-pink-500/10 text-pink-300 border-pink-500/30",
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
                <span className="capitalize">{v.value.replace(/_/g, " ")}</span>
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
    default: return true;
  }
}

// ─── Per-type facet builders ──────────────────────────────────────────────────

function toFacetValues(
  map: Map<string, number>,
  sort?: (a: [string, number], b: [string, number]) => number,
  top = 15,
): KnowledgeFacet[] {
  return [...map.entries()]
    .sort(sort ?? ((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])))
    .slice(0, top)
    .map(([value, count]) => ({ value, count }));
}

export function facetsFromTasks(tasks: PlanningTask[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const statuses = new Map<string, number>();
  const priorities = new Map<string, number>();
  for (const t of tasks) {
    statuses.set(t.status, (statuses.get(t.status) ?? 0) + 1);
    if (t.abcdePriority) priorities.set(t.abcdePriority, (priorities.get(t.abcdePriority) ?? 0) + 1);
  }
  return [
    { facet: "status", values: toFacetValues(statuses) },
    { facet: "priority", values: toFacetValues(priorities, (a, b) => a[0].localeCompare(b[0])) },
  ];
}

export function facetsFromPlans(plans: ActionPlan[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const statuses = new Map<string, number>();
  for (const p of plans) statuses.set(p.status, (statuses.get(p.status) ?? 0) + 1);
  return [{ facet: "status", values: toFacetValues(statuses) }];
}

export function facetsFromGoals(goals: GoalNode[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const statuses = new Map<string, number>();
  for (const g of goals) statuses.set(g.status, (statuses.get(g.status) ?? 0) + 1);
  return [{ facet: "status", values: toFacetValues(statuses) }];
}

export function facetsFromFiles(files: LibraryFile[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const exts = new Map<string, number>();
  for (const f of files) {
    const ext = (f.ext ?? "").toLowerCase() || "otro";
    exts.set(ext, (exts.get(ext) ?? 0) + 1);
  }
  return [{ facet: "ext", values: toFacetValues(exts) }];
}

export function facetsFromBooks(books: LibraryBook[]): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const cats = new Map<string, number>();
  const tags = new Map<string, number>();
  for (const b of books) {
    if (b.category) cats.set(b.category, (cats.get(b.category) ?? 0) + 1);
    for (const tag of b.tags ?? []) tags.set(tag, (tags.get(tag) ?? 0) + 1);
  }
  return [
    { facet: "category", values: toFacetValues(cats) },
    { facet: "tag", values: toFacetValues(tags, undefined, 10) },
  ];
}

export function facetsFromAllContent(counts: {
  goals: number; plans: number; tasks: number; notes: number;
  files: number; books: number; workspaces: number;
}): { facet: ChipFacet; values: KnowledgeFacet[] }[] {
  const values: KnowledgeFacet[] = [
    counts.goals > 0       && { value: "goals",      count: counts.goals },
    counts.plans > 0       && { value: "plans",       count: counts.plans },
    counts.tasks > 0       && { value: "tasks",       count: counts.tasks },
    counts.notes > 0       && { value: "notes",       count: counts.notes },
    counts.files > 0       && { value: "files",       count: counts.files },
    counts.books > 0       && { value: "books",       count: counts.books },
    counts.workspaces > 0  && { value: "workspaces",  count: counts.workspaces },
  ].filter(Boolean) as KnowledgeFacet[];
  return values.length >= 2 ? [{ facet: "contentKind", values }] : [];
}

// ─── Per-type chip matchers ───────────────────────────────────────────────────

export function matchesChipTask(task: PlanningTask, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "status") return task.status === active.value;
  if (active.facet === "priority") return task.abcdePriority === active.value;
  return true;
}

export function matchesChipPlan(plan: ActionPlan, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "status") return plan.status === active.value;
  return true;
}

export function matchesChipGoal(goal: GoalNode, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "status") return goal.status === active.value;
  return true;
}

export function matchesChipFile(file: LibraryFile, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "ext") return (file.ext ?? "").toLowerCase() === active.value;
  return true;
}

export function matchesChipBook(book: LibraryBook, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "category") return book.category === active.value;
  if (active.facet === "tag") return book.tags?.includes(active.value) ?? false;
  return true;
}

/** For the "all" view: returns true if this content-type group should be visible. */
export function matchesChipContentKind(kind: string, active: ChipValue | null): boolean {
  if (!active) return true;
  if (active.facet === "contentKind") return active.value === kind;
  return true;
}

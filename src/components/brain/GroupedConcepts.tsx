"use client";

/**
 * GroupedConcepts — renders concept KnowledgeNodes as a list of lists.
 *
 * Outer list: collapsible sections, one per group. Grouping strategy:
 *   1. If at least one node has `autoCategory` (set by node_classifier),
 *      bucket by that category — this is the intelligent grouping.
 *   2. Otherwise fall back to the agent's `lifeAreas` (one bucket per area
 *      with `node_ids`).
 *   3. Anything left unbucketed lands in "Sin clasificar".
 *
 * Inner list: a responsive grid of AdaptiveItemCard.
 *
 * Empty groups are omitted. Sections are sorted by node count desc,
 * with the unclassified bucket pinned to the bottom.
 */

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Compass, FolderOpen } from "lucide-react";
import { AdaptiveItemCard } from "@/components/brain/AdaptiveItemCard";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

interface LifeAreaParsed {
  name: string;
  description?: string;
  node_ids?: string[];
  strength?: number;
}

interface GroupedConceptsProps {
  nodes: KnowledgeNode[];
  lifeAreas: LifeAreaParsed[];
  onPick: (node: KnowledgeNode) => void;
}

interface Group {
  key: string;
  name: string;
  description?: string;
  nodes: KnowledgeNode[];
  classified: boolean;   // false → "Sin clasificar"
}

/** Bucket each concept by its auto-classifier category. */
function groupByAutoCategory(nodes: KnowledgeNode[]): Group[] {
  const buckets = new Map<string, KnowledgeNode[]>();
  const leftover: KnowledgeNode[] = [];
  for (const n of nodes) {
    const cat = n.autoCategory?.trim();
    if (cat) {
      const arr = buckets.get(cat) ?? [];
      arr.push(n);
      buckets.set(cat, arr);
    } else {
      leftover.push(n);
    }
  }
  const groups: Group[] = [...buckets.entries()].map(([name, ns]) => ({
    key: `cat::${name}`,
    name,
    nodes: ns,
    classified: true,
  }));
  groups.sort((a, b) => b.nodes.length - a.nodes.length);
  if (leftover.length > 0) {
    groups.push({
      key: "unsorted",
      name: "Sin clasificar",
      description: "La IA todavía no clasificó estos nodos.",
      nodes: leftover,
      classified: false,
    });
  }
  return groups;
}

/** Bucket each concept into the first life area whose node_ids include it. */
function groupByArea(nodes: KnowledgeNode[], lifeAreas: LifeAreaParsed[]): Group[] {
  const placed = new Set<string>();
  const groups: Group[] = [];

  // Pre-build a node lookup so we resolve node_ids to existing nodes.
  const byId = new Map(nodes.map((n) => [n.id, n]));

  // Sort areas by strength (LLM-provided), then by node_ids count.
  const sortedAreas = [...lifeAreas].sort((a, b) => {
    const sa = a.strength ?? 0;
    const sb = b.strength ?? 0;
    if (sb !== sa) return sb - sa;
    return (b.node_ids?.length ?? 0) - (a.node_ids?.length ?? 0);
  });

  for (const area of sortedAreas) {
    const ids = area.node_ids ?? [];
    const inArea: KnowledgeNode[] = [];
    for (const id of ids) {
      if (placed.has(id)) continue;
      const n = byId.get(id);
      if (!n) continue;
      inArea.push(n);
      placed.add(id);
    }
    if (inArea.length > 0) {
      groups.push({
        key: `area::${area.name}`,
        name: area.name,
        description: area.description,
        nodes: inArea,
        classified: true,
      });
    }
  }

  // Anything left over → "Sin clasificar"
  const leftover = nodes.filter((n) => !placed.has(n.id));
  if (leftover.length > 0) {
    groups.push({
      key: "unsorted",
      name: "Sin clasificar",
      description: "El agente todavía no agrupó estos conceptos en un área.",
      nodes: leftover,
      classified: false,
    });
  }

  // Sort: classified groups first by node count desc, unclassified pinned last.
  groups.sort((a, b) => {
    if (a.classified !== b.classified) return a.classified ? -1 : 1;
    return b.nodes.length - a.nodes.length;
  });

  return groups;
}

export function GroupedConcepts({ nodes, lifeAreas, onPick }: GroupedConceptsProps) {
  const groups = useMemo(() => {
    // Prefer auto-classifier grouping when at least one node has been tagged.
    const anyClassified = nodes.some((n) => !!n.autoCategory);
    return anyClassified ? groupByAutoCategory(nodes) : groupByArea(nodes, lifeAreas);
  }, [nodes, lifeAreas]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const toggle = (key: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (groups.length === 0) return null;

  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const isCollapsed = collapsed.has(g.key);
        const Icon = g.classified ? Compass : FolderOpen;
        const accent = g.classified ? "text-sky-300" : "text-muted-foreground/60";
        return (
          <section key={g.key} className="space-y-2">
            <button
              onClick={() => toggle(g.key)}
              className="w-full text-left flex items-start gap-2 px-1 py-1 rounded-md hover:bg-muted/30 transition-colors group"
            >
              {isCollapsed
                ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
                : <ChevronDown  className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />}
              <Icon className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", accent)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3 className={cn(
                    "text-sm font-semibold leading-snug truncate",
                    g.classified ? "text-foreground" : "text-muted-foreground/80"
                  )}>
                    {g.name}
                  </h3>
                  <span className="text-[10px] text-muted-foreground/60 shrink-0">
                    {g.nodes.length} {g.nodes.length === 1 ? "concepto" : "conceptos"}
                  </span>
                </div>
                {g.description && !isCollapsed && (
                  <p className="text-[11px] text-muted-foreground/70 leading-snug mt-0.5">
                    {g.description}
                  </p>
                )}
              </div>
            </button>
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pl-5">
                {g.nodes.map((node) => (
                  <AdaptiveItemCard
                    key={`grp-node-${node.id}`}
                    node={node}
                    onClick={() => onPick(node)}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

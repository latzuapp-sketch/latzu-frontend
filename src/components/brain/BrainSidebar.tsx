"use client";

/**
 * BrainSidebar — Notion-like tree, organized by the agent's signals.
 *
 * Sections, in order of importance for daily use:
 *   1. Recientes        — last 10 nodes (recency signal)
 *   2. Caliente ahora   — momentumTopics from UserModel
 *   3. Áreas de vida    — auto-detected LifeAreas (agent clustering)
 *   4. Mis spaces       — user-created workspaces
 *   5. Por tipo         — type breakdown
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  Sparkles, Clock, Flame, Compass, Layers, ChevronRight, Brain,
  StickyNote, BookOpen, Lightbulb, User, Calendar, Globe,
  Play, FileText, ListTodo,
} from "lucide-react";
import { useUserModel } from "@/hooks/useOrganizerAgent";
import { useWorkspaces } from "@/hooks/useWorkspace";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrainSelection =
  | { kind: "all" }
  | { kind: "recent" }
  | { kind: "knowledge" }
  | { kind: "notes" }
  | { kind: "tasks" }
  | { kind: "pages" }
  | { kind: "topic"; topic: string }
  | { kind: "lifeArea"; area: string }
  | { kind: "workspace"; id: string; title: string }
  | { kind: "type"; nodeType: string };

interface SidebarProps {
  nodes: KnowledgeNode[];
  noteCount: number;
  taskCount: number;
  selection: BrainSelection;
  onSelect: (s: BrainSelection) => void;
}

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

const TYPE_ICON: Record<string, React.ElementType> = {
  note: StickyNote, book: BookOpen, concept: Lightbulb, entity: Lightbulb,
  person: User, event: Calendar, web: Globe, video: Play, file: FileText,
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label, count }: { icon: React.ElementType; label: string; count?: number }) {
  return (
    <div className="px-2 py-1.5 flex items-center gap-1.5">
      <Icon className="w-3 h-3 text-muted-foreground/60" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex-1">
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[10px] text-muted-foreground/40">{count}</span>
      )}
    </div>
  );
}

// ─── Tree row ─────────────────────────────────────────────────────────────────

function TreeRow({
  label, icon, count, isActive, onClick, indent = 0, accent,
}: {
  label: string;
  icon?: React.ElementType;
  count?: number;
  isActive: boolean;
  onClick: () => void;
  indent?: number;
  accent?: string;
}) {
  const Icon = icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-2 py-1.5 rounded-md flex items-center gap-1.5 transition-colors text-xs",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-foreground/70 hover:bg-muted/40 hover:text-foreground"
      )}
      style={{ paddingLeft: `${0.5 + indent * 0.75}rem` }}
    >
      {Icon ? <Icon className={cn("w-3 h-3 shrink-0", accent ?? (isActive ? "text-primary" : "text-muted-foreground/60"))} /> : <ChevronRight className="w-3 h-3 shrink-0 opacity-30" />}
      <span className="truncate flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <span className={cn("text-[10px]", isActive ? "text-primary/70" : "text-muted-foreground/40")}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export function BrainSidebar({ nodes, noteCount, taskCount, selection, onSelect }: SidebarProps) {
  const { userModel } = useUserModel();
  const { workspaces } = useWorkspaces();

  const lifeAreas = useMemo(
    () => safeJsonArray<{ name: string; node_ids?: string[] }>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );
  const momentumTopics = useMemo(
    () => safeJsonArray<string>(userModel?.momentumTopics).slice(0, 6),
    [userModel?.momentumTopics]
  );
  const staleAreas = useMemo(
    () => safeJsonArray<string>(userModel?.staleAreas).slice(0, 4),
    [userModel?.staleAreas]
  );

  // Type breakdown
  const typeCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of nodes) {
      m.set(n.type, (m.get(n.type) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const isActive = (s: BrainSelection): boolean => {
    if (selection.kind !== s.kind) return false;
    if (s.kind === "topic") return selection.kind === "topic" && selection.topic === s.topic;
    if (s.kind === "lifeArea") return selection.kind === "lifeArea" && selection.area === s.area;
    if (s.kind === "workspace") return selection.kind === "workspace" && selection.id === s.id;
    if (s.kind === "type") return selection.kind === "type" && selection.nodeType === s.nodeType;
    return true;
  };

  return (
    <aside className="w-64 shrink-0 border-r border-border/40 bg-card/20 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-heading font-bold">Tu enciclopedia</span>
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 text-foreground/80">
        {/* All / Recent quick links */}
        <div className="space-y-0.5">
          <TreeRow label="Todo" icon={Brain} count={nodes.length + noteCount + taskCount} isActive={isActive({ kind: "all" })} onClick={() => onSelect({ kind: "all" })} />
          <TreeRow label="Recientes" icon={Clock} isActive={isActive({ kind: "recent" })} onClick={() => onSelect({ kind: "recent" })} />
        </div>

        {/* Content kinds — what the user creates */}
        <div>
          <SectionHeader icon={Layers} label="Mi contenido" />
          <div className="space-y-0.5">
            <TreeRow label="Conocimiento" icon={Lightbulb} count={nodes.length} isActive={isActive({ kind: "knowledge" })} onClick={() => onSelect({ kind: "knowledge" })} />
            <TreeRow label="Notas" icon={StickyNote} count={noteCount} isActive={isActive({ kind: "notes" })} onClick={() => onSelect({ kind: "notes" })} accent="text-yellow-400" />
            <TreeRow label="Tareas" icon={ListTodo} count={taskCount} isActive={isActive({ kind: "tasks" })} onClick={() => onSelect({ kind: "tasks" })} accent="text-primary" />
            <TreeRow label="Spaces" icon={Layers} isActive={isActive({ kind: "pages" })} onClick={() => onSelect({ kind: "pages" })} accent="text-indigo-400" />
          </div>
        </div>

        {/* Hot topics from agent's UserModel */}
        {momentumTopics.length > 0 && (
          <div>
            <SectionHeader icon={Flame} label="Caliente ahora" count={momentumTopics.length} />
            <div className="space-y-0.5">
              {momentumTopics.map((topic) => (
                <TreeRow
                  key={topic}
                  label={topic}
                  icon={Flame}
                  isActive={isActive({ kind: "topic", topic })}
                  onClick={() => onSelect({ kind: "topic", topic })}
                  accent="text-amber-400"
                />
              ))}
            </div>
          </div>
        )}

        {/* Auto-detected life areas */}
        {lifeAreas.length > 0 && (
          <div>
            <SectionHeader icon={Compass} label="Áreas de vida" count={lifeAreas.length} />
            <div className="space-y-0.5">
              {lifeAreas.map((area) => (
                <TreeRow
                  key={area.name}
                  label={area.name}
                  icon={Compass}
                  count={area.node_ids?.length}
                  isActive={isActive({ kind: "lifeArea", area: area.name })}
                  onClick={() => onSelect({ kind: "lifeArea", area: area.name })}
                  accent="text-sky-400"
                />
              ))}
            </div>
          </div>
        )}

        {/* User workspaces */}
        {workspaces.length > 0 && (
          <div>
            <SectionHeader icon={Layers} label="Mis spaces" count={workspaces.length} />
            <div className="space-y-0.5">
              {workspaces.map((w) => (
                <TreeRow
                  key={w.id}
                  label={`${w.icon} ${w.title}`}
                  isActive={isActive({ kind: "workspace", id: w.id, title: w.title })}
                  onClick={() => onSelect({ kind: "workspace", id: w.id, title: w.title })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Type breakdown */}
        {typeCounts.length > 0 && (
          <div>
            <SectionHeader icon={Layers} label="Por tipo" count={typeCounts.length} />
            <div className="space-y-0.5">
              {typeCounts.slice(0, 8).map(([t, count]) => {
                const Icon = TYPE_ICON[t] ?? Lightbulb;
                return (
                  <TreeRow
                    key={t}
                    label={t}
                    icon={Icon}
                    count={count}
                    isActive={isActive({ kind: "type", nodeType: t })}
                    onClick={() => onSelect({ kind: "type", nodeType: t })}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Stale (agent suggests revisit) */}
        {staleAreas.length > 0 && (
          <div>
            <SectionHeader icon={Sparkles} label="Para revisitar" count={staleAreas.length} />
            <div className="space-y-0.5 px-2 py-1">
              {staleAreas.map((s) => (
                <p key={s} className="text-[11px] text-muted-foreground/70 italic leading-snug">
                  {s}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-2.5 border-t border-border/30 shrink-0">
        <Link
          href="/agent"
          className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          <Sparkles className="w-3 h-3" />
          Lo ordena tu agente · ver más
        </Link>
      </div>
    </aside>
  );
}

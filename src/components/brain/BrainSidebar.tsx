"use client";

/**
 * BrainSidebar — Notion-like tree.
 *
 * Two layout modes:
 *   1. Static default — sections below, used when the agent hasn't produced a
 *      custom layout yet.
 *   2. Dynamic agent layout — when `userModel.brainTreeLayout` is non-empty,
 *      the agent's sections override the defaults (Phase 3 / "B" — agent
 *      reorganizes the tree based on the user).
 *
 * Default sections (in order of importance for daily use):
 *   - Todo / Recientes
 *   - Mi contenido      → Planes, Metas, Tareas, Notas, Archivos, Spaces
 *   - Estudio           → Flashcards, Quizzes, Lecturas
 *   - Conocimiento      → Conceptos
 *   - Áreas de vida     → auto-detected by agent
 *   - Mis spaces        → user-created workspaces (direct links)
 *   - Por tipo          → type breakdown of knowledge nodes
 *   - Para revisitar    → agent-detected stale areas
 */

import { useMemo } from "react";
import Link from "next/link";
import {
  Sparkles, Clock, Compass, Layers, ChevronRight, Brain,
  StickyNote, BookOpen, Lightbulb, User, Calendar, Globe,
  Play, FileText, ListTodo, Target, Folder, GraduationCap,
  ClipboardCheck, Layers3,
} from "lucide-react";
import { useUserModel } from "@/hooks/useOrganizerAgent";
import { useWorkspaces } from "@/hooks/useWorkspace";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type BrainSelection =
  // Top-level
  | { kind: "all" }
  | { kind: "recent" }
  | { kind: "mentor" }          // unified mentor panel: focus + goals + signals
  // Mi contenido
  | { kind: "plans" }
  | { kind: "goals" }
  | { kind: "tasks" }
  | { kind: "notes" }
  | { kind: "files" }
  | { kind: "pages" }
  // Estudio
  | { kind: "flashcards" }
  | { kind: "quizzes" }
  | { kind: "readings" }
  // Conocimiento
  | { kind: "knowledge" }       // concepts (knowledge nodes excluding books)
  | { kind: "books" }           // alias used by /library — kept for grid filters
  // Agent-driven
  | { kind: "topic"; topic: string }
  | { kind: "lifeArea"; area: string }
  | { kind: "workspace"; id: string; title: string }
  | { kind: "type"; nodeType: string };

interface SidebarProps {
  nodes: KnowledgeNode[];
  noteCount: number;
  taskCount: number;
  bookCount: number;
  planCount: number;
  goalCount: number;
  fileCount: number;
  deckCount: number;
  quizCount: number;
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

/** Schema for a section the agent dynamically produced. */
interface AgentSection {
  name: string;
  icon?: string;        // semantic icon name (mapped client-side)
  description?: string;
  items: Array<{ kind: string; label?: string; topic?: string; area?: string; nodeType?: string; workspaceId?: string }>;
}

/** Map an icon name from the agent to a lucide component. */
function iconFor(name: string | undefined): React.ElementType {
  switch ((name ?? "").toLowerCase()) {
    case "target":     return Target;
    case "tasks":      return ListTodo;
    case "notes":      return StickyNote;
    case "files":      return Folder;
    case "spaces":
    case "pages":      return Layers;
    case "study":
    case "graduation": return GraduationCap;
    case "flashcards": return Layers3;
    case "quiz":
    case "quizzes":    return ClipboardCheck;
    case "books":
    case "readings":   return BookOpen;
    case "knowledge":
    case "concept":    return Lightbulb;
    case "compass":
    case "lifearea":   return Compass;
    case "sparkles":   return Sparkles;
    case "clock":      return Clock;
    default:           return Brain;
  }
}

/** Map an agent item kind to a BrainSelection. */
function selectionForAgentItem(item: AgentSection["items"][number]): BrainSelection | null {
  switch (item.kind) {
    case "plans":      return { kind: "plans" };
    case "goals":      return { kind: "goals" };
    case "tasks":      return { kind: "tasks" };
    case "notes":      return { kind: "notes" };
    case "files":      return { kind: "files" };
    case "pages":      return { kind: "pages" };
    case "flashcards": return { kind: "flashcards" };
    case "quizzes":    return { kind: "quizzes" };
    case "readings":
    case "books":      return { kind: "readings" };
    case "knowledge":  return { kind: "knowledge" };
    case "topic":      return item.topic ? { kind: "topic", topic: item.topic } : null;
    case "lifeArea":   return item.area ? { kind: "lifeArea", area: item.area } : null;
    case "workspace":  return item.workspaceId ? { kind: "workspace", id: item.workspaceId, title: item.label ?? "Space" } : null;
    case "type":       return item.nodeType ? { kind: "type", nodeType: item.nodeType } : null;
    default:           return null;
  }
}

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

export function BrainSidebar({
  nodes, noteCount, taskCount, bookCount, planCount, goalCount, fileCount,
  deckCount, quizCount, selection, onSelect,
}: SidebarProps) {
  const { userModel } = useUserModel();
  const { workspaces } = useWorkspaces();

  const lifeAreas = useMemo(
    () => safeJsonArray<{ name: string; node_ids?: string[] }>(userModel?.lifeAreas),
    [userModel?.lifeAreas]
  );
  const staleAreas = useMemo(
    () => safeJsonArray<string>(userModel?.staleAreas).slice(0, 4),
    [userModel?.staleAreas]
  );
  const agentLayout = useMemo(
    () => safeJsonArray<AgentSection>(userModel?.brainTreeLayout),
    [userModel?.brainTreeLayout]
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
    return true;  // single-instance kinds
  };

  const conceptsCount = nodes.length - bookCount;
  const useAgentLayout = agentLayout.length > 0;

  return (
    <aside className="w-64 shrink-0 border-r border-border/40 bg-card/20 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm font-heading font-bold">Mi conocimiento</span>
          {useAgentLayout && (
            <span
              className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border border-violet-500/30 bg-violet-500/10 text-violet-300"
              title="Tu agente reorganizó este árbol según cómo trabajás"
            >
              <Sparkles className="w-2.5 h-2.5" />
              IA
            </span>
          )}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 text-foreground/80">
        {/* Always-visible quick links */}
        <div className="space-y-0.5">
          <TreeRow label="Mi mentor" icon={Sparkles} isActive={isActive({ kind: "mentor" })} onClick={() => onSelect({ kind: "mentor" })} />
          <TreeRow label="Todo" icon={Brain} count={planCount + goalCount + taskCount + noteCount} isActive={isActive({ kind: "all" })} onClick={() => onSelect({ kind: "all" })} />
          <TreeRow label="Recientes" icon={Clock} isActive={isActive({ kind: "recent" })} onClick={() => onSelect({ kind: "recent" })} />
        </div>

        {useAgentLayout ? (
          // ── Agent-driven layout ─────────────────────────────────────────────
          agentLayout.map((section) => (
            <div key={section.name}>
              <SectionHeader icon={iconFor(section.icon)} label={section.name} />
              <div className="space-y-0.5">
                {section.items.map((it, idx) => {
                  const sel = selectionForAgentItem(it);
                  if (!sel) return null;
                  return (
                    <TreeRow
                      key={`${section.name}-${idx}`}
                      label={it.label ?? it.topic ?? it.area ?? it.nodeType ?? it.kind}
                      icon={iconFor(it.kind)}
                      isActive={isActive(sel)}
                      onClick={() => onSelect(sel)}
                    />
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          // ── Default static layout ──────────────────────────────────────────
          <>
            {/* Mi contenido — what the user is growing with the agent */}
            <div>
              <SectionHeader icon={Layers} label="Mi contenido" />
              <div className="space-y-0.5">
                <TreeRow label="Planes"   icon={Target}      count={planCount}  isActive={isActive({ kind: "plans"  })} onClick={() => onSelect({ kind: "plans"  })} accent="text-emerald-400" />
                <TreeRow label="Metas"    icon={Target}      count={goalCount}  isActive={isActive({ kind: "goals"  })} onClick={() => onSelect({ kind: "goals"  })} accent="text-rose-400" />
                <TreeRow label="Tareas"   icon={ListTodo}    count={taskCount}  isActive={isActive({ kind: "tasks"  })} onClick={() => onSelect({ kind: "tasks"  })} accent="text-primary" />
                <TreeRow label="Notas"    icon={StickyNote}  count={noteCount}  isActive={isActive({ kind: "notes"  })} onClick={() => onSelect({ kind: "notes"  })} accent="text-yellow-400" />
                <TreeRow label="Archivos" icon={Folder}      count={fileCount}  isActive={isActive({ kind: "files"  })} onClick={() => onSelect({ kind: "files"  })} accent="text-cyan-400" />
                <TreeRow label="Spaces"   icon={Layers}      isActive={isActive({ kind: "pages"  })} onClick={() => onSelect({ kind: "pages"  })} accent="text-indigo-400" />
              </div>
            </div>

            {/* Estudio — flashcards / quizzes / readings */}
            <div>
              <SectionHeader icon={GraduationCap} label="Estudio" />
              <div className="space-y-0.5">
                <TreeRow label="Flashcards" icon={Layers3}         count={deckCount}  isActive={isActive({ kind: "flashcards" })} onClick={() => onSelect({ kind: "flashcards" })} accent="text-teal-400" />
                <TreeRow label="Quizzes"    icon={ClipboardCheck}  count={quizCount}  isActive={isActive({ kind: "quizzes"    })} onClick={() => onSelect({ kind: "quizzes"    })} accent="text-amber-400" />
                <TreeRow label="Lecturas"   icon={BookOpen}        count={bookCount}  isActive={isActive({ kind: "readings"   })} onClick={() => onSelect({ kind: "readings"   })} accent="text-emerald-300" />
              </div>
            </div>

            {/* Conocimiento — raw concepts, separate from study material */}
            <div>
              <SectionHeader icon={Lightbulb} label="Conocimiento" />
              <div className="space-y-0.5">
                <TreeRow label="Conceptos" icon={Lightbulb} count={conceptsCount} isActive={isActive({ kind: "knowledge" })} onClick={() => onSelect({ kind: "knowledge" })} accent="text-indigo-300" />
              </div>
            </div>
          </>
        )}

        {/* Auto-detected life areas — always shown when agent has produced them */}
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

        {/* User workspaces — direct shortcuts */}
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

        {/* Type breakdown — only on default layout */}
        {!useAgentLayout && typeCounts.length > 0 && (
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

        {/* Stale areas (agent suggests revisit) */}
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

"use client";

/**
 * BrainAgentPanel — slide-out helper panel inside /brain.
 *
 * Right-side panel that:
 *   - Shows what the agent currently knows about the user (focus + hot topics)
 *   - Surfaces pending agent proposals (the user can apply/dismiss in-place)
 *   - Offers quick jumps to topics the agent flagged as caliente
 *   - Has a "Ask your agent" button that opens the global ChatOverlay (Cmd+J)
 *
 * Lives independent of the page selection so the user can keep navigating
 * with the agent always available on the side.
 */

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Sparkles, X, Flame, Compass, ArrowRight, MessageSquare,
  CheckCircle2, AlertTriangle, Lightbulb, ChevronRight,
} from "lucide-react";
import { useUserModel, useAgentActions, useActionMutations } from "@/hooks/useOrganizerAgent";
import type { AgentAction, AgentActionType } from "@/graphql/types";
import type { BrainSelection } from "@/components/brain/BrainSidebar";
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

const ACTION_ICON: Partial<Record<AgentActionType, React.ElementType>> = {
  insight: Sparkles,
  suggestion: Lightbulb,
  warning: AlertTriangle,
  reminder: Sparkles,
  surface_connection: Sparkles,
  create_synthesis_node: Sparkles,
  link_nodes: Sparkles,
  merge_nodes: Sparkles,
  build_hierarchy: Sparkles,
};

// ─── Slide-out panel ─────────────────────────────────────────────────────────

interface PanelProps {
  open: boolean;
  onClose: () => void;
  selection: BrainSelection;
  onJumpTopic: (topic: string) => void;
  onJumpArea: (area: string) => void;
}

export function BrainAgentPanel({ open, onClose, selection, onJumpTopic, onJumpArea }: PanelProps) {
  const { userModel } = useUserModel();
  const { actions, refetch } = useAgentActions({ status: "pending", limit: 10 });
  const { apply, dismiss, loading: mutating } = useActionMutations();

  const proposals = useMemo(
    () =>
      actions
        .filter((a) => a.visibility !== "silent" && a.type !== "clarification_question")
        .slice(0, 4),
    [actions]
  );
  const momentumTopics = useMemo(
    () => safeJsonArray<string>(userModel?.momentumTopics).slice(0, 5),
    [userModel?.momentumTopics]
  );
  const lifeAreas = useMemo(
    () => safeJsonArray<{ name: string }>(userModel?.lifeAreas).slice(0, 4),
    [userModel?.lifeAreas]
  );

  // Hint about current selection so the panel feels context-aware
  const contextHint = useMemo(() => {
    switch (selection.kind) {
      case "all": return "Estás viendo todo. Te muestro lo más importante.";
      case "recent": return "Lo último que tiraste — te marqué lo conectado.";
      case "knowledge": return "Conocimiento puro. Buscá conexiones acá.";
      case "notes": return "Tus notas. Te puedo sugerir agruparlas.";
      case "tasks": return "Tus tareas. Mirá cuáles puedo reordenar.";
      case "pages": return "Tus spaces — pensá en cuál van las nuevas ideas.";
      case "topic": return `Mostrando "${selection.topic}". Esto está caliente.`;
      case "lifeArea": return `Área "${selection.area}". Acá hay continuidad.`;
      case "workspace": return `Space "${selection.title}". Escojo qué resaltar.`;
      case "type": return `Tipo "${selection.nodeType}". Listado puro por categoría.`;
    }
  }, [selection]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="brain-agent-panel"
          initial={{ x: 360, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 360, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed top-16 right-0 bottom-0 w-[360px] z-30 bg-card/95 backdrop-blur-xl border-l border-border/50 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/40 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">Tu agente</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{contextHint}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Current focus */}
            {userModel?.currentFocus && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2">
                  Foco actual
                </p>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs leading-snug text-foreground/90">{userModel.currentFocus}</p>
                </div>
              </section>
            )}

            {/* Proposals */}
            <section>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-primary" />
                Te propongo ({proposals.length})
              </p>
              {proposals.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/60 italic px-1">
                  Sin propuestas pendientes ahora.
                </p>
              ) : (
                <div className="space-y-2">
                  {proposals.map((a) => {
                    const Icon = ACTION_ICON[a.type] ?? Sparkles;
                    return (
                      <ProposalCard
                        key={a.id}
                        action={a}
                        Icon={Icon}
                        mutating={mutating}
                        onApply={async () => { await apply(a.id); refetch(); }}
                        onDismiss={async () => { await dismiss(a.id); refetch(); }}
                      />
                    );
                  })}
                </div>
              )}
            </section>

            {/* Hot topics */}
            {momentumTopics.length > 0 && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                  <Flame className="w-3 h-3 text-amber-400" />
                  Caliente ahora
                </p>
                <div className="space-y-1">
                  {momentumTopics.map((t) => (
                    <button
                      key={t}
                      onClick={() => onJumpTopic(t)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted/40 transition-colors flex items-center gap-2 group"
                    >
                      <Flame className="w-3 h-3 text-amber-400/70 shrink-0" />
                      <span className="flex-1 truncate">{t}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Life areas */}
            {lifeAreas.length > 0 && (
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 flex items-center gap-1.5">
                  <Compass className="w-3 h-3 text-sky-400" />
                  Áreas de vida
                </p>
                <div className="space-y-1">
                  {lifeAreas.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => onJumpArea(a.name)}
                      className="w-full text-left px-2.5 py-1.5 rounded-md text-xs hover:bg-muted/40 transition-colors flex items-center gap-2 group"
                    >
                      <Compass className="w-3 h-3 text-sky-400/70 shrink-0" />
                      <span className="flex-1 truncate">{a.name}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-foreground transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Footer — ask your agent */}
          <div className="border-t border-border/40 p-3 shrink-0 bg-muted/20">
            <button
              onClick={() => {
                // Trigger the global Cmd+J overlay (ChatOverlay listens for it)
                const evt = new KeyboardEvent("keydown", { key: "j", metaKey: true, bubbles: true });
                window.dispatchEvent(evt);
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                Preguntar al agente
              </span>
              <kbd className="px-1.5 py-0.5 rounded border border-primary/30 bg-card/40 font-mono text-[9px]">⌘J</kbd>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Proposal card ────────────────────────────────────────────────────────────

function ProposalCard({
  action, Icon, mutating, onApply, onDismiss,
}: {
  action: AgentAction;
  Icon: React.ElementType;
  mutating: boolean;
  onApply: () => Promise<void>;
  onDismiss: () => Promise<void>;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/60 p-2.5">
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="w-3 h-3 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-snug">{action.title}</p>
          {action.description && (
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-3">{action.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={onDismiss}
          disabled={mutating}
          className="text-[10px] px-2 py-1 rounded-md text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors disabled:opacity-50"
        >
          Descartar
        </button>
        <button
          onClick={onApply}
          disabled={mutating}
          className="text-[10px] px-2 py-1 rounded-md bg-primary/15 text-primary hover:bg-primary/25 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <CheckCircle2 className="w-2.5 h-2.5" />
          Aprobar
        </button>
      </div>
    </div>
  );
}

// ─── Trigger button (place in header) ─────────────────────────────────────────

interface TriggerProps {
  onClick: () => void;
  pendingCount?: number;
  active?: boolean;
}

export function BrainAgentTrigger({ onClick, pendingCount = 0, active }: TriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active
          ? "bg-primary/15 text-primary"
          : "border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
      )}
      title="Tu agente"
    >
      <Bot className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Agente</span>
      {pendingCount > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">
          {pendingCount > 9 ? "9+" : pendingCount}
        </span>
      )}
      <ArrowRight className={cn("w-3 h-3 transition-transform", active && "rotate-90")} />
    </button>
  );
}

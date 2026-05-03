"use client";

/**
 * BrainCreateToolbar — prominent per-type creation strip.
 *
 * Lives at the very top of the /brain center pane. Each button is a distinct
 * data type with its own colour, icon, and inline composer. Clicking a button
 * toggles the corresponding composer below the strip; pressing the same
 * button again (or Esc) closes it. ⌘/Ctrl + Enter submits.
 *
 * The composers wire directly to existing hooks — no new GraphQL ops:
 *   • Nota   → QUICK_CAPTURE  (AI-classifies + persists)
 *   • Tarea  → useTasks().createTask
 *   • Plan   → usePlans().createPlan       (type=action, AI-generated phases)
 *   • Meta   → useGoals.useCreateGoal
 *   • Concepto → useExtractText            (text → KnowledgeNode graph)
 *   • Deck   → useDecks().createDeck
 *   • Space  → useWorkspaces().createWorkspace
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  StickyNote, ListTodo, Target, Flag, Lightbulb, Layers3, Folder,
  Loader2,
} from "lucide-react";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { QUICK_CAPTURE } from "@/graphql/ai/operations";
import { useTasks } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { useCreateGoal } from "@/hooks/useGoals";
import { useExtractText } from "@/hooks/useKnowledge";
import { useDecks } from "@/hooks/useFlashcards";
import { useWorkspaces } from "@/hooks/useWorkspace";
import { cn } from "@/lib/utils";

// ─── Per-type theme ──────────────────────────────────────────────────────────

export type CreateKind = "note" | "task" | "plan" | "goal" | "concept" | "deck" | "space";

interface KindTheme {
  label: string;
  hint: string;
  icon: React.ElementType;
  text: string;
  bg: string;
  bgSoft: string;
  ring: string;
  border: string;
  placeholder: string;
}

const THEMES: Record<CreateKind, KindTheme> = {
  note: {
    label: "Nota",
    hint: "Una idea, recordatorio o lo que quieras guardar",
    icon: StickyNote,
    text: "text-yellow-300",
    bg: "bg-yellow-500/15 hover:bg-yellow-500/25 text-yellow-200",
    bgSoft: "bg-yellow-500/10",
    ring: "ring-yellow-500/40",
    border: "border-yellow-500/30",
    placeholder: "Escribí cualquier idea — la IA la clasifica y archiva.",
  },
  task: {
    label: "Tarea",
    hint: "Algo concreto que tenés que hacer",
    icon: ListTodo,
    text: "text-sky-300",
    bg: "bg-sky-500/15 hover:bg-sky-500/25 text-sky-200",
    bgSoft: "bg-sky-500/10",
    ring: "ring-sky-500/40",
    border: "border-sky-500/30",
    placeholder: "¿Qué tenés que hacer? Ej. 'Repasar capítulo 3 de cálculo'",
  },
  plan: {
    label: "Plan",
    hint: "Una hoja de ruta con fases y tareas",
    icon: Target,
    text: "text-emerald-300",
    bg: "bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200",
    bgSoft: "bg-emerald-500/10",
    ring: "ring-emerald-500/40",
    border: "border-emerald-500/30",
    placeholder: "Describí un objetivo. La IA arma el plan con fases y tareas.",
  },
  goal: {
    label: "Meta",
    hint: "Algo importante que querés lograr",
    icon: Flag,
    text: "text-rose-300",
    bg: "bg-rose-500/15 hover:bg-rose-500/25 text-rose-200",
    bgSoft: "bg-rose-500/10",
    ring: "ring-rose-500/40",
    border: "border-rose-500/30",
    placeholder: "¿Qué querés lograr? El mentor te hace preguntas para clarificarla.",
  },
  concept: {
    label: "Concepto",
    hint: "Texto para extraer al grafo de conocimiento",
    icon: Lightbulb,
    text: "text-indigo-300",
    bg: "bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-200",
    bgSoft: "bg-indigo-500/10",
    ring: "ring-indigo-500/40",
    border: "border-indigo-500/30",
    placeholder: "Pegá texto, apuntes o un párrafo. La IA lo convierte en nodos enlazados.",
  },
  deck: {
    label: "Deck",
    hint: "Mazo de flashcards para repaso espaciado",
    icon: Layers3,
    text: "text-teal-300",
    bg: "bg-teal-500/15 hover:bg-teal-500/25 text-teal-200",
    bgSoft: "bg-teal-500/10",
    ring: "ring-teal-500/40",
    border: "border-teal-500/30",
    placeholder: "Nombre del deck. Ej. 'Anatomía — sistema nervioso'.",
  },
  space: {
    label: "Space",
    hint: "Workspace temático con sus páginas",
    icon: Folder,
    text: "text-violet-300",
    bg: "bg-violet-500/15 hover:bg-violet-500/25 text-violet-200",
    bgSoft: "bg-violet-500/10",
    ring: "ring-violet-500/40",
    border: "border-violet-500/30",
    placeholder: "Nombre del space. Ej. 'Tesis · estado del arte'.",
  },
};

// ─── Composer ────────────────────────────────────────────────────────────────

function Composer({
  kind, busy, onSubmit, onClose,
}: {
  kind: CreateKind;
  busy: boolean;
  onSubmit: (text: string) => Promise<boolean>;
  onClose: () => void;
}) {
  const theme = THEMES[kind];
  const Icon = theme.icon;
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 60);
  }, []);

  const submit = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const ok = await onSubmit(t);
    if (ok) {
      setText("");
      onClose();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") onClose();
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -6, height: 0 }}
      className={cn("rounded-xl border p-4 mt-3 overflow-hidden", theme.bgSoft, theme.border)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", theme.text)} />
        <span className={cn("text-sm font-semibold", theme.text)}>Nueva {theme.label.toLowerCase()}</span>
        <span className="text-[10px] text-muted-foreground/60 ml-auto">⌘Enter para crear · Esc para cerrar</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70 mb-2">{theme.hint}</p>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder={theme.placeholder}
        rows={kind === "concept" || kind === "plan" ? 4 : 2}
        className="w-full bg-background/60 rounded-md p-2.5 text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40 border border-border/40 focus:border-border/60"
      />
      <div className="flex items-center justify-end gap-2 mt-2">
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-md text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
          disabled={busy}
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={!text.trim() || busy}
          className={cn(
            "text-xs px-3 py-1.5 rounded-md font-medium inline-flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            theme.bg,
          )}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
          Crear {theme.label.toLowerCase()}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

interface ToolbarProps {
  onCreated?: (kind: CreateKind) => void;
}

const KIND_ORDER: CreateKind[] = ["note", "task", "plan", "goal", "concept", "deck", "space"];

export function BrainCreateToolbar({ onCreated }: ToolbarProps) {
  const [active, setActive] = useState<CreateKind | null>(null);
  const [busy, setBusy] = useState(false);

  const [capture] = useMutation(QUICK_CAPTURE, { client: aiClient });
  const { createTask } = useTasks();
  const { createPlan } = usePlans();
  const { createGoal } = useCreateGoal();
  const { extract: extractText } = useExtractText();
  const { createDeck } = useDecks();
  const { createWorkspace } = useWorkspaces();

  const close = () => setActive(null);

  const handleSubmit = async (text: string): Promise<boolean> => {
    if (!active) return false;
    setBusy(true);
    try {
      switch (active) {
        case "note":
          await capture({ variables: { text } });
          break;
        case "task":
          await createTask({ title: text, status: "todo" });
          break;
        case "plan":
          await createPlan({
            title: text.slice(0, 80),
            goal: text,
            type: "action",
            generateWithAI: true,
          });
          break;
        case "goal":
          await createGoal(text.slice(0, 120), text);
          break;
        case "concept":
          await extractText({ text, sourceRef: "brain:manual" });
          break;
        case "deck":
          await createDeck(text.slice(0, 80));
          break;
        case "space":
          await createWorkspace({ title: text.slice(0, 80), icon: "📦" });
          break;
      }
      onCreated?.(active);
      return true;
    } catch {
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-0">
      <div className="flex flex-wrap items-center gap-2">
        {KIND_ORDER.map((kind) => {
          const theme = THEMES[kind];
          const Icon = theme.icon;
          const isActive = active === kind;
          return (
            <button
              key={kind}
              onClick={() => setActive(isActive ? null : kind)}
              className={cn(
                "h-10 px-4 rounded-xl border inline-flex items-center gap-2 text-sm font-medium transition-all",
                isActive
                  ? cn(theme.bg, theme.border, "ring-2", theme.ring)
                  : cn(theme.bg, theme.border, "hover:scale-[1.02]"),
              )}
              title={theme.hint}
            >
              <Icon className={cn("w-4 h-4", theme.text)} />
              <span>{theme.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {active && (
          <Composer
            key={active}
            kind={active}
            busy={busy}
            onSubmit={handleSubmit}
            onClose={close}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

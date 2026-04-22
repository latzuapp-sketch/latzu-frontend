"use client";

/**
 * AskAI — Notion-style AI editor for KnowledgeNode content.
 *
 * Opens as a floating panel anchored to the content area. Offers:
 *  - Preset shortcuts (improve, summarize, expand, simplify, fix, translate)
 *  - Free-form instruction input
 *  - Side-by-side preview of the rewritten content with Accept / Discard
 *  - Keyboard: Enter to submit, Escape to close
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { aiClient } from "@/lib/apollo";
import { REWRITE_KNOWLEDGE_CONTENT } from "@/graphql/ai/operations";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Wand2,
  Minimize2,
  Maximize2,
  Baseline,
  SpellCheck,
  Languages,
  ArrowRight,
  Loader2,
  Check,
  X,
  RotateCcw,
} from "lucide-react";

type AIMode = "improve" | "summarize" | "expand" | "simplify" | "fix" | "translate_en";

const PRESETS: Array<{
  mode: AIMode;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { mode: "improve",      label: "Mejorar redacción",      hint: "Más claro y fluido",         icon: Wand2 },
  { mode: "summarize",    label: "Resumir",                hint: "Los puntos clave",           icon: Minimize2 },
  { mode: "expand",       label: "Expandir",               hint: "Más detalle y contexto",     icon: Maximize2 },
  { mode: "simplify",     label: "Simplificar",            hint: "Lenguaje accesible",         icon: Baseline },
  { mode: "fix",          label: "Corregir ortografía",    hint: "Gramática y puntuación",     icon: SpellCheck },
  { mode: "translate_en", label: "Traducir al inglés",     hint: "Conservar el formato",       icon: Languages },
];

interface AskAIProps {
  nodeId: string;
  currentContent: string;
  onApply: (newContent: string) => Promise<void> | void;
  onClose: () => void;
}

interface RewriteResponse {
  rewriteKnowledgeContent: {
    nodeId: string;
    original: string;
    rewritten: string;
  } | null;
}

export function AskAI({ nodeId, currentContent, onApply, onClose }: AskAIProps) {
  const [instruction, setInstruction] = useState("");
  const [selectedMode, setSelectedMode] = useState<AIMode | null>(null);
  const [preview, setPreview] = useState<{ original: string; rewritten: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [rewrite, { loading }] = useMutation<RewriteResponse>(
    REWRITE_KNOWLEDGE_CONTENT,
    { client: aiClient }
  );

  // Autofocus + Escape handling
  useEffect(() => {
    inputRef.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const runRewrite = useCallback(
    async (mode: AIMode | null, userInstruction: string) => {
      if (!mode && !userInstruction.trim()) return;
      setError(null);
      setPreview(null);
      try {
        const { data } = await rewrite({
          variables: {
            input: {
              nodeId,
              mode: mode ?? null,
              instruction: userInstruction.trim() || null,
            },
          },
        });
        if (data?.rewriteKnowledgeContent) {
          setPreview({
            original: data.rewriteKnowledgeContent.original,
            rewritten: data.rewriteKnowledgeContent.rewritten,
          });
        } else {
          setError("No se pudo generar una respuesta.");
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al consultar la IA.");
      }
    },
    [rewrite, nodeId]
  );

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    runRewrite(selectedMode, instruction);
  };

  const handlePreset = (mode: AIMode) => {
    setSelectedMode(mode);
    runRewrite(mode, instruction);
  };

  const handleAccept = async () => {
    if (!preview) return;
    await onApply(preview.rewritten);
    onClose();
  };

  const handleRetry = () => {
    setPreview(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="relative rounded-xl border border-violet-500/30 bg-gradient-to-b from-violet-500/[0.03] to-background shadow-xl shadow-violet-500/5 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/40 bg-background/60">
        <Sparkles className="w-4 h-4 text-violet-400 flex-shrink-0" />
        <span className="text-xs font-medium text-violet-400">Preguntar a la IA</span>
        <button
          onClick={onClose}
          className="ml-auto text-muted-foreground/60 hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Input (hidden when preview shows) */}
      {!preview && (
        <form onSubmit={handleSubmit} className="p-3">
          <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 focus-within:border-violet-500/50 focus-within:bg-background transition-colors">
            <Wand2 className="w-4 h-4 text-violet-400 ml-3 flex-shrink-0" />
            <input
              ref={inputRef}
              value={instruction}
              onChange={(e) => {
                setInstruction(e.target.value);
                setSelectedMode(null);
              }}
              disabled={loading}
              placeholder="Dile a la IA qué hacer con este contenido…"
              className="flex-1 bg-transparent outline-none py-2.5 text-sm placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={loading || (!instruction.trim() && !selectedMode)}
              className={cn(
                "mr-1.5 p-1.5 rounded-md transition-all",
                loading || (!instruction.trim() && !selectedMode)
                  ? "text-muted-foreground/40 cursor-not-allowed"
                  : "bg-violet-500 text-white hover:bg-violet-600"
              )}
              title="Enviar (Enter)"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Presets */}
          <div className="mt-3 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 pb-1">
              Sugerencias
            </p>
            {PRESETS.map(({ mode, label, hint, icon: Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => handlePreset(mode)}
                disabled={loading}
                className={cn(
                  "w-full flex items-center gap-3 px-2 py-1.5 rounded-md text-left transition-colors",
                  "hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed",
                  selectedMode === mode && "bg-violet-500/10"
                )}
              >
                <Icon className="w-3.5 h-3.5 text-violet-400/80 flex-shrink-0" />
                <span className="text-sm flex-1">{label}</span>
                <span className="text-[11px] text-muted-foreground/50">{hint}</span>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-2 text-xs text-destructive px-2">{error}</p>
          )}
        </form>
      )}

      {/* Loading state */}
      {loading && !preview && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-violet-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Pensando…
          </div>
        </div>
      )}

      {/* Preview */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border/30 bg-violet-500/[0.02]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-400/80 mb-2">
                Propuesta de la IA
              </p>
              <div className="max-h-[340px] overflow-y-auto rounded-lg border border-border/40 bg-background/60 p-3">
                {preview.rewritten ? (
                  <MarkdownRenderer>{preview.rewritten}</MarkdownRenderer>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    La IA no devolvió contenido.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-2.5 bg-background/60">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-8 text-xs gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                Volver a intentar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onClose}
                className="h-8 text-xs ml-auto"
              >
                Descartar
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="h-8 text-xs gap-1.5 bg-violet-500 hover:bg-violet-600 text-white"
              >
                <Check className="w-3 h-3" />
                Reemplazar
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

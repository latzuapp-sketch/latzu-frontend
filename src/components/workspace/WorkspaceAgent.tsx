"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Sparkles, Loader2, Check, X, ChevronRight,
  Wand2, MessageSquare, RefreshCw,
} from "lucide-react";
import { aiClient } from "@/lib/apollo";
import {
  GET_WORKSPACE_SUGGESTIONS,
  ORGANIZE_WORKSPACE_INSTRUCTION,
  APPLY_WORKSPACE_SUGGESTION,
} from "@/graphql/ai/operations";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Suggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  affectedIds: string[];
}

type Tab = "suggestions" | "instruction";

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  merge:   { label: "Fusionar",  color: "text-violet-400" },
  move:    { label: "Mover",     color: "text-sky-400"    },
  create:  { label: "Crear",     color: "text-emerald-400"},
  rename:  { label: "Renombrar", color: "text-amber-400"  },
  archive: { label: "Archivar",  color: "text-rose-400"   },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface WorkspaceAgentProps {
  onOrganized?: () => void;
}

export function WorkspaceAgent({ onOrganized }: WorkspaceAgentProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("suggestions");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [instruction, setInstruction] = useState("");
  const [result, setResult] = useState<{ actions: string[]; message: string } | null>(null);

  const [getSuggestions, { loading: loadingSuggestions }] = useMutation(
    GET_WORKSPACE_SUGGESTIONS, { client: aiClient }
  );

  const [organizeInstruction, { loading: loadingInstruction }] = useMutation(
    ORGANIZE_WORKSPACE_INSTRUCTION, { client: aiClient }
  );

  const [applySuggestion, { loading: loadingApply }] = useMutation(
    APPLY_WORKSPACE_SUGGESTION, { client: aiClient }
  );

  const handleOpen = async () => {
    setOpen(true);
    if (suggestions.length === 0) {
      await fetchSuggestions();
    }
  };

  const fetchSuggestions = async () => {
    setResult(null);
    try {
      const { data } = await getSuggestions();
      setSuggestions(data?.getWorkspaceSuggestions ?? []);
    } catch (err) {
      console.error("Failed to get suggestions:", err);
    }
  };

  const handleApply = async (suggestion: Suggestion) => {
    try {
      await applySuggestion({
        variables: {
          suggestionId: suggestion.id,
          suggestionData: JSON.stringify(suggestion),
        },
      });
      setApplied((prev) => new Set([...prev, suggestion.id]));
      onOrganized?.();
    } catch (err) {
      console.error("Failed to apply suggestion:", err);
    }
  };

  const handleInstruction = async () => {
    if (!instruction.trim()) return;
    setResult(null);
    try {
      const { data } = await organizeInstruction({
        variables: { instruction: instruction.trim() },
      });
      const res = data?.organizeWorkspaceInstruction;
      setResult({ actions: res?.actionsTaken ?? [], message: res?.message ?? "" });
      setInstruction("");
      onOrganized?.();
    } catch (err) {
      console.error("Failed to execute instruction:", err);
    }
  };

  const visibleSuggestions = suggestions.filter((s) => !dismissed.has(s.id));

  return (
    <>
      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleOpen}
      >
        <Wand2 className="w-4 h-4 text-primary" />
        Organizar con IA
      </Button>

      {/* Panel overlay */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-card border-l border-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">Agente de organización</p>
                  <p className="text-xs text-muted-foreground">Reorganiza tu workspace con IA</p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border">
                {(["suggestions", "instruction"] as Tab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 text-sm transition-colors",
                      tab === t
                        ? "border-b-2 border-primary text-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "suggestions" ? (
                      <><Wand2 className="w-3.5 h-3.5" /> Sugerencias</>
                    ) : (
                      <><MessageSquare className="w-3.5 h-3.5" /> Instrucción</>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">

                {/* Suggestions tab */}
                {tab === "suggestions" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {loadingSuggestions
                          ? "Analizando tu workspace…"
                          : `${visibleSuggestions.length} sugerencias`}
                      </p>
                      <button
                        onClick={fetchSuggestions}
                        disabled={loadingSuggestions}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", loadingSuggestions && "animate-spin")} />
                      </button>
                    </div>

                    {loadingSuggestions && (
                      <div className="flex flex-col items-center py-12 gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Analizando tu contenido…</p>
                      </div>
                    )}

                    {!loadingSuggestions && visibleSuggestions.length === 0 && (
                      <div className="flex flex-col items-center py-12 gap-3 text-center">
                        <Sparkles className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                          {suggestions.length === 0
                            ? "Haz click en refrescar para analizar tu workspace"
                            : "Ya aplicaste o descartaste todas las sugerencias"}
                        </p>
                      </div>
                    )}

                    <AnimatePresence>
                      {visibleSuggestions.map((s) => {
                        const config = TYPE_CONFIG[s.type] ?? { label: s.type, color: "text-muted-foreground" };
                        const isApplied = applied.has(s.id);
                        return (
                          <motion.div
                            key={s.id}
                            layout
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                              "rounded-xl border p-3 space-y-2 transition-all",
                              isApplied ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/60 bg-card/60"
                            )}
                          >
                            <div className="flex items-start gap-2">
                              <span className={cn("text-xs font-semibold uppercase tracking-wide mt-0.5 flex-shrink-0", config.color)}>
                                {config.label}
                              </span>
                              <p className="text-sm font-medium leading-snug flex-1">{s.title}</p>
                              {!isApplied && (
                                <button
                                  onClick={() => setDismissed((prev) => new Set([...prev, s.id]))}
                                  className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-snug">{s.description}</p>
                            {!isApplied && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="w-full h-7 text-xs gap-1.5"
                                onClick={() => handleApply(s)}
                                disabled={loadingApply}
                              >
                                {loadingApply ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <><ChevronRight className="w-3 h-3" /> Aplicar</>
                                )}
                              </Button>
                            )}
                            {isApplied && (
                              <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                                <Check className="w-3 h-3" />
                                Aplicado
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}

                {/* Instruction tab */}
                {tab === "instruction" && (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Dale una instrucción al agente y reorganizará tu workspace automáticamente.
                    </p>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Ejemplos:</p>
                      {[
                        "Reorganiza todo por área de vida",
                        "Crea una página de seguimiento semanal en cada workspace",
                        "Agrupa todas las páginas de finanzas en un solo workspace",
                        "Renombra todos los workspaces con nombres más claros",
                      ].map((ex) => (
                        <button
                          key={ex}
                          onClick={() => setInstruction(ex)}
                          className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          "{ex}"
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value)}
                      placeholder="Escribe lo que quieres que haga el agente…"
                      rows={3}
                      className="w-full bg-muted/30 border border-border/60 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/50 transition-colors resize-none"
                    />

                    <Button
                      className="w-full gap-2"
                      onClick={handleInstruction}
                      disabled={!instruction.trim() || loadingInstruction}
                    >
                      {loadingInstruction ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <><Wand2 className="w-4 h-4" /> Ejecutar</>
                      )}
                    </Button>

                    {/* Result */}
                    {result && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-2"
                      >
                        <p className="text-sm font-medium">{result.message}</p>
                        {result.actions.length > 0 && (
                          <div className="space-y-1">
                            {result.actions.map((action, i) => (
                              <p key={i} className="text-xs text-muted-foreground">{action}</p>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

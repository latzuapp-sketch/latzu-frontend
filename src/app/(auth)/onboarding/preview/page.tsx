"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Loader2, ChevronDown, ChevronUp, Trash2, Plus,
  ArrowRight, Edit2, Check, X,
} from "lucide-react";
import { aiClient } from "@/lib/apollo";
import { GENERATE_ONBOARDING_PREVIEW } from "@/graphql/ai/operations";
import type { OnboardingData, OnboardingPreview, ProposedWorkspace, ProposedPage } from "@/types/user";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableWorkspace extends ProposedWorkspace {
  expanded: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPreviewPage() {
  const { status } = useSession();
  const router = useRouter();

  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData> | null>(null);
  const [preview, setPreview] = useState<OnboardingPreview | null>(null);
  const [workspaces, setWorkspaces] = useState<EditableWorkspace[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [editingWsIdx, setEditingWsIdx] = useState<number | null>(null);
  const [editingWsTitle, setEditingWsTitle] = useState("");

  const [generatePreview, { loading: generating }] = useMutation(GENERATE_ONBOARDING_PREVIEW, {
    client: aiClient,
  });

  // Load onboarding data from sessionStorage and call the backend
  const loadPreview = useCallback(async (data: Partial<OnboardingData>) => {
    try {
      const { data: res } = await generatePreview({
        variables: {
          input: {
            profileType:    data.profileType ?? "aprendiz",
            motivations:    data.motivations ?? [],
            activeAreas:    data.activeAreas ?? [],
            planningStyle:  data.planningStyle ?? null,
            energyPeak:     data.energyPeak ?? null,
            feedbackStyle:  data.feedbackStyle ?? null,
            workPace:       data.workPace ?? null,
            mainBlocker:    data.mainBlocker ?? null,
            mainMotivator:  data.mainMotivator ?? null,
            aiPersonality:  data.aiPersonality ?? [],
            vision90:       data.vision90 ? JSON.stringify(data.vision90) : null,
            university:     data.university ?? null,
            career:         data.career ?? null,
            semester:       data.semester ?? null,
            country:        data.country ?? null,
            studyFocus:     data.studyFocus ?? null,
          },
        },
      });
      const p: OnboardingPreview = res?.generateOnboardingPreview;
      if (p) {
        setPreview(p);
        setWorkspaces(p.workspaces.map((ws) => ({ ...ws, expanded: true })));
      }
    } catch (err) {
      console.error("Preview generation failed:", err);
    }
  }, [generatePreview]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status !== "authenticated") return;

    try {
      const raw = sessionStorage.getItem("latzu_onboarding");
      if (raw) {
        const data = JSON.parse(raw) as Partial<OnboardingData>;
        setOnboardingData(data);
        loadPreview(data);
      } else {
        router.push("/onboarding");
      }
    } catch {
      router.push("/onboarding");
    }
  }, [status, router, loadPreview]);

  const handleConfirm = async () => {
    setIsConfirming(true);

    // Merge edited workspaces back into the preview for personalization
    const finalPreview = {
      ...preview,
      workspaces,
    };
    try {
      sessionStorage.setItem("latzu_preview", JSON.stringify(finalPreview));
      sessionStorage.setItem("latzu_onboarding", JSON.stringify({
        ...onboardingData,
        previewWorkspaces: JSON.stringify(workspaces.map((ws) => ({
          title: ws.title,
          icon: ws.icon,
          pages: ws.pages.map((p) => p.title),
        }))),
      }));
    } catch { /* ignore */ }

    router.push("/personalizando");
  };

  // Workspace editing
  const toggleExpand = (idx: number) =>
    setWorkspaces((prev) => prev.map((ws, i) => i === idx ? { ...ws, expanded: !ws.expanded } : ws));

  const removeWorkspace = (idx: number) =>
    setWorkspaces((prev) => prev.filter((_, i) => i !== idx));

  const startEditWs = (idx: number) => {
    setEditingWsIdx(idx);
    setEditingWsTitle(workspaces[idx].title);
  };

  const commitEditWs = (idx: number) => {
    if (editingWsTitle.trim()) {
      setWorkspaces((prev) => prev.map((ws, i) => i === idx ? { ...ws, title: editingWsTitle.trim() } : ws));
    }
    setEditingWsIdx(null);
  };

  const removePage = (wsIdx: number, pgIdx: number) =>
    setWorkspaces((prev) => prev.map((ws, i) =>
      i === wsIdx ? { ...ws, pages: ws.pages.filter((_, j) => j !== pgIdx) } : ws
    ));

  const addPage = (wsIdx: number) =>
    setWorkspaces((prev) => prev.map((ws, i) =>
      i === wsIdx ? {
        ...ws,
        pages: [...ws.pages, { title: "Nueva página", description: "", icon: "📄" }],
      } : ws
    ));

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-7 h-7 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold">Tu espacio propuesto</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Revisa y ajusta antes de que lo creemos todo para ti
        </p>
      </motion.div>

      {/* Loading state */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse-glow" />
            <Loader2 className="w-8 h-8 animate-spin text-primary absolute inset-0 m-auto" />
          </div>
          <p className="text-muted-foreground text-sm">Analizando tu perfil y generando tu espacio…</p>
        </div>
      )}

      {/* Preview content */}
      {!generating && preview && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Personality badges */}
          {preview.personalityBadges.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cómo te vemos</p>
              <div className="flex flex-wrap gap-2">
                {preview.personalityBadges.map((badge) => (
                  <Badge key={badge} variant="secondary" className="text-sm px-3 py-1 gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {preview.summary && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Tu IA dice: </span>
                {preview.summary}
              </p>
            </div>
          )}

          {/* Workspaces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Workspaces que crearemos ({workspaces.length})
              </p>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {workspaces.map((ws, wsIdx) => (
                  <motion.div
                    key={wsIdx}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl border border-border/60 bg-card/60 overflow-hidden"
                  >
                    {/* Workspace header */}
                    <div className="flex items-center gap-3 p-3">
                      <span className="text-xl">{ws.icon}</span>

                      {editingWsIdx === wsIdx ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editingWsTitle}
                            onChange={(e) => setEditingWsTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditWs(wsIdx);
                              if (e.key === "Escape") setEditingWsIdx(null);
                            }}
                            className="h-7 text-sm"
                            autoFocus
                          />
                          <button onClick={() => commitEditWs(wsIdx)} className="text-primary hover:text-primary/80">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingWsIdx(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ws.title}</p>
                          <p className="text-xs text-muted-foreground">{ws.pages.length} páginas</p>
                        </div>
                      )}

                      {editingWsIdx !== wsIdx && (
                        <div className="flex items-center gap-1 ml-auto">
                          <button
                            onClick={() => startEditWs(wsIdx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeWorkspace(wsIdx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleExpand(wsIdx)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                          >
                            {ws.expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pages */}
                    <AnimatePresence>
                      {ws.expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1 border-t border-border/40 pt-2">
                            {ws.pages.map((page, pgIdx) => (
                              <div key={pgIdx} className="flex items-center gap-2 group py-1 px-2 rounded-lg hover:bg-muted/30">
                                <span className="text-sm">{page.icon}</span>
                                <span className="text-sm text-muted-foreground flex-1 truncate">{page.title}</span>
                                <button
                                  onClick={() => removePage(wsIdx, pgIdx)}
                                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addPage(wsIdx)}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Añadir página
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Initial tasks */}
          {preview.initialTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Tus primeras tareas
              </p>
              <div className="space-y-1.5">
                {preview.initialTasks.map((task, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/40">
                    <div className="w-5 h-5 rounded-full border-2 border-primary/40 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{task.title}</p>
                      {task.area && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.area}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="pt-4">
            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={handleConfirm}
              disabled={isConfirming || workspaces.length === 0}
            >
              {isConfirming ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Crear mi espacio
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-3">
              Puedes reorganizar todo esto después con el agente de organización
            </p>
          </div>
        </motion.div>
      )}

      {/* Back link */}
      {!generating && (
        <button
          onClick={() => router.push("/onboarding")}
          className="mt-6 block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Volver a las preguntas
        </button>
      )}
    </div>
  );
}

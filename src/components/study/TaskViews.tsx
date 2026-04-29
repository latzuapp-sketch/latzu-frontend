"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/apollo";
import {
  SEND_MESSAGE, RECORD_STUDY_OUTCOME,
  GET_TASK_CONTENT, GENERATE_TASK_CONTENT,
} from "@/graphql/ai/operations";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import { FlashcardSession } from "@/components/study/FlashcardSession";
import type { PlanningTask, TaskCategory } from "@/types/planning";
import {
  Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight,
  Trophy, RotateCcw, Lightbulb, FileCode, StickyNote, Bot,
  Brain, ArrowRight, MessageSquare, BookOpen, Zap, Star,
  Volume2, VolumeX,
} from "lucide-react";
import { useTTS } from "@/hooks/useTTS";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ViewProps {
  task: PlanningTask;
  userId: string | null;
  buildContext: () => string;
}

interface QuizQuestion {
  text: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation?: string;
}

interface CompletionInfo {
  type: "quiz" | "reading" | "flashcard" | "practice";
  score?: number;          // 0–100 for quiz
  cardsReviewed?: number;
  readProgress?: number;   // 0–100
  taskTitle: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseChapters(text: string): { id: string; title: string; content: string }[] {
  if (!text.trim()) return [];
  // Split before any ## or # heading that starts on a new line
  const parts = text.split(/\n(?=#{1,2} )/);
  if (parts.length <= 1) return [{ id: "full", title: "Contenido", content: text }];
  return parts.map((part, i) => {
    const trimmed = part.trim();
    const lines = trimmed.split("\n");
    const headingMatch = lines[0].match(/^#{1,2} (.+)/);
    if (headingMatch) {
      return { id: `ch-${i}`, title: headingMatch[1].trim(), content: lines.slice(1).join("\n").trim() };
    }
    return { id: `ch-${i}`, title: i === 0 ? "Introducción" : `Parte ${i + 1}`, content: trimmed };
  }).filter((ch) => ch.content);
}

function parseFlashcards(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  for (const b of text.split(/\n{2,}/)) {
    const f = b.match(/FRENTE:\s*(.+)/i);
    const r = b.match(/REVERSO:\s*(.+)/i);
    if (f && r) cards.push({ front: f[1].trim(), back: r[1].trim() });
  }
  if (!cards.length) {
    for (const line of text.split("\n")) {
      const parts = line.split("|");
      if (parts.length === 2 && parts[0].trim() && parts[1].trim())
        cards.push({ front: parts[0].trim(), back: parts[1].trim() });
    }
  }
  return cards;
}

function parseQuiz(raw: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const blocks = raw.split(/\n(?=\[?\d+\]?[\.\)]\s)/);
  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (lines.length < 3) continue;
    const qText = lines[0].replace(/^\[?\d+\]?[\.\)]\s*/, "").trim();
    const options: QuizQuestion["options"] = [];
    const expLines: string[] = [];
    let inExp = false;
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (inExp) { expLines.push(line); continue; }
      const m = line.match(/^([a-d])\)\s*(.*?)(\s*\*\s*)?$/i);
      if (m) {
        const isCorrect = line.includes("*");
        options.push({ label: m[1].toLowerCase(), text: m[2].replace(/\*$/, "").trim(), isCorrect });
      } else if (/explicaci[oó]n/i.test(line)) {
        inExp = true;
        const after = line.replace(/^[^:]+:\s*/, "");
        if (after) expLines.push(after);
      }
    }
    if (qText && options.length >= 2) questions.push({ text: qText, options, explanation: expLines.join(" ").trim() || undefined });
  }
  return questions;
}

// ── Proactive Suggestions Panel ───────────────────────────────────────────────

interface Suggestion {
  icon: typeof BookOpen;
  label: string;
  description: string;
  action: "ask" | "next" | "review" | "practice" | "deepen";
  prompt?: string;
}

function buildSuggestions(info: CompletionInfo): { questions: string[]; suggestions: Suggestion[] } {
  const { type, score, taskTitle } = info;

  const questions = type === "quiz"
    ? score !== undefined && score < 60
      ? [
          `¿Cuál parte de "${taskTitle}" te resultó más difícil?`,
          "¿Quieres que explique algún concepto con más detalle?",
        ]
      : [
          `¿Puedes explicar con tus propias palabras el concepto central de "${taskTitle}"?`,
          "¿Cómo aplicarías esto en un proyecto real?",
        ]
    : type === "reading"
      ? [
          `¿Cuál fue la idea más importante de "${taskTitle}"?`,
          "¿Tienes alguna duda sobre lo que leíste?",
        ]
      : [
          `¿Qué aprendiste hoy sobre "${taskTitle}"?`,
          "¿En qué área quieres profundizar más?",
        ];

  const suggestions: Suggestion[] = [
    {
      icon: Brain,
      label: "Profundizar el tema",
      description: "Genera una explicación más detallada con ejemplos avanzados",
      action: "deepen",
      prompt: `Profundiza el tema "${taskTitle}": conceptos avanzados, casos de uso reales y errores comunes a evitar.`,
    },
    {
      icon: Zap,
      label: "Ejercicio práctico",
      description: "Aplica lo aprendido con un ejercicio real",
      action: "practice",
      prompt: `Crea un ejercicio práctico desafiante sobre "${taskTitle}" con solución paso a paso.`,
    },
    {
      icon: MessageSquare,
      label: "Preguntas de repaso",
      description: "Refuerza conceptos con preguntas de reflexión",
      action: "review",
      prompt: `Dame 5 preguntas de reflexión profunda sobre "${taskTitle}" para reforzar el aprendizaje.`,
    },
    {
      icon: ArrowRight,
      label: "Siguiente tema",
      description: "Continúa con el siguiente contenido del plan",
      action: "next",
    },
  ];

  if (type === "quiz" && score !== undefined && score < 60) {
    suggestions.unshift({
      icon: RotateCcw,
      label: "Repasar conceptos base",
      description: "Revisemos los fundamentos antes de continuar",
      action: "deepen",
      prompt: `Explica los conceptos fundamentales de "${taskTitle}" desde cero, con ejemplos simples y analogías.`,
    });
  }

  return { questions, suggestions: suggestions.slice(0, 4) };
}

interface ProactivePanelProps {
  info: CompletionInfo;
  onAskQuestion: (q: string) => void;
  onSuggestion: (s: Suggestion) => void;
  onDismiss: () => void;
}

function ProactivePanel({ info, onAskQuestion, onSuggestion, onDismiss }: ProactivePanelProps) {
  const { questions, suggestions } = buildSuggestions(info);
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [loadingAnswer, setLoadingAnswer] = useState(false);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  const handleQuestion = useCallback(async (q: string) => {
    setAsked(q);
    setLoadingAnswer(true);
    setAnswer("");
    try {
      const { data } = await sendMsg({
        variables: {
          input: {
            message: `Sobre "${info.taskTitle}": ${q}`,
            useRag: true,
            contentGeneration: true,
          },
        },
      });
      setAnswer(data?.sendMessage?.reply ?? "");
    } catch {
      setAnswer("No pude generar una respuesta. Intenta de nuevo.");
    } finally {
      setLoadingAnswer(false);
    }
  }, [info.taskTitle, sendMsg]);

  const emoji = info.type === "quiz"
    ? (info.score ?? 0) >= 80 ? "🎉" : (info.score ?? 0) >= 60 ? "📚" : "💪"
    : info.type === "reading" ? "📖"
    : "⚡";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ type: "spring", damping: 24, stiffness: 300 }}
      className="absolute inset-0 bg-background/95 backdrop-blur-sm z-20 overflow-y-auto"
    >
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-4xl">{emoji}</div>
          <h2 className="text-xl font-bold">
            {info.type === "quiz"
              ? `${info.score}% — ${(info.score ?? 0) >= 80 ? "¡Excelente!" : (info.score ?? 0) >= 60 ? "Buen trabajo" : "Sigue practicando"}`
              : info.type === "reading"
                ? "Lectura completada"
                : "Sesión completada"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Terminaste <strong>{info.taskTitle}</strong>. ¿Qué hacemos ahora?
          </p>
        </div>

        {/* Questions to deepen understanding */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-primary" />
            Comprueba tu comprensión
          </p>
          <div className="space-y-2">
            {questions.map((q) => (
              <button
                key={q}
                onClick={() => handleQuestion(q)}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                  asked === q
                    ? "border-primary/40 bg-primary/8 text-foreground"
                    : "border-border/50 hover:border-primary/30 hover:bg-primary/5 text-muted-foreground hover:text-foreground"
                )}
              >
                {q}
              </button>
            ))}
          </div>

          {/* AI answer to question */}
          <AnimatePresence>
            {asked && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/20 bg-primary/5 p-4"
              >
                <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" />Respuesta
                </p>
                {loadingAnswer ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />Pensando…
                  </div>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer>{answer}</MarkdownRenderer>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Next step suggestions */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400" />
            ¿Qué estudias ahora?
          </p>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => onSuggestion(s)}
                  className="flex flex-col items-start gap-1.5 p-3.5 rounded-xl border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-primary/70 group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{s.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground leading-snug">{s.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          Cerrar y volver al contenido
        </button>
      </div>
    </motion.div>
  );
}

// ── Content loading hook ──────────────────────────────────────────────────────

function useTaskContent(task: PlanningTask) {
  const [generateContent] = useMutation(GENERATE_TASK_CONTENT, { client: aiClient });

  const { data, loading: queryLoading } = useQuery(GET_TASK_CONTENT, {
    client: aiClient,
    variables: { taskId: task.id },
    fetchPolicy: "cache-first",
  });

  const [content, setContent] = useState<Record<string, unknown> | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const generated = useRef(false);

  useEffect(() => {
    if (queryLoading) return;
    if (generated.current) return;

    const stored = data?.taskContent;
    if (stored?.content && Object.keys(stored.content as object).length > 0) {
      setContent(stored.content as Record<string, unknown>);
      setContentType(stored.contentType);
      setLoading(false);
      generated.current = true;
      return;
    }

    // Generate and persist via backend
    generated.current = true;
    generateContent({ variables: { taskId: task.id } })
      .then(({ data: genData }) => {
        const c = genData?.generateTaskContent;
        if (c?.content) {
          setContent(c.content as Record<string, unknown>);
          setContentType(c.contentType);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [queryLoading, data]); // eslint-disable-line react-hooks/exhaustive-deps

  const regenerate = useCallback(async () => {
    setLoading(true);
    setContent(null);
    try {
      const { data: genData } = await generateContent({
        variables: { taskId: task.id, forceRegenerate: true },
      });
      const c = genData?.generateTaskContent;
      if (c?.content) {
        setContent(c.content as Record<string, unknown>);
        setContentType(c.contentType);
      }
    } catch {}
    setLoading(false);
  }, [generateContent, task.id]);

  return { content, contentType, loading, regenerate };
}

// ── Reading / Lesson view (chapter-based) ────────────────────────────────────

export function ReadingView({ task, userId }: ViewProps) {
  const { content, loading, regenerate } = useTaskContent(task);
  const [completion, setCompletion] = useState<CompletionInfo | null>(null);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [tocOpen, setTocOpen] = useState(false);
  const [recordOutcome] = useMutation(RECORD_STUDY_OUTCOME, { client: aiClient });
  const contentRef = useRef<HTMLDivElement>(null);
  const tts = useTTS();

  const text = (content as { content?: string })?.content ?? "";
  const chapters = useMemo(() => parseChapters(text), [text]);

  const chapterText = useCallback(
    (idx: number) => {
      const ch = chapters[idx];
      return ch ? `${ch.title}. ${ch.content}` : "";
    },
    [chapters]
  );

  // Stop TTS when switching to a different task
  useEffect(() => {
    setChapterIdx(0);
    setTocOpen(false);
    tts.disable();
  }, [task.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-narrate when chapter changes (only while enabled)
  useEffect(() => {
    if (!tts.isEnabled) return;
    const t = chapterText(chapterIdx);
    if (t) tts.speak(t);
  }, [chapterIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const chapter = chapters[chapterIdx] ?? null;
  const isLast = chapterIdx === chapters.length - 1;
  const isSingleChapter = chapters.length <= 1;
  const progress = chapters.length > 1
    ? Math.round((chapterIdx / (chapters.length - 1)) * 100)
    : chapter ? 50 : 0;

  const handleSuggestion = useCallback((s: ReturnType<typeof buildSuggestions>["suggestions"][0]) => {
    if (!s.prompt) { setCompletion(null); return; }
    setCompletion(null);
    window.dispatchEvent(new CustomEvent("latzu:study-prompt", { detail: { prompt: s.prompt, userId } }));
  }, [userId]);

  const goNext = useCallback(() => {
    if (isLast) {
      recordOutcome({ variables: { input: { taskId: task.id, outcomeType: "reading" } } }).catch(() => {});
      setCompletion({ type: "reading", readProgress: 100, taskTitle: task.title });
    } else {
      setChapterIdx((v) => v + 1);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [isLast, task.id, task.title, recordOutcome]);

  if (loading) return <LoadingState label="Preparando lección…" />;

  return (
    <div className="relative flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-1 bg-muted/30 shrink-0">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Chapter navigation bar */}
      {!isSingleChapter && (
        <div className="shrink-0 border-b border-border/30 bg-muted/10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
            {/* Chapter title */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-[10px] font-mono font-bold text-primary/80 shrink-0 bg-primary/10 px-1.5 py-0.5 rounded">
                {chapterIdx + 1}/{chapters.length}
              </span>
              <span className="text-sm font-semibold truncate">{chapter?.title}</span>
            </div>
            {/* Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => tts.isEnabled ? tts.disable() : tts.enable(chapterText(chapterIdx))}
                title={tts.isEnabled ? "Detener narración" : "Escuchar con IA"}
                className={cn(
                  "flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors",
                  tts.isEnabled
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                )}
              >
                {tts.isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : tts.isPlaying ? (
                  <Volume2 className="w-3 h-3 animate-pulse" />
                ) : tts.isEnabled ? (
                  <Volume2 className="w-3 h-3" />
                ) : (
                  <VolumeX className="w-3 h-3" />
                )}
                <span className="hidden sm:inline">
                  {tts.isLoading ? "Cargando…" : tts.isEnabled ? "Narrando" : "Escuchar"}
                </span>
              </button>
              {tts.error && (
                <span className="text-[10px] text-red-400 hidden sm:inline">{tts.error}</span>
              )}
              <button
                onClick={() => setTocOpen((v) => !v)}
                className={cn(
                  "flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors",
                  tocOpen
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "border-border/40 text-muted-foreground hover:text-foreground"
                )}
              >
                <BookOpen className="w-3 h-3" />
                <span className="hidden sm:inline">Índice</span>
              </button>
              <button
                onClick={regenerate}
                className="p-1.5 rounded-lg border border-border/40 text-muted-foreground hover:text-foreground transition-colors"
                title="Regenerar"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Table of contents dropdown */}
          <AnimatePresence>
            {tocOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden border-t border-border/20"
              >
                <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3 space-y-1">
                  {chapters.map((ch, i) => (
                    <button
                      key={ch.id}
                      onClick={() => { setChapterIdx(i); setTocOpen(false); contentRef.current?.scrollTo({ top: 0 }); }}
                      className={cn(
                        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                        i === chapterIdx
                          ? "bg-primary/10 text-primary font-medium"
                          : i < chapterIdx
                          ? "text-foreground/60 hover:text-foreground hover:bg-muted/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
                      )}
                    >
                      <span className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                        i < chapterIdx ? "bg-emerald-500/20 text-emerald-400" :
                        i === chapterIdx ? "bg-primary/20 text-primary" :
                        "bg-muted/40 text-muted-foreground/60"
                      )}>
                        {i < chapterIdx ? "✓" : i + 1}
                      </span>
                      <span className="truncate">{ch.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Chapter content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter?.id ?? "loading"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto px-4 sm:px-6 py-8"
          >
            {isSingleChapter && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => tts.isEnabled ? tts.disable() : tts.enable(chapterText(chapterIdx))}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border transition-colors",
                      tts.isEnabled
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border/40 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tts.isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : tts.isPlaying ? (
                      <Volume2 className="w-3 h-3 animate-pulse" />
                    ) : tts.isEnabled ? (
                      <Volume2 className="w-3 h-3" />
                    ) : (
                      <VolumeX className="w-3 h-3" />
                    )}
                    {tts.isLoading ? "Cargando…" : tts.isEnabled ? "Narrando" : "Escuchar"}
                  </button>
                  {tts.error && (
                    <span className="text-[10px] text-red-400">{tts.error}</span>
                  )}
                </div>
                <button onClick={regenerate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" />Regenerar
                </button>
              </div>
            )}

            {chapter && <MarkdownRenderer>{chapter.content || chapter.title}</MarkdownRenderer>}

            {/* Chapter navigation */}
            <div className={cn("flex items-center mt-10 pt-6 border-t border-border/30", chapterIdx === 0 ? "justify-end" : "justify-between")}>
              {chapterIdx > 0 && (
                <Button
                  variant="ghost" size="sm"
                  onClick={() => { setChapterIdx((v) => v - 1); contentRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
                  className="gap-2 text-xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />Anterior
                </Button>
              )}
              <Button
                size="sm"
                onClick={goNext}
                className={cn("gap-2 text-xs", isLast && "bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                {isLast ? (
                  <><Trophy className="w-3.5 h-3.5" />Completar lección</>
                ) : (
                  <>Siguiente capítulo <ChevronRight className="w-3.5 h-3.5" /></>
                )}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {completion && (
          <ProactivePanel
            info={completion}
            onAskQuestion={() => {}}
            onSuggestion={handleSuggestion}
            onDismiss={() => setCompletion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Quiz view ─────────────────────────────────────────────────────────────────

export function QuizView({ task, userId }: ViewProps) {
  const { content, loading, regenerate } = useTaskContent(task);
  const [completion, setCompletion] = useState<CompletionInfo | null>(null);

  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [recordOutcome] = useMutation(RECORD_STUDY_OUTCOME, { client: aiClient });

  const storedQs = (content as { questions?: QuizQuestion[] })?.questions;
  const questions: QuizQuestion[] = Array.isArray(storedQs) && storedQs.length > 0 ? storedQs : [];

  const score = questions.filter((q, i) => {
    const sel = selected[i];
    return sel && q.options.find((o) => o.label === sel)?.isCorrect;
  }).length;

  const handleFinish = useCallback(() => {
    const pct = Math.round((score / questions.length) * 100);
    recordOutcome({ variables: { input: { taskId: task.id, outcomeType: "quiz", scoreCorrect: score, scoreTotal: questions.length } } }).catch(() => {});
    setCompletion({ type: "quiz", score: pct, taskTitle: task.title });
  }, [score, questions.length, task.id, task.title, recordOutcome]);

  if (loading) return <LoadingState label="Preparando quiz…" />;

  if (questions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-sm text-muted-foreground">No se pudieron cargar las preguntas.</p>
      <Button onClick={regenerate} className="gap-2"><Sparkles className="w-3.5 h-3.5" />Regenerar quiz</Button>
    </div>
  );

  const q = questions[idx];
  const isLast = idx === questions.length - 1;

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 w-full">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <span className="text-xs text-muted-foreground shrink-0">Pregunta {idx + 1} de {questions.length}</span>
          <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
          </div>
          <button onClick={regenerate} className="text-muted-foreground hover:text-foreground shrink-0">
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={idx} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col">
            <p className="text-lg font-semibold leading-snug mb-6">{q.text}</p>
            <div className="space-y-3">
              {q.options.map((opt) => {
                const isSel = selected[idx] === opt.label;
                return (
                  <button key={opt.label}
                    onClick={() => !checked && setSelected((p) => ({ ...p, [idx]: opt.label }))}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all",
                      checked
                        ? opt.isCorrect ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                          : isSel ? "border-red-500/60 bg-red-500/10 text-red-400"
                          : "border-border/30 text-muted-foreground opacity-50"
                        : isSel ? "border-primary bg-primary/10 text-foreground"
                          : "border-border/50 hover:border-primary/40 hover:bg-primary/5 text-foreground"
                    )}>
                    <span className={cn("w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 uppercase",
                      checked && opt.isCorrect ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                        : checked && isSel ? "border-red-500 bg-red-500/20 text-red-400"
                        : isSel ? "border-primary bg-primary/20 text-primary"
                        : "border-muted-foreground/40 text-muted-foreground")}>
                      {opt.label}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {checked && q.explanation && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-start gap-2 text-xs bg-muted/30 border border-border/40 rounded-xl p-3">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{q.explanation}</span>
              </motion.div>
            )}

            <div className="flex items-center justify-between mt-auto pt-6">
              <Button variant="ghost" size="sm" onClick={() => { setIdx((v) => v - 1); setChecked(false); }}
                disabled={idx === 0} className="gap-2 text-xs">
                <ChevronLeft className="w-3.5 h-3.5" />Anterior
              </Button>
              {!checked ? (
                <Button size="sm" onClick={() => setChecked(true)} disabled={!selected[idx]} className="text-xs">Verificar</Button>
              ) : isLast ? (
                <Button size="sm" onClick={handleFinish} className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700">
                  <Trophy className="w-3.5 h-3.5" />Ver resultado
                </Button>
              ) : (
                <Button size="sm" onClick={() => { setIdx((v) => v + 1); setChecked(false); }} className="gap-2 text-xs">
                  Siguiente <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {completion && (
          <ProactivePanel
            info={completion}
            onAskQuestion={() => {}}
            onSuggestion={() => setCompletion(null)}
            onDismiss={() => setCompletion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Flashcard view ────────────────────────────────────────────────────────────

export function FlashcardMainView({ task, userId }: ViewProps) {
  const { content, loading, regenerate } = useTaskContent(task);
  const [completion, setCompletion] = useState<CompletionInfo | null>(null);
  const [recordOutcome] = useMutation(RECORD_STUDY_OUTCOME, { client: aiClient });

  const storedCards = (content as { cards?: { front: string; back: string }[] })?.cards;
  const cards = Array.isArray(storedCards) && storedCards.length > 0 ? storedCards : [];

  if (loading) return <LoadingState label="Cargando flashcards…" />;

  if (cards.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-sm text-muted-foreground">No se encontraron flashcards.</p>
      <Button onClick={regenerate} className="gap-2"><Sparkles className="w-3.5 h-3.5" />Generar</Button>
    </div>
  );

  return (
    <div className="relative flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <span className="text-sm font-medium text-muted-foreground">{cards.length} tarjetas</span>
        <button onClick={regenerate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" />Regenerar
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FlashcardSession
          cards={cards}
          onComplete={() => {
            recordOutcome({ variables: { input: { taskId: task.id, outcomeType: "flashcard", cardsReviewed: cards.length } } }).catch(() => {});
            setCompletion({ type: "flashcard", cardsReviewed: cards.length, taskTitle: task.title });
          }}
          onClose={() => {}}
        />
      </div>

      <AnimatePresence>
        {completion && (
          <ProactivePanel
            info={completion}
            onAskQuestion={() => {}}
            onSuggestion={() => setCompletion(null)}
            onDismiss={() => setCompletion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Practice view ─────────────────────────────────────────────────────────────

export function PracticeView({ task, userId, buildContext }: ViewProps) {
  const { content, loading, regenerate } = useTaskContent(task);
  const [completion, setCompletion] = useState<CompletionInfo | null>(null);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });
  const [recordOutcome] = useMutation(RECORD_STUDY_OUTCOME, { client: aiClient });

  const exercise = (content as { content?: string; exercise?: string })?.exercise
    ?? (content as { content?: string })?.content ?? "";

  const review = useCallback(async () => {
    if (!answer.trim()) return;
    setReviewing(true);
    setFeedback("");
    try {
      const { data } = await sendMsg({
        variables: {
          input: {
            message: `Ejercicio:\n${exercise}\n\nRespuesta del estudiante:\n${answer}\n\nRevisa: ¿qué está bien, qué mejorar, cuál es la solución correcta? Sé constructivo.`,
            useRag: false,
            contentGeneration: true,
            userProfile: userId ? { userId } : undefined,
          },
        },
      });
      const r = data?.sendMessage;
      setFeedback(r?.reply ?? "");
      recordOutcome({ variables: { input: { taskId: task.id, outcomeType: "practice" } } }).catch(() => {});
      setCompletion({ type: "practice", taskTitle: task.title });
    } catch { setFeedback("Error al revisar."); }
    finally { setReviewing(false); }
  }, [answer, exercise, userId, sendMsg, task.id, task.title, recordOutcome]);

  return (
    <div className="relative flex flex-col h-full max-w-2xl mx-auto px-6 py-6 w-full gap-4 overflow-y-auto">
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />Ejercicio
          </h3>
          <button onClick={regenerate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-3 h-3" />Nuevo ejercicio
          </button>
        </div>
        {loading ? (
          <div className="h-32 rounded-xl bg-muted/20 border border-border/40 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
          </div>
        ) : (
          <div className="rounded-xl bg-muted/20 border border-border/40 p-4 max-h-60 overflow-y-auto">
            <MarkdownRenderer>{exercise}</MarkdownRenderer>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-primary" />Tu respuesta
        </h3>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu solución aquí…"
          rows={6}
          className="rounded-xl border border-border/50 bg-muted/20 p-4 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40"
        />
        <Button onClick={review} disabled={reviewing || !answer.trim() || loading} className="gap-2 self-end">
          {reviewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Revisar con IA
        </Button>
      </div>

      {feedback && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="shrink-0 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />Retroalimentación
          </p>
          <MarkdownRenderer>{feedback}</MarkdownRenderer>
        </motion.div>
      )}

      <AnimatePresence>
        {completion && feedback && (
          <ProactivePanel
            info={completion}
            onAskQuestion={() => {}}
            onSuggestion={() => setCompletion(null)}
            onDismiss={() => setCompletion(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Default task view ─────────────────────────────────────────────────────────

export function DefaultTaskView({ task }: { task: PlanningTask }) {
  const type = task.contentType ?? task.category;
  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-8 w-full gap-6 overflow-y-auto">
      {task.description && (
        <div className="rounded-xl bg-muted/20 border border-border/40 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Descripción</p>
          <p className="text-sm leading-relaxed text-foreground/85">{task.description}</p>
        </div>
      )}
      {type === "video" && (
        <div className="rounded-xl bg-muted/20 border border-border/40 p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Video</p>
          <input placeholder="Pega la URL del video aquí…"
            className="w-full rounded-lg border border-border/50 bg-muted/20 px-3 py-2 text-sm focus:outline-none focus:border-primary/50" />
        </div>
      )}
      <div className="flex flex-col gap-2 flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas personales</p>
        <textarea placeholder="Agrega notas sobre esta tarea…"
          className="flex-1 min-h-[180px] rounded-xl border border-border/50 bg-muted/20 p-4 text-sm resize-none focus:outline-none focus:border-primary/50 transition-colors placeholder:text-muted-foreground/40" />
      </div>
    </div>
  );
}

// ── Loading state ─────────────────────────────────────────────────────────────

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export function TaskMainContent({ task, userId, buildContext }: ViewProps) {
  const type = (task.contentType ?? task.category) as TaskCategory;
  const props = { task, userId, buildContext };
  switch (type) {
    case "reading":
    case "lesson":
      return <ReadingView {...props} />;
    case "quiz":
      return <QuizView {...props} />;
    case "flashcard":
      return <FlashcardMainView {...props} />;
    case "practice":
      return <PracticeView {...props} />;
    default:
      return <DefaultTaskView task={task} />;
  }
}

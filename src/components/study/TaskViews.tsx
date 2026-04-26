"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import { FlashcardSession } from "@/components/study/FlashcardSession";
import type { PlanningTask, TaskCategory } from "@/types/planning";
import {
  Loader2, Sparkles, RefreshCw, ChevronLeft, ChevronRight,
  Trophy, RotateCcw, Lightbulb, FileCode, StickyNote, Bot,
} from "lucide-react";

// ── Shared types ──────────────────────────────────────────────────────────────

interface ViewProps {
  task: PlanningTask;
  userId: string | null;
  buildContext: () => string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

interface QuizQuestion {
  text: string;
  options: { label: string; text: string; isCorrect: boolean }[];
  explanation?: string;
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

// ── Reading / Lesson view ─────────────────────────────────────────────────────

export function ReadingView({ task, userId, buildContext }: ViewProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  const generate = useCallback(async () => {
    setLoading(true);
    setContent("");
    const ctx = buildContext();
    const isLesson = (task.contentType ?? task.category) === "lesson";
    const prompt = isLesson
      ? `${ctx}\n\nCrea una lección completa y detallada sobre "${task.title}".\n\nEstructura requerida:\n# ${task.title}\n## Introducción\n## Conceptos Fundamentales\n## Explicación Detallada\n## Ejemplos Prácticos\n## Resumen\n## Preguntas de Reflexión\n\nSé didáctico, usa ejemplos del mundo real. Si hay fórmulas usa LaTeX inline ($...$) o bloque ($$...$$).`
      : `${ctx}\n\nCrea un artículo de lectura completo y estructurado sobre "${task.title}". Incluye: contexto, ideas principales, análisis profundo, ejemplos concretos y conclusión. Usa markdown con secciones claras y bien desarrolladas.`;
    try {
      const { data } = await sendMsg({
        variables: { input: { message: prompt, sessionId: sessionRef.current ?? undefined, useRag: true, userProfile: userId ? { userId } : undefined } },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) sessionRef.current = r.sessionId;
      setContent(r?.reply ?? "");
    } catch { setContent("Error al generar el contenido. Intenta de nuevo."); }
    finally { setLoading(false); }
  }, [task, userId, buildContext, sendMsg]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const pct = el.scrollTop / (el.scrollHeight - el.clientHeight);
    setProgress(Math.min(100, Math.round(pct * 100)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Reading progress bar */}
      <div className="h-1 bg-muted/30 shrink-0">
        <motion.div className="h-full bg-primary" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
              <p className="text-sm text-muted-foreground">Generando contenido…</p>
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <button onClick={generate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <RefreshCw className="w-3 h-3" />Regenerar
                </button>
              </div>
              {content && <MarkdownRenderer>{content}</MarkdownRenderer>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Quiz view ─────────────────────────────────────────────────────────────────

export function QuizView({ task, userId, buildContext }: ViewProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [rawFallback, setRawFallback] = useState("");
  const [loading, setLoading] = useState(true);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  const generate = useCallback(async () => {
    setLoading(true);
    setQuestions([]); setRawFallback(""); setIdx(0); setSelected({}); setChecked(false); setDone(false);
    const ctx = buildContext();
    const prompt = `${ctx}\n\nCrea un quiz de 8 preguntas de opción múltiple sobre "${task.title}".\n\nFormato para cada pregunta:\n[N]. [Pregunta]\na) [opción]\nb) [opción]*\nc) [opción]\nd) [opción]\n\nMarca la respuesta correcta con *. Separa con línea en blanco entre preguntas.`;
    try {
      const { data } = await sendMsg({
        variables: { input: { message: prompt, sessionId: sessionRef.current ?? undefined, useRag: true, userProfile: userId ? { userId } : undefined } },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) sessionRef.current = r.sessionId;
      const raw = r?.reply ?? "";
      const parsed = parseQuiz(raw);
      if (parsed.length > 0) setQuestions(parsed); else setRawFallback(raw);
    } catch { setRawFallback("Error al generar el quiz."); }
    finally { setLoading(false); }
  }, [task, userId, buildContext, sendMsg]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const score = questions.filter((q, i) => {
    const sel = selected[i];
    return sel && q.options.find((o) => o.label === sel)?.isCorrect;
  }).length;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      <p className="text-sm text-muted-foreground">Generando quiz…</p>
    </div>
  );

  if (rawFallback) return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 gap-4">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Quiz</span>
        <button onClick={generate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"><RefreshCw className="w-3 h-3" />Regenerar</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <MarkdownRenderer>{rawFallback}</MarkdownRenderer>
      </div>
    </div>
  );

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 px-8 text-center">
        <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-4xl",
          pct >= 80 ? "bg-emerald-500/10" : pct >= 60 ? "bg-amber-500/10" : "bg-red-500/10")}>
          {pct >= 80 ? "🎉" : pct >= 60 ? "📚" : "💪"}
        </div>
        <div>
          <p className="text-2xl font-bold">{score}/{questions.length} correctas</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {pct >= 80 ? "¡Excelente dominio del tema!" : pct >= 60 ? "Buen progreso, sigue repasando" : "Sigue estudiando, puedes mejorar"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setIdx(0); setSelected({}); setChecked(false); setDone(false); }} className="gap-2">
            <RotateCcw className="w-3.5 h-3.5" />Repetir
          </Button>
          <Button onClick={generate} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />Nuevo quiz
          </Button>
        </div>
        <div className="w-full max-w-lg space-y-2 mt-2 text-left">
          {questions.map((q, i) => {
            const sel = selected[i];
            const correct = q.options.find((o) => o.isCorrect);
            const isOk = sel && q.options.find((o) => o.label === sel)?.isCorrect;
            return (
              <div key={i} className={cn("rounded-xl p-3 border text-xs",
                isOk ? "border-emerald-500/30 bg-emerald-500/5" : "border-red-500/30 bg-red-500/5")}>
                <p className="font-medium">{i + 1}. {q.text}</p>
                <p className="text-muted-foreground mt-0.5">
                  {isOk ? "✓ Correcto" : `✗ Correcta: ${correct?.label}) ${correct?.text}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const q = questions[idx];
  if (!q) return null;
  const isLast = idx === questions.length - 1;

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 w-full">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <span className="text-xs text-muted-foreground shrink-0">Pregunta {idx + 1} de {questions.length}</span>
        <div className="flex-1 h-1.5 bg-muted/40 rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
        <button onClick={generate} className="text-muted-foreground hover:text-foreground shrink-0">
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
                <button
                  key={opt.label}
                  onClick={() => !checked && setSelected((p) => ({ ...p, [idx]: opt.label }))}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm text-left transition-all",
                    checked
                      ? opt.isCorrect
                        ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                        : isSel
                          ? "border-red-500/60 bg-red-500/10 text-red-400"
                          : "border-border/30 text-muted-foreground opacity-50"
                      : isSel
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border/50 hover:border-primary/40 hover:bg-primary/5 text-foreground"
                  )}
                >
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
              <Button size="sm" onClick={() => setDone(true)} className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700">
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
  );
}

// ── Flashcard main view ───────────────────────────────────────────────────────

export function FlashcardMainView({ task, userId, buildContext }: ViewProps) {
  const [cards, setCards] = useState<{ front: string; back: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  const generate = useCallback(async () => {
    setLoading(true);
    setCards([]);
    const ctx = buildContext();
    const prompt = `${ctx}\n\nGenera 12 flashcards de estudio sobre "${task.title}".\n\nFormato exacto (una por bloque):\n\nFRENTE: [concepto o pregunta]\nREVERSO: [definición o respuesta]\n\nSepara con línea en blanco.`;
    try {
      const { data } = await sendMsg({
        variables: { input: { message: prompt, sessionId: sessionRef.current ?? undefined, useRag: true, userProfile: userId ? { userId } : undefined } },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) sessionRef.current = r.sessionId;
      setCards(parseFlashcards(r?.reply ?? ""));
    } catch { setCards([]); }
    finally { setLoading(false); }
  }, [task, userId, buildContext, sendMsg]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
      <p className="text-sm text-muted-foreground">Generando flashcards…</p>
    </div>
  );

  if (cards.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-sm text-muted-foreground">No se generaron flashcards.</p>
      <Button onClick={generate} className="gap-2"><Sparkles className="w-3.5 h-3.5" />Generar</Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/40 shrink-0">
        <span className="text-sm font-medium text-muted-foreground">{cards.length} tarjetas</span>
        <button onClick={generate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" />Regenerar
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        <FlashcardSession cards={cards} onComplete={() => {}} onClose={() => {}} />
      </div>
    </div>
  );
}

// ── Practice view ─────────────────────────────────────────────────────────────

export function PracticeView({ task, userId, buildContext }: ViewProps) {
  const [exercise, setExercise] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const sessionRef = useRef<string | null>(null);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  const generate = useCallback(async () => {
    setLoading(true);
    setExercise(""); setAnswer(""); setFeedback("");
    const ctx = buildContext();
    const prompt = `${ctx}\n\nCrea un ejercicio práctico concreto sobre "${task.title}". Incluye: descripción clara del problema, lo que se espera como respuesta, y si aplica código de ejemplo o datos de entrada. Sé específico.`;
    try {
      const { data } = await sendMsg({
        variables: { input: { message: prompt, sessionId: sessionRef.current ?? undefined, useRag: true, userProfile: userId ? { userId } : undefined } },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) sessionRef.current = r.sessionId;
      setExercise(r?.reply ?? "");
    } catch { setExercise("Error al generar el ejercicio."); }
    finally { setLoading(false); }
  }, [task, userId, buildContext, sendMsg]);

  const review = useCallback(async () => {
    if (!answer.trim()) return;
    setReviewing(true);
    setFeedback("");
    try {
      const { data } = await sendMsg({
        variables: {
          input: {
            message: `Ejercicio:\n${exercise}\n\nRespuesta del estudiante:\n${answer}\n\nRevisa la respuesta: indica qué está bien, qué mejorar y la solución correcta si hay errores. Sé constructivo.`,
            sessionId: sessionRef.current ?? undefined, useRag: false, userProfile: userId ? { userId } : undefined,
          },
        },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) sessionRef.current = r.sessionId;
      setFeedback(r?.reply ?? "");
    } catch { setFeedback("Error al revisar."); }
    finally { setReviewing(false); }
  }, [answer, exercise, userId, sendMsg]);

  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto px-6 py-6 w-full gap-4 overflow-y-auto">
      {/* Exercise */}
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />Ejercicio
          </h3>
          <button onClick={generate} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
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

      {/* Answer */}
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

      {/* Feedback */}
      {feedback && (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
          className="shrink-0 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />Retroalimentación
          </p>
          <MarkdownRenderer>{feedback}</MarkdownRenderer>
        </motion.div>
      )}
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

"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import type { LibraryBook } from "@/types/library";
import { BOOK_CATEGORY_CONFIG } from "@/data/curated-books";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import { Button } from "@/components/ui/button";
import {
  X, Sparkles, Lightbulb, SendHorizonal, Loader2,
  Clock, FileText, BookOpen, ChevronRight, BookMarked,
  BarChart2, AlertTriangle, Dumbbell, ChevronDown,
} from "lucide-react";

interface BookDetailProps {
  book: LibraryBook;
  onClose: () => void;
}

interface QAMessage {
  role: "user" | "assistant";
  text: string;
}

type Tab = "resumen" | "capitulos" | "analisis" | "criticas" | "ejercicios" | "chat";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "resumen", label: "Resumen", icon: <FileText className="w-3 h-3" /> },
  { id: "capitulos", label: "Capítulos", icon: <BookMarked className="w-3 h-3" /> },
  { id: "analisis", label: "Análisis", icon: <BarChart2 className="w-3 h-3" /> },
  { id: "criticas", label: "Críticas", icon: <AlertTriangle className="w-3 h-3" /> },
  { id: "ejercicios", label: "Ejercicios", icon: <Dumbbell className="w-3 h-3" /> },
  { id: "chat", label: "Chat IA", icon: <Sparkles className="w-3 h-3" /> },
];

const STARTER_QUESTIONS = [
  "¿Cuál es el concepto más importante de este libro?",
  "¿Cómo aplico esto en mi vida hoy?",
  "Dame un plan de acción basado en este libro",
  "¿Cuál es la idea más contraintuitiva?",
];

export function BookDetail({ book, onClose }: BookDetailProps) {
  const cat = BOOK_CATEGORY_CONFIG[book.category];
  const [tab, setTab] = useState<Tab>("resumen");
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<number | null>(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { track } = useTrackInteraction();
  const chapterTimers = useRef<Record<number, number>>({});

  const [sendMsg, { loading }] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track when a chapter is opened/closed. A chapter counts as "read" once the
  // user has kept it expanded for ≥30s.
  useEffect(() => {
    if (expandedChapter == null) return;
    const idx = expandedChapter;
    const startedAt = Date.now();
    chapterTimers.current[idx] = startedAt;
    const t = setTimeout(() => {
      track("book.chapter.read", {
        targetId: book.id,
        targetType: "book",
        durationMs: 30_000,
        workspaceId: String(idx),
      });
    }, 30_000);
    return () => {
      clearTimeout(t);
      const stayed = Date.now() - startedAt;
      if (stayed > 1_500) {
        track("book.chapter.dwell", {
          targetId: book.id,
          targetType: "book",
          durationMs: stayed,
          workspaceId: String(idx),
        });
      }
    };
  }, [expandedChapter, book.id, track]);

  // When the last chapter has been opened, treat the book as completed.
  useEffect(() => {
    const total = book.chapters.length;
    if (total > 0 && expandedChapter === total - 1) {
      track("book.completed", { targetId: book.id, targetType: "book" });
    }
  }, [expandedChapter, book.chapters.length, book.id, track]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);
    try {
      const contextMsg = `Contexto del libro: ${book.aiContext}\n\nPregunta: ${q}`;
      const { data } = await sendMsg({
        variables: { input: { message: contextMsg, sessionId: sessionId ?? null } },
      });
      const result = data?.sendMessage;
      if (result?.reply) {
        setSessionId(result.sessionId ?? null);
        setMessages((prev) => [...prev, { role: "assistant", text: result.reply }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error al consultar la IA." }]);
    }
  };

  const hasChapters = book.chapters.length > 0;
  const hasAnalysis = book.analysis.length > 0;
  const hasCritiques = book.critiques.length > 0;
  const hasExercises = book.exercises.length > 0;

  const visibleTabs = TABS.filter((t) => {
    if (t.id === "capitulos") return hasChapters;
    if (t.id === "analisis") return hasAnalysis;
    if (t.id === "criticas") return hasCritiques;
    if (t.id === "ejercicios") return hasExercises;
    return true;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Top color bar */}
      <div className={cn("h-1.5 w-full bg-gradient-to-r shrink-0", book.coverGradient)} />

      {/* Header */}
      <div className="flex items-start justify-between px-5 py-4 border-b border-border/40 shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-1.5", cat.bg, cat.color, cat.border)}>
            {cat.label}
          </div>
          <h2 className="font-heading font-bold text-base leading-tight">{book.title}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{book.author} · {book.year}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{book.pages} págs</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{book.readMinutes} min</span>
            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{book.insights.length} insights</span>
            {hasChapters && (
              <span className="flex items-center gap-1"><BookMarked className="w-3 h-3" />{book.chapters.length} caps</span>
            )}
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex items-center gap-0.5 px-4 pt-2 pb-0 border-b border-border/30 overflow-x-auto scrollbar-none">
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-t-md whitespace-nowrap transition-colors border-b-2",
              tab === t.id
                ? "text-foreground border-violet-500 bg-violet-500/5"
                : "text-muted-foreground/60 border-transparent hover:text-muted-foreground hover:bg-muted/30"
            )}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {/* RESUMEN */}
            {tab === "resumen" && (
              <div className="space-y-5">
                {book.overview ? (
                  <div className="prose prose-sm prose-invert max-w-none text-foreground/80 prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground prose-table:text-xs">
                    <ReactMarkdown>{book.overview}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground/90 leading-relaxed">{book.summary}</p>
                )}

                {book.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {book.tags.map((tag) => (
                      <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Ideas clave</p>
                  </div>
                  <div className="space-y-2">
                    {book.insights.map((insight, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <span className={cn("mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br text-white", book.coverGradient)}>
                          {i + 1}
                        </span>
                        <span className="leading-relaxed text-foreground/80">{insight}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* CAPÍTULOS */}
            {tab === "capitulos" && (
              <div className="space-y-2">
                {book.chapters.map((chapter, i) => (
                  <div key={i} className="rounded-xl border border-border/40 overflow-hidden">
                    <button
                      onClick={() => setExpandedChapter(expandedChapter === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={cn("shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold bg-gradient-to-br text-white", book.coverGradient)}>
                          {i + 1}
                        </span>
                        <span className="text-sm font-medium truncate">{chapter.title}</span>
                      </div>
                      <ChevronDown className={cn("w-4 h-4 shrink-0 text-muted-foreground/40 transition-transform", expandedChapter === i && "rotate-180")} />
                    </button>
                    <AnimatePresence initial={false}>
                      {expandedChapter === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t border-border/30">
                            <div className="prose prose-sm prose-invert max-w-none text-foreground/75 prose-headings:text-foreground prose-headings:font-semibold prose-headings:text-sm prose-strong:text-foreground/90 prose-table:text-xs">
                              <ReactMarkdown>{chapter.content}</ReactMarkdown>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {/* ANÁLISIS */}
            {tab === "analisis" && (
              <div className="prose prose-sm prose-invert max-w-none text-foreground/80 prose-headings:text-foreground prose-headings:font-semibold prose-strong:text-foreground">
                <ReactMarkdown>{book.analysis}</ReactMarkdown>
              </div>
            )}

            {/* CRÍTICAS */}
            {tab === "criticas" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground/50 uppercase tracking-wider font-semibold mb-4">Contraargumentos y limitaciones</p>
                {book.critiques.map((critique, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/15"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400/70 shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80 leading-relaxed">{critique}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* EJERCICIOS */}
            {tab === "ejercicios" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground/50 uppercase tracking-wider font-semibold mb-4">Ejercicios prácticos</p>
                {book.exercises.map((ex, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-4 rounded-xl border border-border/40 bg-card/30 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                        ex.type === "reflection"
                          ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                          : "bg-teal-500/10 text-teal-400 border-teal-500/20"
                      )}>
                        {ex.type === "reflection" ? "Reflexión" : "Acción"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40">Ejercicio {i + 1}</span>
                    </div>
                    <p className="text-sm text-foreground/85 leading-relaxed">{ex.prompt}</p>
                  </motion.div>
                ))}
              </div>
            )}

            {/* CHAT IA */}
            {tab === "chat" && (
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((m, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "bg-primary/10 text-foreground ml-6"
                          : "bg-muted/40 text-foreground/90 mr-6"
                      )}
                    >
                      {m.text}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {loading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Pensando…
                  </div>
                )}

                {messages.length === 0 && (
                  <div className="grid grid-cols-1 gap-1.5">
                    {STARTER_QUESTIONS.map((q) => (
                      <button
                        key={q}
                        onClick={() => ask(q)}
                        disabled={loading}
                        className="flex items-center gap-2 text-left text-xs px-3 py-2 rounded-lg border border-border/50 bg-card/40 hover:bg-card/80 hover:border-violet-500/40 transition-all group"
                      >
                        <ChevronRight className="w-3 h-3 text-violet-400/60 shrink-0 group-hover:text-violet-400 transition-colors" />
                        {q}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Chat input — only visible on chat tab */}
      {tab === "chat" && (
        <div className="shrink-0 px-5 pb-4 pt-2 border-t border-border/30">
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 focus-within:border-violet-500/50 transition-colors px-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre este libro…"
              className="flex-1 bg-transparent outline-none py-2.5 text-sm placeholder:text-muted-foreground/50"
              disabled={loading}
            />
            <Button type="submit" size="icon" variant="ghost" disabled={loading || !input.trim()} className="h-7 w-7 shrink-0">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

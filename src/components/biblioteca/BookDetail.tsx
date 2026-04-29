"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import type { LibraryBook } from "@/types/library";
import { BOOK_CATEGORY_CONFIG } from "@/data/curated-books";
import { Button } from "@/components/ui/button";
import {
  X, Sparkles, Lightbulb, SendHorizonal, Loader2,
  Clock, FileText, BookOpen, ChevronRight,
} from "lucide-react";

interface BookDetailProps {
  book: LibraryBook;
  onClose: () => void;
}

interface QAMessage {
  role: "user" | "assistant";
  text: string;
}

const STARTER_QUESTIONS = [
  "¿Cuál es el concepto más importante de este libro?",
  "¿Cómo aplico esto en mi vida hoy?",
  "Dame un plan de acción basado en este libro",
  "¿Cuál es la idea más contraintuitiva?",
];

export function BookDetail({ book, onClose }: BookDetailProps) {
  const cat = BOOK_CATEGORY_CONFIG[book.category];
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sendMsg, { loading }] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const ask = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);

    try {
      const contextMsg = `Contexto del libro: ${book.aiContext}\n\nPregunta: ${q}`;
      const { data } = await sendMsg({
        variables: {
          input: {
            message: contextMsg,
            sessionId: sessionId ?? null,
          },
        },
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn("h-1.5 w-full bg-gradient-to-r shrink-0", book.coverGradient)} />
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
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Summary */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50 mb-2">Resumen</p>
          <p className="text-sm text-muted-foreground/90 leading-relaxed">{book.summary}</p>
        </div>

        {/* Tags */}
        {book.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {book.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border/40">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Key insights */}
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
                transition={{ delay: i * 0.05 }}
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

        {/* Divider */}
        <div className="border-t border-border/30 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/50">Explorar con IA</p>
          </div>

          {/* Q&A messages */}
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "mb-3 rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
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
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Loader2 className="w-3 h-3 animate-spin" />
              Pensando…
            </div>
          )}

          {/* Starter questions (shown when no messages) */}
          {messages.length === 0 && (
            <div className="grid grid-cols-1 gap-1.5 mb-3">
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
      </div>

      {/* Input */}
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
    </div>
  );
}

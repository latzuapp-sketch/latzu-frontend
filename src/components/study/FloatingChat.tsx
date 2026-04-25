"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import { MessageCircle, X, Send, Loader2, Bot, User } from "lucide-react";
import type { PlanningTask } from "@/types/planning";

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface FloatingChatProps {
  task: PlanningTask;
  userId: string | null;
  buildContext: () => string;
}

export function FloatingChat({ task, userId, buildContext }: FloatingChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const sessionIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  const streamText = useCallback((msgId: string, text: string, onDone: () => void) => {
    if (streamRef.current) clearInterval(streamRef.current);
    let pos = 0;
    streamRef.current = setInterval(() => {
      pos += 14;
      const done = pos >= text.length;
      setMessages((prev) =>
        prev.map((m) => m.id === msgId ? { ...m, content: done ? text : text.slice(0, pos), streaming: !done } : m)
      );
      if (done) { clearInterval(streamRef.current!); streamRef.current = null; onDone(); }
    }, 16);
  }, []);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setLoading(true);
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    const assistId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistId, role: "assistant", content: "", streaming: true }]);
    try {
      const ctx = buildContext();
      const { data } = await sendMsg({
        variables: {
          input: {
            message: ctx ? `${ctx}\n\nPregunta del estudiante: ${trimmed}` : trimmed,
            sessionId: sessionIdRef.current ?? undefined,
            useRag: true,
            userProfile: userId ? { userId } : undefined,
          },
        },
      });
      const result = data?.sendMessage;
      if (result?.sessionId) sessionIdRef.current = result.sessionId;
      streamText(assistId, result?.reply ?? "No pude procesar.", () => setLoading(false));
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === assistId ? { ...m, content: "Error. Intenta de nuevo.", streaming: false } : m)
      );
      setLoading(false);
    }
  }, [loading, buildContext, sendMsg, streamText, userId]);

  const starters = useMemo(() => [
    `Explícame ${task.title}`,
    "¿Cuáles son los conceptos clave?",
    "Dame un ejemplo práctico",
  ], [task.title]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ duration: 0.15 }}
            className="w-[340px] h-[460px] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-muted/20 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <Bot className="w-3 h-3 text-primary-foreground" />
                </div>
                <span className="text-sm font-medium">Tutor IA</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col gap-2 pt-2">
                  <p className="text-xs text-muted-foreground text-center mb-1">
                    Pregúntame sobre <strong>{task.title}</strong>
                  </p>
                  {starters.map((q) => (
                    <button key={q} onClick={() => send(q)}
                      className="text-left px-3 py-2 rounded-xl border border-border/50 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              ) : messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div key={msg.id} className={cn("flex gap-2", isUser && "flex-row-reverse")}>
                    <div className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isUser ? "bg-primary/20" : "bg-accent/20")}>
                      {isUser ? <User className="w-2.5 h-2.5 text-primary" /> : <Bot className="w-2.5 h-2.5" />}
                    </div>
                    <div className={cn("max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed",
                      isUser
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/60 border border-border/40 rounded-tl-sm")}>
                      {msg.streaming && !msg.content
                        ? <span className="flex gap-1">{[0, 150, 300].map((d) => <span key={d} className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
                        : isUser
                          ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                          : <MarkdownRenderer>{msg.content}</MarkdownRenderer>}
                      {msg.streaming && msg.content && <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse" />}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-3 pb-3 shrink-0">
              <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 focus-within:border-primary/50 transition-colors">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  placeholder="Pregunta algo…"
                  disabled={loading}
                  rows={1}
                  className="flex-1 bg-transparent text-xs resize-none focus:outline-none placeholder:text-muted-foreground/40 max-h-20 disabled:opacity-40"
                />
                <Button size="sm" onClick={() => send(input)} disabled={loading || !input.trim()} className="h-6 w-6 p-0 shrink-0">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors",
          open ? "bg-muted border border-border text-foreground" : "bg-primary text-primary-foreground"
        )}
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
        {!open && messages.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full text-[9px] font-bold flex items-center justify-center text-white">
            {messages.length > 9 ? "9+" : messages.length}
          </span>
        )}
      </motion.button>
    </div>
  );
}

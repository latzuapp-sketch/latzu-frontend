"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { STUDY_AGENT_MESSAGE } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Brain, Send, Loader2, X, Minimize2, Maximize2, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_STARTERS = [
  "Quiero crear un plan de estudio",
  "¿Cómo voy con mi plan actual?",
  "Adapta mi plan según mi progreso",
  "¿Qué debería estudiar hoy?",
];

interface StudyAgentChatProps {
  onClose: () => void;
}

export function StudyAgentChat({ onClose }: StudyAgentChatProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hola 👋 Soy tu Asesor de Estudio. Puedo ayudarte a **crear planes adaptativos**, analizar tu progreso y ajustar el plan según cómo te está yendo.\n\n¿En qué quieres trabajar hoy?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [studyAgentMessage] = useMutation(STUDY_AGENT_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const { data } = await studyAgentMessage({
          variables: {
            input: {
              message: trimmed,
              sessionId: sessionId ?? undefined,
              userProfile: userId ? { userId } : undefined,
            },
          },
        });
        const result = data?.studyAgentMessage;
        if (result?.sessionId) setSessionId(result.sessionId);
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-a",
            role: "assistant",
            content: result?.reply ?? "Lo siento, hubo un problema. Inténtalo de nuevo.",
            timestamp: new Date(),
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + "-err",
            role: "assistant",
            content: "Error de conexión. Verifica tu red e inténtalo de nuevo.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [loading, sessionId, userId, studyAgentMessage]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 16 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col bg-card border border-border/60 shadow-2xl rounded-2xl overflow-hidden",
        expanded
          ? "fixed inset-4 z-50"
          : "fixed bottom-4 right-4 z-50 w-[400px] h-[580px]"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/10 to-accent/5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
          <Brain className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Asesor de Estudio</p>
          <p className="text-[10px] text-muted-foreground">Planes adaptativos · Seguimiento · Predicciones</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-2.5",
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            )}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                "rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary/80 rounded-bl-sm"
              )}
            >
              {msg.role === "user" ? (
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-secondary/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex gap-1 py-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
                    style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick starters — only on first load */}
        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_STARTERS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border/40 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 focus-within:border-primary/50 transition-colors">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje… (Enter para enviar)"
            rows={1}
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none max-h-32 leading-relaxed disabled:opacity-50"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          <Button
            size="icon"
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="h-7 w-7 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

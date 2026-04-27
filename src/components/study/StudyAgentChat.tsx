"use client";

import { useState, useRef, useEffect, useCallback, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { aiClient, entityClient } from "@/lib/apollo";
import { STUDY_AGENT_MESSAGE, STUDY_AGENT_STREAM } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain, Send, X, Minimize2, Maximize2,
  CheckCircle2, AlertCircle, Loader2, ChevronDown,
  Sparkles, BookOpen, Zap, BarChart3, Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentAction {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  status: "success" | "error";
}

type MessageRole = "user" | "assistant" | "tool_pending" | "tool_done";

interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  action?: AgentAction;
  isPending?: boolean;
}

interface StudyAgentChatProps {
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const QUICK_STARTERS = [
  { icon: BookOpen, label: "Crear plan de estudio" },
  { icon: BarChart3, label: "¿Cómo voy con mi plan?" },
  { icon: Zap,      label: "¿Qué estudio hoy?" },
  { icon: Calendar, label: "Adapta mi plan" },
];

const PLAN_TOOLS = new Set([
  "create_study_plan", "create_plan", "create_task",
  "create_multiple_tasks", "update_task", "adapt_plan_tasks",
]);

const TOOL_LABEL: Record<string, { doing: string; done: string; icon: string }> = {
  create_study_plan:    { doing: "Creando plan de estudio…",        done: "Plan creado",             icon: "📚" },
  create_plan:          { doing: "Creando plan…",                   done: "Plan creado",             icon: "📋" },
  generate_task_content:{ doing: "Generando contenido inicial…",   done: "Contenido listo",         icon: "✨" },
  create_task:          { doing: "Creando tarea…",                 done: "Tarea creada",            icon: "✅" },
  create_multiple_tasks:{ doing: "Creando tareas…",                done: "Tareas creadas",          icon: "✅" },
  update_task:          { doing: "Actualizando tarea…",            done: "Tarea actualizada",       icon: "🔄" },
  get_learning_progress:{ doing: "Analizando tu progreso…",        done: "Progreso consultado",     icon: "📊" },
  get_plan_details:     { doing: "Cargando plan…",                 done: "Plan cargado",            icon: "📋" },
  adapt_plan_tasks:     { doing: "Adaptando tu plan…",             done: "Plan adaptado",           icon: "🧠" },
  get_study_predictions:{ doing: "Calculando predicciones…",       done: "Predicciones listas",     icon: "🔮" },
  record_study_outcome: { doing: "Guardando resultado…",           done: "Resultado registrado",    icon: "💾" },
  generate_proactive_insight: { doing: "Generando insight…",       done: "Insight generado",        icon: "💡" },
  get_due_flashcards:   { doing: "Buscando flashcards…",           done: "Flashcards listas",       icon: "🃏" },
  list_tasks:           { doing: "Consultando tareas…",            done: "Tareas consultadas",      icon: "📝" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolCard({ action, isPending }: { action: AgentAction; isPending: boolean }) {
  const meta = TOOL_LABEL[action.toolName];
  const label = isPending
    ? (meta?.doing ?? `${action.toolName}…`)
    : action.status === "success"
      ? (meta?.done ?? action.toolName)
      : `Error en ${action.toolName}`;
  const icon = meta?.icon ?? "⚙️";

  return (
    <motion.div
      initial={{ opacity: 0, x: -6, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs border mx-10 font-medium",
        isPending
          ? "bg-primary/5 border-primary/20 text-primary"
          : action.status === "success"
            ? "bg-emerald-500/8 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : "bg-red-500/8 border-red-500/20 text-red-600 dark:text-red-400"
      )}
    >
      <span className="text-sm leading-none">{icon}</span>
      <span className="flex-1">{label}</span>
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin shrink-0 opacity-60" />
      ) : action.status === "success" ? (
        <CheckCircle2 className="w-3 h-3 shrink-0 opacity-70" />
      ) : (
        <AlertCircle className="w-3 h-3 shrink-0 opacity-70" />
      )}
    </motion.div>
  );
}

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
        <Brain className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="bg-secondary/70 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2 max-w-[75%]">
        <div className="flex gap-[3px] items-center shrink-0">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 120}ms`, animationDuration: "800ms" }}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.15 }}
            className="text-xs text-muted-foreground"
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

function AssistantBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
        <Brain className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="bg-secondary/70 rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm max-w-[85%]">
        <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:leading-relaxed [&_strong]:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ content }: { content: string }) {
  return (
    <div className="flex flex-row-reverse">
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-3.5 py-2.5 text-sm max-w-[80%]">
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StudyAgentChat({ onClose }: StudyAgentChatProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const uid = useId();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: `${uid}-welcome`,
      role: "assistant",
      content: "Hola 👋 Soy tu **Asesor de Estudio**. Puedo crear planes adaptativos, analizar tu progreso y ajustar el plan en tiempo real.\n\n¿En qué trabajamos hoy?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState("Pensando…");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const subRef = useRef<{ unsubscribe(): void } | null>(null);
  // Map toolName → message id of the pending card
  const pendingCardsRef = useRef<Map<string, string>>(new Map());

  // Fallback mutation when WebSocket fails
  const [sendFallback] = useMutation(STUDY_AGENT_MESSAGE, { client: aiClient });

  // Auto-scroll
  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => {
    if (!isStreaming) scrollToBottom();
  }, [messages, isStreaming, scrollToBottom]);

  // Show scroll-to-bottom button when user scrolls up
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 120);
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const updateMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...patch } : m))
    );
  }, []);

  const buildUserProfile = useCallback(() => {
    if (!userId) return undefined;
    return { userId };
  }, [userId]);

  const THINKING_SEQUENCE = [
    "Pensando…",
    "Analizando tu solicitud…",
    "Preparando respuesta…",
  ];

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      // Add user bubble
      addMessage({ id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date() });
      setInput("");
      setIsStreaming(true);
      setThinkingLabel(THINKING_SEQUENCE[0]);
      pendingCardsRef.current.clear();

      // Rotate thinking labels until first tool fires
      let labelIdx = 0;
      const labelInterval = setInterval(() => {
        labelIdx = (labelIdx + 1) % THINKING_SEQUENCE.length;
        setThinkingLabel(THINKING_SEQUENCE[labelIdx]);
      }, 2200);

      const assistantId = crypto.randomUUID();
      // Reserve assistant bubble (empty until reply arrives)
      addMessage({ id: assistantId, role: "assistant", content: "", timestamp: new Date(), isPending: true });

      const input_vars = {
        message: trimmed,
        sessionId: sessionId ?? undefined,
        userProfile: buildUserProfile(),
      };

      const handleDone = (planToolUsed: boolean) => {
        clearInterval(labelInterval);
        setIsStreaming(false);
        if (planToolUsed) {
          entityClient.refetchQueries({ include: ["GetEntities", "GetPlans"] });
        }
        setTimeout(() => inputRef.current?.focus(), 80);
      };

      // ── WebSocket subscription ──────────────────────────────────────────────
      let planToolUsed = false;

      try {
        await new Promise<void>((resolve, reject) => {
          const sub = aiClient
            .subscribe<{ studyAgentStream: { eventType: string; toolName?: string; args?: Record<string,unknown>; result?: Record<string,unknown>; status?: string; reply?: string; sessionId?: string } }>({
              query: STUDY_AGENT_STREAM,
              variables: { input: input_vars },
            })
            .subscribe({
              next({ data }) {
                if (!data) return;
                const ev = data.studyAgentStream;

                if (ev.eventType === "tool_start" && ev.toolName) {
                  clearInterval(labelInterval);
                  const meta = TOOL_LABEL[ev.toolName];
                  setThinkingLabel(meta?.doing ?? `${ev.toolName}…`);

                  const cardId = crypto.randomUUID();
                  pendingCardsRef.current.set(ev.toolName, cardId);
                  addMessage({
                    id: cardId,
                    role: "tool_pending",
                    content: ev.toolName,
                    timestamp: new Date(),
                    action: { toolName: ev.toolName, args: ev.args ?? {}, result: {}, status: "success" },
                    isPending: true,
                  });
                  scrollToBottom();
                }

                else if (ev.eventType === "tool_complete" && ev.toolName) {
                  if (PLAN_TOOLS.has(ev.toolName)) planToolUsed = true;
                  const cardId = pendingCardsRef.current.get(ev.toolName);
                  if (cardId) {
                    updateMessage(cardId, {
                      role: "tool_done",
                      action: {
                        toolName: ev.toolName,
                        args: ev.args ?? {},
                        result: ev.result ?? {},
                        status: (ev.status ?? "success") as "success" | "error",
                      },
                      isPending: false,
                    });
                    pendingCardsRef.current.delete(ev.toolName);
                  }
                  setThinkingLabel("Preparando respuesta…");
                }

                else if (ev.eventType === "reply" && ev.reply) {
                  if (ev.sessionId && ev.sessionId !== sessionId) setSessionId(ev.sessionId);
                  updateMessage(assistantId, { content: ev.reply, isPending: false });
                  scrollToBottom();
                }

                else if (ev.eventType === "done") {
                  resolve();
                }
              },
              error: reject,
              complete: resolve,
            });

          subRef.current = sub;
        });

        handleDone(planToolUsed);
      } catch {
        // ── Fallback: mutation ──────────────────────────────────────────────
        clearInterval(labelInterval);
        try {
          const { data } = await sendFallback({ variables: { input: input_vars } });
          const result = data?.studyAgentMessage;
          if (result?.sessionId) setSessionId(result.sessionId);

          // Show action cards from mutation result
          if (result?.actions?.length) {
            for (const action of result.actions) {
              if (PLAN_TOOLS.has(action.toolName)) planToolUsed = true;
              addMessage({
                id: crypto.randomUUID(),
                role: "tool_done",
                content: action.toolName,
                timestamp: new Date(),
                action: action as AgentAction,
                isPending: false,
              });
            }
          }

          updateMessage(assistantId, {
            content: result?.reply ?? "Lo siento, hubo un problema. Inténtalo de nuevo.",
            isPending: false,
          });
        } catch {
          updateMessage(assistantId, {
            content: "Error de conexión. Verifica tu red e inténtalo de nuevo.",
            isPending: false,
          });
        }

        handleDone(planToolUsed);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isStreaming, sessionId, buildUserProfile, addMessage, updateMessage, scrollToBottom, sendFallback]
  );

  const stopGeneration = useCallback(() => {
    subRef.current?.unsubscribe();
    subRef.current = null;
    setIsStreaming(false);
    // Mark any pending cards as done
    setMessages((prev) =>
      prev.map((m) =>
        m.isPending ? { ...m, isPending: false, role: "tool_done" as MessageRole } : m
      )
    );
  }, []);

  useEffect(() => () => { subRef.current?.unsubscribe(); }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const isThinking = isStreaming && messages[messages.length - 1]?.isPending !== false;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: 20 }}
      transition={{ type: "spring", damping: 28, stiffness: 380 }}
      className={cn(
        "flex flex-col bg-card border border-border/50 shadow-2xl rounded-2xl overflow-hidden",
        expanded
          ? "fixed inset-4 z-50"
          : "fixed top-[4.5rem] right-4 z-50 w-[430px] h-[min(620px,calc(100vh-5.5rem))]"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40 bg-gradient-to-r from-primary/8 to-transparent shrink-0">
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          {isStreaming && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-card animate-pulse" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight tracking-tight">Asesor de Estudio</p>
          <p className="text-[10px] text-muted-foreground">
            {isStreaming ? (
              <span className="text-primary font-medium">{thinkingLabel}</span>
            ) : (
              "Planes adaptativos · Seguimiento · Predicciones"
            )}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div
        ref={scrollAreaRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
            >
              {msg.role === "tool_pending" && msg.action ? (
                <ToolCard action={msg.action} isPending={true} />
              ) : msg.role === "tool_done" && msg.action ? (
                <ToolCard action={msg.action} isPending={false} />
              ) : msg.role === "user" ? (
                <UserBubble content={msg.content} />
              ) : msg.isPending ? null : (
                <AssistantBubble content={msg.content} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator (only when no tool card is pending) */}
        {isStreaming && !pendingCardsRef.current.size && (
          <motion.div
            key="thinking"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ThinkingIndicator label={thinkingLabel} />
          </motion.div>
        )}

        {/* Quick starters */}
        {messages.length === 1 && !isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-2 gap-1.5 mt-2"
          >
            {QUICK_STARTERS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => send(label)}
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-border/60 hover:border-primary/40 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all text-left"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                {label}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-20 right-5 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Input ── */}
      <div className="shrink-0 border-t border-border/40 p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 focus-within:border-primary/40 focus-within:bg-muted/30 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isStreaming ? "Procesando…" : "Escribe un mensaje… (Enter para enviar)"}
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground/40 focus:outline-none max-h-32 leading-relaxed disabled:opacity-40"
            style={{ height: "auto" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
            }}
          />
          {isStreaming ? (
            <button
              onClick={stopGeneration}
              className="h-7 w-7 shrink-0 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted/80 flex items-center justify-center transition-colors"
              title="Detener"
            >
              <span className="w-2.5 h-2.5 rounded-sm bg-foreground/60" />
            </button>
          ) : (
            <Button
              size="icon"
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="h-7 w-7 shrink-0"
            >
              {input.trim() ? (
                <Sparkles className="w-3.5 h-3.5" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { aiClient, entityClient } from "@/lib/apollo";
import { STUDY_AGENT_MESSAGE } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Brain, Send, Loader2, X, Minimize2, Maximize2,
  CheckCircle2, AlertCircle, Zap,
} from "lucide-react";

interface AgentAction {
  toolName: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
  status: "success" | "error";
}

interface Message {
  id: string;
  role: "user" | "assistant" | "action";
  content: string;
  timestamp: Date;
  action?: AgentAction;
}

const QUICK_STARTERS = [
  "Quiero crear un plan de estudio",
  "¿Cómo voy con mi plan actual?",
  "Adapta mi plan según mi progreso",
  "¿Qué debería estudiar hoy?",
];

const TOOL_LABELS: Record<string, string> = {
  create_study_plan: "Creando plan de estudio en base de datos...",
  create_plan: "Creando plan de acción...",
  generate_task_content: "Generando contenido de la primera sesión...",
  create_task: "Creando tarea...",
  create_multiple_tasks: "Creando tareas...",
  update_task: "Actualizando tarea...",
  get_learning_progress: "Consultando progreso...",
  get_plan_details: "Cargando detalles del plan...",
  adapt_plan_tasks: "Adaptando plan...",
  get_study_predictions: "Analizando predicciones...",
  record_study_outcome: "Registrando resultado...",
  generate_proactive_insight: "Generando insight...",
};

const TOOL_DONE_LABELS: Record<string, string> = {
  create_study_plan: "Plan creado",
  create_plan: "Plan creado",
  generate_task_content: "Contenido generado",
  create_task: "Tarea creada",
  create_multiple_tasks: "Tareas creadas",
  update_task: "Tarea actualizada",
  adapt_plan_tasks: "Plan adaptado",
  record_study_outcome: "Resultado registrado",
};

const LOADING_MESSAGES = [
  "Pensando...",
  "Analizando tu solicitud...",
  "Preparando el plan...",
  "Calculando fechas y sesiones...",
  "Creando plan en base de datos...",
  "Generando contenido inicial...",
];

// Tools that should trigger a planning data refetch
const PLAN_TOOLS = new Set([
  "create_study_plan", "create_plan", "create_task",
  "create_multiple_tasks", "update_task", "adapt_plan_tasks",
]);

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
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [studyAgentMessage] = useMutation(STUDY_AGENT_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Rotate loading messages while waiting
  useEffect(() => {
    if (loading) {
      let idx = 0;
      setLoadingMsg(LOADING_MESSAGES[0]);
      loadingIntervalRef.current = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMsg(LOADING_MESSAGES[idx]);
      }, 1800);
    } else {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current);
        loadingIntervalRef.current = null;
      }
    }
    return () => {
      if (loadingIntervalRef.current) clearInterval(loadingIntervalRef.current);
    };
  }, [loading]);

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

        const newMessages: Message[] = [];

        // Show each action as a card
        if (result?.actions?.length) {
          for (const action of result.actions) {
            newMessages.push({
              id: `action-${Date.now()}-${action.toolName}`,
              role: "action",
              content: action.toolName,
              timestamp: new Date(),
              action: action as AgentAction,
            });
          }

          // Refetch planning data if relevant tools were used
          if (result.actions.some((a: AgentAction) => PLAN_TOOLS.has(a.toolName))) {
            entityClient.refetchQueries({ include: ["GetEntities", "GetPlans"] });
          }
        }

        // Then the text reply
        newMessages.push({
          id: Date.now().toString() + "-a",
          role: "assistant",
          content: result?.reply ?? "Lo siento, hubo un problema. Inténtalo de nuevo.",
          timestamp: new Date(),
        });

        setMessages((prev) => [...prev, ...newMessages]);
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
          : "fixed bottom-4 right-4 z-50 w-[420px] h-[600px]"
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
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
            >
              {msg.role === "action" && msg.action ? (
                <ActionCard action={msg.action} />
              ) : (
                <div className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
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
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2.5"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="bg-secondary/80 rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              <AnimatePresence mode="wait">
                <motion.span
                  key={loadingMsg}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs text-muted-foreground"
                >
                  {loadingMsg}
                </motion.span>
              </AnimatePresence>
            </div>
          </motion.div>
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

function ActionCard({ action }: { action: AgentAction }) {
  const label = action.status === "success"
    ? (TOOL_DONE_LABELS[action.toolName] ?? action.toolName)
    : `Error: ${action.toolName}`;

  const inProgress = TOOL_LABELS[action.toolName];

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs border mx-8",
      action.status === "success"
        ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
        : "bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400"
    )}>
      {action.status === "success" ? (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      )}
      <Zap className="w-3 h-3 shrink-0 opacity-50" />
      <span className="font-medium">{label}</span>
      {action.status === "success" && inProgress && (
        <span className="opacity-50 ml-auto">{action.toolName}</span>
      )}
    </div>
  );
}

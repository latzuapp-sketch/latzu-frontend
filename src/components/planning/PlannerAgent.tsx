"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import { isSameDay } from "@/hooks/usePlanning";
import type { PlanningTask, CalendarEvent } from "@/types/planning";
import {
  X, Sparkles, SendHorizonal, Loader2, ChevronRight,
  CalendarDays, AlertTriangle, CheckCircle2, Zap,
  RefreshCw,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentMessage {
  role: "user" | "assistant" | "system";
  text: string;
  actions?: Array<{ toolName: string; status: string }>;
}

interface PlannerAgentProps {
  tasks: PlanningTask[];
  calendarEvents: CalendarEvent[];
  onClose: () => void;
  onTasksChanged?: () => void;
  userName?: string;
}

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContext(tasks: PlanningTask[], events: CalendarEvent[], userName?: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dateStr = new Date().toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const pending = tasks.filter((t) => t.status !== "done");
  const overdue = pending.filter(
    (t) => t.dueDate && new Date(t.dueDate + "T00:00:00") < today
  );
  const todayT = pending.filter(
    (t) => t.dueDate && isSameDay(new Date(t.dueDate + "T00:00:00"), new Date())
  );

  const taskLines = pending.slice(0, 25).map((t) => {
    const abcde = t.abcdePriority ? `[${t.abcdePriority}]` : `[${t.priority}]`;
    const date = t.dueDate ?? "sin fecha";
    const time = t.dueTime ? ` ${t.dueTime}` : "";
    const area = t.lifeArea ? ` (${t.lifeArea})` : "";
    return `• ${abcde} "${t.title}" — ${date}${time}${area} — ${t.status}`;
  });

  const todayEvents = events
    .filter((e) => { try { return isSameDay(new Date(e.start), new Date()); } catch { return false; } })
    .map((e) => `• "${e.title}" ${e.allDay ? "(todo el día)" : new Date(e.start).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`);

  return `Eres el agente de planificación de ${userName || "el usuario"}. Tienes acceso completo a su agenda y puedes crear, actualizar o reorganizar tareas. Responde siempre en español, de forma concisa y orientada a la acción.

Fecha actual: ${dateStr}

RESUMEN SEMANAL:
- Tareas pendientes: ${pending.length} | Atrasadas: ${overdue.length} | Hoy: ${todayT.length}

TAREAS PENDIENTES:
${taskLines.join("\n") || "Sin tareas pendientes."}

EVENTOS DE HOY (Google Calendar):
${todayEvents.join("\n") || "Sin eventos."}

Cuando el usuario pida crear, mover o actualizar tareas, usa tus herramientas disponibles para hacerlo. Sé proactivo: si ves tareas atrasadas o mal priorizadas, sugiérelo.`;
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { icon: Zap,           label: "¿Qué hago primero hoy?",         msg: "¿Cuál es mi tarea más importante para hoy y por qué?" },
  { icon: AlertTriangle, label: "Ver tareas atrasadas",            msg: "Muéstrame todas mis tareas atrasadas y ayúdame a priorizarlas." },
  { icon: CalendarDays,  label: "Planear la semana",               msg: "Analiza mis tareas de esta semana y dame un plan de acción optimizado." },
  { icon: CheckCircle2,  label: "Crear tareas para un objetivo",   msg: "Quiero crear tareas para un nuevo objetivo. Ayúdame a desglosarlo." },
];

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: AgentMessage }) {
  if (msg.role === "system") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[90%]",
        msg.role === "user"
          ? "bg-primary/15 text-foreground self-end ml-auto"
          : "bg-muted/50 text-foreground/90 self-start"
      )}
    >
      <p className="whitespace-pre-wrap">{msg.text}</p>
      {msg.actions && msg.actions.length > 0 && (
        <div className="mt-2 space-y-1">
          {msg.actions.map((a, i) => (
            <div key={i} className={cn(
              "text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg",
              a.status === "done" ? "bg-emerald-500/10 text-emerald-400" : "bg-primary/10 text-primary"
            )}>
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              {a.toolName === "create_task" ? "Tarea creada" : a.toolName}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function PlannerAgent({ tasks, calendarEvents, onClose, onTasksChanged, userName }: PlannerAgentProps) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [sendMsg, { loading }] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const q = text.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: q }]);

    try {
      // Include planning context only on first message (no sessionId yet)
      const messageToSend = !sessionId
        ? `${buildContext(tasks, calendarEvents, userName)}\n\n---\n\nMensaje del usuario: ${q}`
        : q;

      const { data } = await sendMsg({
        variables: { input: { message: messageToSend, sessionId: sessionId ?? null } },
      });

      const result = data?.sendMessage;
      if (result) {
        setSessionId(result.sessionId ?? sessionId);

        const actions = result.actions?.filter(
          (a: { status: string }) => a.status === "done"
        ) ?? [];

        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: result.reply ?? "Sin respuesta.", actions },
        ]);

        if (actions.some((a: { toolName: string }) =>
          ["create_task", "update_task", "create_multiple_tasks"].includes(a.toolName)
        )) {
          onTasksChanged?.();
        }
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Error al conectar con el agente. Inténtalo de nuevo." }]);
    }
  }, [loading, sessionId, tasks, calendarEvents, userName, sendMsg, onTasksChanged]);

  const resetSession = () => {
    setMessages([]);
    setSessionId(null);
  };

  const today = new Date();
  const overdueCount = tasks.filter(
    (t) => t.status !== "done" && t.dueDate &&
      new Date(t.dueDate + "T00:00:00") < new Date(today.setHours(0, 0, 0, 0))
  ).length;

  return (
    <div className="flex flex-col h-full bg-background border-l border-border/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold">Agente de Planificación</p>
            <p className="text-[10px] text-muted-foreground">
              {tasks.filter(t => t.status !== "done").length} tareas pendientes
              {overdueCount > 0 && <span className="text-red-400"> · {overdueCount} atrasadas</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={resetSession}
              title="Nueva conversación"
              className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {/* Welcome state */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-gradient-to-br from-violet-500/10 to-purple-700/5 rounded-2xl p-4 border border-violet-500/20">
              <p className="text-sm font-medium mb-1">Hola{userName ? `, ${userName}` : ""}! 👋</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Soy tu agente de planificación. Conozco todas tus tareas y puedo ayudarte a organizar, crear y priorizar tu agenda.
              </p>
            </div>

            {/* Stats summary */}
            {(() => {
              const pending = tasks.filter(t => t.status !== "done").length;
              const overdue = tasks.filter(
                t => t.status !== "done" && t.dueDate &&
                  new Date(t.dueDate + "T00:00:00") < new Date(new Date().setHours(0,0,0,0))
              ).length;
              const todayCount = tasks.filter(
                t => t.status !== "done" && t.dueDate &&
                  isSameDay(new Date(t.dueDate + "T00:00:00"), new Date())
              ).length;
              return (
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Pendientes", value: pending, color: "text-foreground" },
                    { label: "Hoy", value: todayCount, color: "text-primary" },
                    { label: "Atrasadas", value: overdue, color: overdue > 0 ? "text-red-400" : "text-muted-foreground" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl border border-border/40 bg-card/40 px-2 py-2 text-center">
                      <p className={cn("text-lg font-bold", color)}>{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              );
            })()}

            {/* Quick actions */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-1">Acciones rápidas</p>
              {QUICK_ACTIONS.map(({ icon: Icon, label, msg }) => (
                <button
                  key={label}
                  onClick={() => send(msg)}
                  disabled={loading}
                  className="flex items-center gap-2.5 w-full text-left text-xs px-3 py-2.5 rounded-xl border border-border/40 bg-card/30 hover:bg-card/80 hover:border-violet-500/40 transition-all group"
                >
                  <Icon className="w-3.5 h-3.5 text-violet-400/60 shrink-0 group-hover:text-violet-400 transition-colors" />
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Chat messages */}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <MessageBubble key={i} msg={m} />
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="self-start bg-muted/50 rounded-2xl px-4 py-3"
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Analizando tu agenda…
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 pt-2 border-t border-border/30">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 focus-within:border-violet-500/50 focus-within:bg-background transition-all px-3"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400/50 shrink-0" />
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pídeme ayuda con tu planificación…"
            className="flex-1 bg-transparent outline-none py-3 text-sm placeholder:text-muted-foreground/40"
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
          />
          <Button type="submit" size="icon" variant="ghost" disabled={loading || !input.trim()} className="h-7 w-7 shrink-0">
            {loading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <SendHorizonal className="w-3.5 h-3.5" />
            }
          </Button>
        </form>
        <p className="text-[10px] text-muted-foreground/40 text-center mt-1.5">
          El agente puede crear y actualizar tareas directamente
        </p>
      </div>
    </div>
  );
}

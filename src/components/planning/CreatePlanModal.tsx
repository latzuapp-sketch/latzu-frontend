"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionPlan, CreatePlanInput, PlanType, StudyPhase } from "@/types/planning";
import {
  X, Send, Sparkles, Loader2, Brain, User,
  CheckCircle2, ChevronDown, ChevronUp, CalendarDays,
  BookOpen, Zap, Target, Wand2,
} from "lucide-react";

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `[INSTRUCCIONES DEL SISTEMA]
Eres un experto en planificación estratégica dentro de la app Latzu. Tu misión es crear planes completos y accionables para el usuario haciendo preguntas conversacionales breves (UNA por mensaje).

Recopila esta información de forma natural:
- Tipo de plan: estudio (aprender algo) o acción (ejecutar algo)
- Tema/proyecto y contexto del usuario
- Nivel actual o punto de partida
- Meta específica y medible
- Tiempo disponible por semana y fecha límite
- Para estudio: fases de aprendizaje progresivas con temas por fase
- Para acción: etapas o hitos clave con entregables

Cuando hayas recopilado suficiente información (al menos 3-4 intercambios), genera el plan directamente. Anuncia primero: "Perfecto, ya tengo todo lo que necesito. Voy a generar tu plan..."

Luego incluye al final de tu mensaje este bloque exacto (reemplaza los valores):
[PLAN_JSON]
{"title":"Título del plan","type":"study","goal":"Meta específica y medible","description":"Descripción detallada del plan y su estructura","dueDate":"2025-06-30","phases":[{"id":"fase-1","title":"Fundamentos","description":"Descripción de la fase","durationWeeks":2,"topics":["Tema A","Tema B","Tema C"]},{"id":"fase-2","title":"Práctica","description":"...","durationWeeks":3,"topics":["Tema D","Tema E"]}]}
[/PLAN_JSON]

Notas:
- dueDate: usa formato YYYY-MM-DD o null si no hay fecha
- phases: obligatorio para estudio, opcional para acción (usa etapas/hitos como fases)
- type: solo "study" o "action"
- Sé amigable, motivador y directo. NO hagas listas largas de preguntas.
[FIN INSTRUCCIONES]`;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

interface ParsedPlan {
  title: string;
  type: PlanType;
  goal: string;
  description: string;
  dueDate: string | null;
  phases?: StudyPhase[];
}

export interface CreatePlanModalProps {
  onClose: () => void;
  onCreate: (input: CreatePlanInput & { phases?: StudyPhase[] }) => Promise<ActionPlan | null>;
}

// ─── Parsed plan card ─────────────────────────────────────────────────────────

function PlanReadyCard({
  plan,
  onConfirm,
  creating,
}: {
  plan: ParsedPlan;
  onConfirm: (withAI: boolean) => void;
  creating: boolean;
}) {
  const [showPhases, setShowPhases] = useState(false);
  const [withAI, setWithAI] = useState(true);
  const isStudy = plan.type === "study";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="mx-auto max-w-full"
    >
      <div className={cn(
        "rounded-2xl border-2 overflow-hidden",
        isStudy ? "border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-violet-500/5"
                : "border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5"
      )}>
        {/* Plan header */}
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", isStudy ? "bg-blue-500/15" : "bg-amber-500/15")}>
              {isStudy ? <BookOpen className="w-3.5 h-3.5 text-blue-400" /> : <Zap className="w-3.5 h-3.5 text-amber-400" />}
            </div>
            <span className={cn("text-[10px] font-semibold uppercase tracking-wide", isStudy ? "text-blue-400" : "text-amber-400")}>
              {isStudy ? "Plan de Estudio" : "Plan de Acción"}
            </span>
            {plan.dueDate && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="w-3 h-3" />
                {new Date(plan.dueDate + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
          </div>
          <p className="font-semibold text-sm leading-snug">{plan.title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
            <Target className="w-3 h-3 mt-0.5 shrink-0 text-primary/50" />
            {plan.goal}
          </p>

          {/* Phases toggle */}
          {plan.phases && plan.phases.length > 0 && (
            <button
              onClick={() => setShowPhases(v => !v)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPhases ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {plan.phases.length} fases
            </button>
          )}

          <AnimatePresence>
            {showPhases && plan.phases && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-1.5 pt-1">
                  {plan.phases.map((phase, i) => (
                    <div key={phase.id} className="flex items-start gap-2">
                      <div className="w-4 h-4 rounded-full bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[8px] font-bold text-primary">{i + 1}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium leading-tight">{phase.title}</p>
                        {phase.durationWeeks && (
                          <p className="text-[10px] text-muted-foreground">{phase.durationWeeks} semanas</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-3 pb-3 space-y-2">
          {/* AI tasks toggle */}
          <button
            onClick={() => setWithAI(v => !v)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-left transition-all text-xs",
              withAI ? "border-violet-500/40 bg-violet-500/10" : "border-border/40 bg-muted/20"
            )}
          >
            <Wand2 className={cn("w-4 h-4 shrink-0", withAI ? "text-violet-400" : "text-muted-foreground/50")} />
            <div className="flex-1">
              <p className={cn("font-medium", withAI ? "text-violet-300" : "text-muted-foreground")}>
                Generar tareas con IA
              </p>
              <p className="text-[10px] text-muted-foreground/70">La IA creará tareas concretas para cada fase</p>
            </div>
            <div
              className="shrink-0 w-9 h-5 rounded-full relative transition-colors"
              style={{ background: withAI ? "rgb(139 92 246)" : "hsl(var(--muted))" }}
            >
              <motion.div
                animate={{ x: withAI ? 18 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </div>
          </button>

          <Button
            onClick={() => onConfirm(withAI)}
            disabled={creating}
            size="sm"
            className={cn("w-full gap-2 font-semibold", withAI && "bg-violet-600 hover:bg-violet-700")}
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : withAI ? (
              <Wand2 className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {creating ? "Creando plan…" : withAI ? "Crear plan y generar tareas" : "Crear plan"}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn("flex gap-2.5 max-w-full", isUser ? "flex-row-reverse ml-auto" : "mr-auto")}
      style={{ maxWidth: "88%" }}
    >
      {/* Avatar */}
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
        isUser ? "bg-primary/10" : "bg-gradient-to-br from-primary to-accent"
      )}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-primary" />
          : <Brain className="w-3.5 h-3.5 text-primary-foreground" />
        }
      </div>

      {/* Bubble */}
      <div className={cn(
        "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-sm"
          : "bg-secondary/80 text-foreground rounded-bl-sm"
      )}>
        {msg.loading ? (
          <div className="flex items-center gap-1 py-0.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-current opacity-50 animate-bounce"
                style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
              />
            ))}
          </div>
        ) : (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

const WELCOME_MESSAGE = "¡Hola! Soy tu asistente de planificación ✨\n\nVoy a hacerte algunas preguntas para crear un plan completo y personalizado para ti. No te preocupes, será rápido.\n\n¿De qué trata tu plan? Puedes contarme qué quieres aprender o qué proyecto quieres ejecutar.";

export function CreatePlanModal({ onClose, onCreate }: CreatePlanModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [parsedPlan, setParsedPlan] = useState<ParsedPlan | null>(null);
  const [creating, setCreating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [sendMessage] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");

    setMessages(prev => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", loading: true },
    ]);
    setIsTyping(true);

    try {
      let messagePayload = text;
      if (isFirstMessage) {
        messagePayload = `${SYSTEM_PROMPT}\n\n--- Primera respuesta del usuario ---\n${text}`;
        setIsFirstMessage(false);
      }

      const res = await sendMessage({
        variables: {
          input: {
            message: messagePayload,
            sessionId: sessionId ?? undefined,
            useRag: false,
          },
        },
      });

      const reply: string = res.data?.sendMessage?.reply ?? "";
      const newSessionId: string | null = res.data?.sendMessage?.sessionId ?? null;
      if (newSessionId) setSessionId(newSessionId);

      // Parse plan JSON block
      const planMatch = reply.match(/\[PLAN_JSON\]\s*([\s\S]*?)\s*\[\/PLAN_JSON\]/);
      const displayContent = reply
        .replace(/\[PLAN_JSON\][\s\S]*?\[\/PLAN_JSON\]/g, "")
        .trim();

      if (planMatch) {
        try {
          const parsed = JSON.parse(planMatch[1]) as ParsedPlan;
          if (parsed.title && parsed.type && parsed.goal) {
            setParsedPlan(parsed);
          }
        } catch { /* silent */ }
      }

      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: displayContent || "Ya tengo lo que necesito para crear tu plan." }
            : m
        )
      );
    } catch {
      setMessages(prev =>
        prev.map((m, i) =>
          i === prev.length - 1
            ? { role: "assistant", content: "Ups, tuve un problema. ¿Puedes intentarlo de nuevo?" }
            : m
        )
      );
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [input, isTyping, isFirstMessage, sessionId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  const handleCreate = async (withAI: boolean) => {
    if (!parsedPlan) return;
    setCreating(true);
    try {
      await onCreate({
        title: parsedPlan.title,
        goal: parsedPlan.goal,
        description: parsedPlan.description,
        type: parsedPlan.type,
        dueDate: parsedPlan.dueDate,
        generateWithAI: withAI,
        phases: parsedPlan.phases,
      });
    } finally {
      setCreating(false);
    }
    onClose();
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 100)}px`;
  }, [input]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 12, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 8, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
        style={{ maxHeight: "min(680px, 90vh)" }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-heading font-bold text-sm leading-tight">Crear plan con IA</p>
            <p className="text-[11px] text-muted-foreground">
              {isTyping ? "Escribiendo…" : parsedPlan ? "Plan listo para crear" : "Responde las preguntas para generar tu plan"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <ChatBubble key={i} msg={msg} />
            ))}
          </AnimatePresence>

          {/* Plan ready card */}
          <AnimatePresence>
            {parsedPlan && !isTyping && (
              <PlanReadyCard plan={parsedPlan} onConfirm={handleCreate} creating={creating} />
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!parsedPlan && (
          <div className="px-4 py-3 border-t border-border/40 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu respuesta…"
                rows={1}
                disabled={isTyping}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-input bg-muted/20 px-3 py-2.5",
                  "text-sm placeholder:text-muted-foreground/50",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "min-h-[42px] max-h-[100px] leading-relaxed transition-all",
                  isTyping && "opacity-50 cursor-not-allowed"
                )}
              />
              <Button
                type="button"
                size="icon"
                onClick={doSend}
                disabled={!input.trim() || isTyping}
                className="w-9 h-9 rounded-xl shrink-0"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        )}

        {/* Footer when plan is ready but no input shown */}
        {parsedPlan && (
          <div className="px-4 py-3 border-t border-border/40 shrink-0">
            <button
              onClick={() => setParsedPlan(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Seguir conversando para ajustar el plan
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE } from "@/graphql/ai/operations";
import type { LibraryFile } from "@/types/library";
import { Button } from "@/components/ui/button";
import {
  X, Sparkles, FileText, SendHorizonal, Loader2,
  ChevronRight, Eye, MessageSquare,
} from "lucide-react";

interface FileDetailProps {
  file: LibraryFile;
  onClose: () => void;
}

interface QAMessage {
  role: "user" | "assistant";
  text: string;
}

const STARTER_QUESTIONS = [
  "Resume los puntos principales",
  "¿Cuáles son las ideas más importantes?",
  "Crea una lista de acción basada en este documento",
  "Explícame el contenido de forma sencilla",
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function FileDetail({ file, onClose }: FileDetailProps) {
  const [tab, setTab] = useState<"preview" | "chat">("preview");
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
    setTab("chat");
    setMessages((prev) => [...prev, { role: "user", text: q }]);

    try {
      const contextMsg = `Documento: "${file.name}"\n\nContenido:\n${file.extractedText}\n\n${file.truncated ? "(Nota: el documento fue truncado a 15,000 caracteres)\n\n" : ""}Pregunta: ${q}`;
      const { data } = await sendMsg({
        variables: {
          input: { message: contextMsg, sessionId: sessionId ?? null },
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
      <div className="flex items-start justify-between px-5 py-4 border-b border-border/40 shrink-0">
        <div className="min-w-0 flex-1 pr-3">
          <div className="flex items-center gap-2 mb-0.5">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <p className="font-semibold text-sm truncate">{file.name}</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60">
            <span className="uppercase font-bold">{file.ext}</span>
            <span>·</span>
            <span>{formatSize(file.size)}</span>
            {file.truncated && (
              <>
                <span>·</span>
                <span className="text-amber-500/70">truncado</span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="shrink-0 p-1 rounded-md text-muted-foreground/60 hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 px-5 border-b border-border/30 shrink-0">
        {[
          { id: "preview" as const, label: "Vista previa", Icon: Eye },
          { id: "chat" as const, label: "Explorar con IA", Icon: MessageSquare },
        ].map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors",
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "preview" ? (
          <div className="px-5 py-4">
            <pre className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap font-mono">
              {file.extractedText || "Sin contenido extraído."}
            </pre>
            {file.truncated && (
              <p className="mt-4 text-xs text-amber-500/70 italic">
                Mostrando primeros 15,000 caracteres del archivo.
              </p>
            )}
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <>
                <p className="text-xs text-muted-foreground/60 mb-3">
                  Haz preguntas sobre el contenido de este archivo:
                </p>
                <div className="space-y-1.5">
                  {STARTER_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => ask(q)}
                      disabled={loading}
                      className="flex items-center gap-2 w-full text-left text-xs px-3 py-2 rounded-lg border border-border/50 bg-card/40 hover:bg-card/80 hover:border-violet-500/40 transition-all group"
                    >
                      <ChevronRight className="w-3 h-3 text-violet-400/60 shrink-0 group-hover:text-violet-400 transition-colors" />
                      {q}
                    </button>
                  ))}
                </div>
              </>
            )}

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
                Analizando el documento…
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input (only on chat tab) */}
      {tab === "chat" && (
        <div className="shrink-0 px-5 pb-4 pt-2 border-t border-border/30">
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-muted/20 focus-within:border-violet-500/50 transition-colors px-3"
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400/60 shrink-0" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre este archivo…"
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

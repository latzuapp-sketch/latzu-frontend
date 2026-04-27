"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import { QUICK_CAPTURE } from "@/graphql/ai/operations";
import { cn } from "@/lib/utils";
import {
  Plus, X, Loader2, CheckCircle2, Brain, ListTodo,
  Send, Link2, FileText, Video, Globe,
} from "lucide-react";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CaptureAttachment {
  id: string;
  type: "image" | "pdf" | "link" | "video" | "document";
  name: string;
  data: string;
  preview?: string;
  mimeType?: string;
}

interface CaptureResult {
  type: string;
  saved: boolean;
  summary: string;
  rawTitle: string | null;
  rawContent: string | null;
  priority: string | null;
  dueHint: string | null;
}

// ── Speed dial actions ────────────────────────────────────────────────────────

type ActionId = "capture" | "video" | "document" | "link";

const ACTIONS: {
  id: ActionId;
  icon: typeof Brain;
  label: string;
  description: string;
  gradient: string;
  ring: string;
}[] = [
  {
    id: "capture",
    icon: Brain,
    label: "Captura rápida",
    description: "Nota, tarea o idea",
    gradient: "from-primary to-accent",
    ring: "ring-primary/30",
  },
  {
    id: "video",
    icon: Video,
    label: "Subir video",
    description: "MP4, MOV, WebM",
    gradient: "from-rose-500 to-red-600",
    ring: "ring-rose-500/30",
  },
  {
    id: "document",
    icon: FileText,
    label: "Subir documento",
    description: "PDF, Word, texto",
    gradient: "from-blue-500 to-indigo-600",
    ring: "ring-blue-500/30",
  },
  {
    id: "link",
    icon: Globe,
    label: "Agregar enlace",
    description: "Web, YouTube, artículo",
    gradient: "from-teal-500 to-cyan-600",
    ring: "ring-teal-500/30",
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function fileToAtt(file: File): Promise<CaptureAttachment | null> {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  const isVideo = file.type.startsWith("video/");
  const isDoc = !isImage && !isPdf && !isVideo;
  if (!isImage && !isPdf && !isVideo && !isDoc) return null;
  const type: CaptureAttachment["type"] = isImage ? "image" : isPdf ? "pdf" : isVideo ? "video" : "document";
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      resolve({ id: crypto.randomUUID(), type, name: file.name, data: dataUri, preview: isImage ? dataUri : undefined, mimeType: file.type });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

const typeIcon = (type: string) => ({
  note: <Brain className="w-3.5 h-3.5" />,
  task: <ListTodo className="w-3.5 h-3.5" />,
}[type] ?? <Brain className="w-3.5 h-3.5" />);

const typeLabel = (type: string) => ({
  note: "Nota guardada",
  task: "Tarea detectada",
}[type] ?? "Capturado");

const typeLink = (type: string) => ({
  note: "/library",
  task: "/planning",
}[type] ?? "/dashboard");

// ── Capture Modal ─────────────────────────────────────────────────────────────

interface CaptureModalProps {
  initialAction?: ActionId;
  onClose: () => void;
  userId: string;
}

function CaptureModal({ initialAction = "capture", onClose, userId }: CaptureModalProps) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<CaptureResult | null>(null);
  const [attachments, setAttachments] = useState<CaptureAttachment[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [showLink, setShowLink] = useState(initialAction === "link");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  const [capture, { loading }] = useMutation(QUICK_CAPTURE, { client: aiClient });

  useEffect(() => {
    if (initialAction === "video") { videoInputRef.current?.click(); }
    else if (initialAction === "document") { docInputRef.current?.click(); }
    else { setTimeout(() => textareaRef.current?.focus(), 80); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const addLink = () => {
    const url = linkInput.trim();
    if (!url) return;
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    const isYt = fullUrl.includes("youtube.com") || fullUrl.includes("youtu.be");
    setAttachments((p) => [...p, { id: crypto.randomUUID(), type: "link", name: isYt ? "YouTube" : new URL(fullUrl).hostname, data: fullUrl }]);
    setLinkInput(""); setShowLink(false);
  };

  const handleFiles = async (files: File[]) => {
    const results = await Promise.all(files.map(fileToAtt));
    setAttachments((p) => [...p, ...results.filter(Boolean) as CaptureAttachment[]]);
  };

  const handleSubmit = async () => {
    if (!text.trim() && !attachments.length) return;
    if (!userId || loading) return;
    try {
      const res = await capture({ variables: { text: text.trim() || "Analiza el archivo adjunto." } });
      setResult(res.data?.quickCapture ?? null);
      setText(""); setAttachments([]);
    } catch {
      setResult({ type: "note", saved: false, summary: "Error al guardar. Inténtalo de nuevo.", rawTitle: null, rawContent: null, priority: null, dueHint: null });
    }
  };

  const actionMeta = ACTIONS.find((a) => a.id === initialAction) ?? ACTIONS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg glass rounded-2xl border border-border/50 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
          <div className="flex items-center gap-2">
            <div className={cn("w-6 h-6 rounded-lg bg-gradient-to-br flex items-center justify-center", actionMeta.gradient)}>
              <actionMeta.icon className="w-3.5 h-3.5 text-white" />
            </div>
            <p className="text-sm font-semibold">{actionMeta.label}</p>
            <span className="text-[10px] text-muted-foreground/50 border border-border/40 rounded px-1.5 py-0.5 font-mono">
              Ctrl+Enter
            </span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple className="hidden"
          onChange={async (e) => { await handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden"
          onChange={async (e) => { await handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; textareaRef.current?.focus(); }} />
        <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.md" multiple className="hidden"
          onChange={async (e) => { await handleFiles(Array.from(e.target.files ?? [])); e.target.value = ""; textareaRef.current?.focus(); }} />

        {/* Content */}
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-3">
              {/* Attachment chips */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-md bg-muted/40 border border-border/40 text-xs">
                      {att.type === "image" && att.preview
                        ? <img src={att.preview} alt={att.name} className="w-4 h-4 rounded object-cover" />
                        : att.type === "pdf" ? <FileText className="w-3 h-3 text-red-400" />
                        : att.type === "video" ? <Video className="w-3 h-3 text-rose-400" />
                        : att.type === "link" ? <Link2 className="w-3 h-3 text-blue-400" />
                        : <FileText className="w-3 h-3 text-blue-400" />}
                      <span className="truncate max-w-[100px] text-muted-foreground">{att.name}</span>
                      <button onClick={() => setAttachments((p) => p.filter((a) => a.id !== att.id))} className="text-muted-foreground/40 hover:text-foreground">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Link input */}
              {showLink && (
                <div className="flex gap-2 pb-1">
                  <input
                    autoFocus
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } if (e.key === "Escape") setShowLink(false); }}
                    placeholder="https://... o youtube.com/..."
                    className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-sm outline-none focus:border-primary/40"
                  />
                  <button onClick={addLink} className="px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors">OK</button>
                </div>
              )}

              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); handleSubmit(); } }}
                rows={4}
                placeholder={
                  initialAction === "video" ? "Describe de qué trata el video (opcional)…"
                  : initialAction === "document" ? "Agrega contexto sobre el documento (opcional)…"
                  : initialAction === "link" ? "Pega el enlace y/o describe el contenido…"
                  : "Escribe cualquier cosa… una idea, tarea, recordatorio, concepto."
                }
                className="w-full bg-transparent text-sm leading-relaxed outline-none resize-none placeholder:text-muted-foreground/40"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" title="Imagen o PDF">
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => videoInputRef.current?.click()} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-muted/30 transition-colors" title="Video">
                    <Video className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => setShowLink((v) => !v)} className={cn("p-1.5 rounded-lg transition-colors", showLink ? "text-primary bg-primary/10" : "text-muted-foreground/40 hover:text-foreground hover:bg-muted/30")} title="Enlace">
                    <Link2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={(!text.trim() && !attachments.length) || loading}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                    (text.trim() || attachments.length) && !loading
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted/30 text-muted-foreground cursor-not-allowed"
                  )}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {loading ? "Procesando…" : "Capturar"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", result.saved ? "bg-emerald-500/15 text-emerald-400" : "bg-primary/15 text-primary")}>
                  {result.saved ? <CheckCircle2 className="w-5 h-5" /> : typeIcon(result.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{typeLabel(result.type)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{result.summary}</p>
                </div>
              </div>
              {(result.rawTitle || result.priority || result.dueHint) && (
                <div className="bg-muted/20 rounded-xl p-3 text-xs space-y-1 text-muted-foreground">
                  {result.rawTitle && <p><span className="font-medium">Título:</span> {result.rawTitle}</p>}
                  {result.priority && result.priority !== "medium" && <p><span className="font-medium">Prioridad:</span> {result.priority}</p>}
                  {result.dueHint && result.dueHint !== "null" && <p><span className="font-medium">Tiempo:</span> {result.dueHint}</p>}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setResult(null); setTimeout(() => textareaRef.current?.focus(), 50); }} className="flex-1 text-xs py-2 rounded-xl border border-border/40 hover:bg-muted/20 transition-colors">
                  Capturar otra
                </button>
                <Link href={typeLink(result.type)} onClick={onClose} className="flex-1 text-xs py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-center">
                  {result.type === "note" ? "Ver biblioteca" : "Ver planificación"}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── QuickCapture (speed dial) ─────────────────────────────────────────────────

export function QuickCapture() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const [dialOpen, setDialOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<ActionId | null>(null);

  // Close dial on outside click
  const dialRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dialOpen) return;
    const handler = (e: MouseEvent) => {
      if (dialRef.current && !dialRef.current.contains(e.target as Node)) {
        setDialOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dialOpen]);

  const handleAction = (id: ActionId) => {
    setDialOpen(false);
    setActiveAction(id);
  };

  if (!userId) return null;

  return (
    <>
      {/* Speed dial */}
      <div ref={dialRef} className="fixed bottom-6 right-6 z-40 md:bottom-8 md:right-8 flex flex-col items-end gap-3">
        {/* Action items */}
        <AnimatePresence>
          {dialOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-end gap-2.5"
            >
              {[...ACTIONS].reverse().map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.div
                    key={action.id}
                    initial={{ opacity: 0, x: 20, scale: 0.85 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 16, scale: 0.85 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 400, damping: 28 }}
                    className="flex items-center gap-3"
                  >
                    {/* Label chip */}
                    <motion.div
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ delay: i * 0.06 + 0.05 }}
                      className="bg-card border border-border/60 rounded-xl px-3 py-1.5 shadow-lg"
                    >
                      <p className="text-xs font-semibold whitespace-nowrap">{action.label}</p>
                      <p className="text-[10px] text-muted-foreground whitespace-nowrap">{action.description}</p>
                    </motion.div>
                    {/* Icon button */}
                    <button
                      onClick={() => handleAction(action.id)}
                      className={cn(
                        "w-11 h-11 rounded-full bg-gradient-to-br flex items-center justify-center text-white shadow-lg",
                        "hover:scale-110 active:scale-95 transition-transform ring-2",
                        action.gradient, action.ring
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
          onClick={() => setDialOpen((v) => !v)}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30",
            "hover:scale-110 active:scale-95 transition-all",
            dialOpen
              ? "bg-muted border-2 border-border text-foreground rotate-45"
              : "bg-gradient-to-br from-primary to-accent"
          )}
          title="Acciones rápidas"
        >
          <motion.div animate={{ rotate: dialOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
            <Plus className={cn("w-6 h-6", dialOpen ? "text-foreground" : "text-white")} />
          </motion.div>
        </motion.button>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeAction && userId && (
          <CaptureModal
            initialAction={activeAction}
            userId={userId}
            onClose={() => setActiveAction(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

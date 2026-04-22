"use client";

import {
  useState, useCallback, useRef, useEffect, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { aiClient } from "@/lib/apollo";
import { SEND_MESSAGE, EXTRACT_TEXT, SCRAPE_URL } from "@/graphql/ai/operations";
import { useTasks } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { FlashcardSession } from "@/components/study/FlashcardSession";
import { MindMap, type MindNode } from "@/components/study/MindMap";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import type { PlanningTask, TaskCategory } from "@/types/planning";
import {
  Zap, FileText, Plus, Trash2, X, Loader2, Send, Sparkles,
  BookOpen, Brain, CheckSquare, MessageSquare, RefreshCw,
  CheckCircle2, Globe, Upload, AlertCircle, ArrowLeft,
  CalendarDays, Clock, User, Bot, PanelLeftClose, PanelRightClose,
  Circle, Bell, Code, Play, Map, Library,
} from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";

// ── Content meta ──────────────────────────────────────────────────────────────

const CONTENT_META: Record<TaskCategory, { label: string; icon: typeof BookOpen; color: string; bg: string }> = {
  lesson:    { label: "Lección",      icon: BookOpen,    color: "text-blue-400",    bg: "bg-blue-500/10 border-blue-500/20" },
  flashcard: { label: "Flashcard",    icon: Brain,       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  reading:   { label: "Lectura",      icon: FileText,    color: "text-teal-400",    bg: "bg-teal-500/10 border-teal-500/20" },
  quiz:      { label: "Quiz",         icon: CheckSquare, color: "text-purple-400",  bg: "bg-purple-500/10 border-purple-500/20" },
  video:     { label: "Video",        icon: Play,        color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  practice:  { label: "Práctica",     icon: Code,        color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  reminder:  { label: "Recordatorio", icon: Bell,        color: "text-yellow-400",  bg: "bg-yellow-500/10 border-yellow-500/20" },
  task:      { label: "Tarea",        icon: Circle,      color: "text-muted-foreground", bg: "bg-muted/30 border-border/40" },
};

type FilterTab = "all" | TaskCategory;
const FILTER_TABS: { id: FilterTab; label: string; icon: typeof BookOpen }[] = [
  { id: "all",       label: "Todas",      icon: Zap },
  { id: "lesson",    label: "Lecciones",  icon: BookOpen },
  { id: "flashcard", label: "Flashcards", icon: Brain },
  { id: "quiz",      label: "Quizzes",    icon: CheckSquare },
  { id: "reading",   label: "Lecturas",   icon: FileText },
  { id: "practice",  label: "Práctica",   icon: Code },
  { id: "task",      label: "Tareas",     icon: Circle },
];

// ── Notebook source types ─────────────────────────────────────────────────────

interface NotebookSource {
  id: string;
  title: string;
  type: "text" | "url" | "file";
  summary?: string;
  status: "processing" | "ready" | "error";
  nodesCreated?: number;
  errorMsg?: string;
}

const ACCEPTED_FILE_TYPES = ".txt,.md,.pdf,.csv";
const ACCEPTED_FILE_EXTS = ["txt", "md", "pdf", "csv"];

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}
function urlTitle(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url.slice(0, 40); }
}

// ── Chat types ────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

type StudioTab = "flashcards" | "quiz" | "mindmap" | "guide";
type MobilePanel = "context" | "chat" | "studio";

// ── Stream helpers ────────────────────────────────────────────────────────────

const STREAM_CHARS = 14;
const STREAM_MS = 16;

// ══════════════════════════════════════════════════════════════════════════════
// TASK LIST VIEW
// ══════════════════════════════════════════════════════════════════════════════

function formatDue(date: string | null): string | null {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  if (diff === -1) return "Ayer";
  if (diff < 0) return `Hace ${-diff}d`;
  return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
}

function TaskListCard({
  task,
  planTitle,
  onStudy,
  onMarkDone,
}: {
  task: PlanningTask;
  planTitle?: string;
  onStudy: () => void;
  onMarkDone: () => void;
}) {
  const effectiveType = (task.contentType ?? task.category) as TaskCategory;
  const meta = CONTENT_META[effectiveType] ?? CONTENT_META.task;
  const Icon = meta.icon;
  const isDone = task.status === "done";
  const due = formatDue(task.dueDate);
  const today = new Date(); today.setHours(0,0,0,0);
  const isOverdue = task.dueDate && !isDone && new Date(task.dueDate + "T00:00:00") < today;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "group relative rounded-2xl border overflow-hidden transition-all",
        isDone
          ? "border-border/20 bg-muted/10 opacity-50"
          : "border-border/50 bg-card/80 hover:border-border hover:shadow-md"
      )}
    >
      {/* Accent bar */}
      <div className={cn("absolute inset-y-0 left-0 w-1", meta.bg.split(" ")[0])} />
      <div className="p-4 pl-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full border", meta.bg, meta.color)}>
            <Icon className="w-3 h-3" />
            {meta.label}
          </span>
          {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {task.status === "in_progress" && !isDone && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <Clock className="w-3 h-3" />
              En progreso
            </span>
          )}
        </div>

        <p className={cn("font-semibold text-sm leading-snug", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </p>

        {task.description && !isDone && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
          {planTitle && <span className="truncate max-w-[130px]">{planTitle}</span>}
          {due && (
            <span className={cn("flex items-center gap-1 shrink-0", isOverdue && "text-red-400")}>
              <CalendarDays className="w-3 h-3" />
              {due}
            </span>
          )}
        </div>

        {!isDone && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={onStudy} className="flex-1 gap-2 h-8 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Estudiar
            </Button>
            <Button
              size="sm" variant="ghost" onClick={onMarkDone}
              title="Marcar como hecha"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-400"
            >
              <CheckCircle2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD SOURCE MODAL
// ══════════════════════════════════════════════════════════════════════════════

function AddSourceModal({
  onAdd,
  onClose,
}: {
  onAdd: (type: NotebookSource["type"], title: string, content: string, file?: File) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"text" | "url" | "file">("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canSubmit = useMemo(() => {
    if (tab === "text") return content.trim().length > 20;
    if (tab === "url") return isValidUrl(url);
    if (tab === "file") return file !== null && !fileError;
    return false;
  }, [tab, content, url, file, fileError]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFileError("");
    if (!f) { setFile(null); return; }
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ACCEPTED_FILE_EXTS.includes(ext)) { setFileError(`Tipo no soportado: .${ext}`); return; }
    if (f.size > 10 * 1024 * 1024) { setFileError("Máximo 10 MB."); return; }
    setFile(f);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (tab === "text") onAdd("text", title.trim() || content.slice(0, 50) + "…", content.trim());
    else if (tab === "url") onAdd("url", title.trim() || urlTitle(url), url.trim());
    else if (tab === "file" && file) onAdd("file", title.trim() || file.name, file.name, file);
    onClose();
  };

  const TABS = [
    { id: "text" as const, icon: FileText, label: "Texto" },
    { id: "url"  as const, icon: Globe,    label: "URL"   },
    { id: "file" as const, icon: Upload,   label: "Archivo" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative z-10 w-full max-w-md bg-card border border-border/60 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Agregar fuente</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
          {TABS.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={cn("flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all",
                tab === id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Título (opcional)"
            className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />

          {tab === "text" && (
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="Pega texto, apuntes o contenido aquí…" rows={6}
              className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2.5 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 resize-none" />
          )}
          {tab === "url" && (
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…"
              className="w-full rounded-xl border border-border/50 bg-muted/20 px-4 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50" />
          )}
          {tab === "file" && (
            <div className="space-y-2">
              <button type="button" onClick={() => fileRef.current?.click()}
                className={cn("w-full rounded-xl border-2 border-dashed px-4 py-5 text-sm flex flex-col items-center gap-1.5 transition-colors",
                  file ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-400"
                       : "border-border/50 hover:border-primary/40 text-muted-foreground")}>
                <Upload className="w-5 h-5" />
                {file ? <span className="font-medium">{file.name}</span>
                      : <><span>Selecciona un archivo</span><span className="text-xs opacity-60">PDF, TXT, MD, CSV · máx. 10 MB</span></>}
              </button>
              <input ref={fileRef} type="file" accept={ACCEPTED_FILE_TYPES} onChange={handleFile} className="hidden" />
              {fileError && <div className="flex items-center gap-1.5 text-xs text-red-400"><AlertCircle className="w-3.5 h-3.5" />{fileError}</div>}
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={!canSubmit} className="w-full gap-2">
          <Plus className="w-4 h-4" />Agregar fuente
        </Button>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TASK WORKSPACE (NotebookLM-style)
// ══════════════════════════════════════════════════════════════════════════════

function parseFlashcards(text: string): { front: string; back: string }[] {
  const cards: { front: string; back: string }[] = [];
  const blocks = text.split(/\n{2,}/);
  for (const b of blocks) {
    const f = b.match(/FRENTE:\s*(.+)/i);
    const r = b.match(/REVERSO:\s*(.+)/i);
    if (f && r) cards.push({ front: f[1].trim(), back: r[1].trim() });
  }
  if (!cards.length) {
    for (const line of text.split("\n")) {
      const parts = line.split("|");
      if (parts.length === 2 && parts[0].trim() && parts[1].trim())
        cards.push({ front: parts[0].trim(), back: parts[1].trim() });
    }
  }
  return cards;
}

function parseMindMap(text: string): MindNode | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as MindNode;
  } catch { return null; }
}

interface TaskWorkspaceProps {
  task: PlanningTask;
  planTitle?: string;
  onBack: () => void;
  onStatusChange: (s: PlanningTask["status"]) => void;
}

function TaskWorkspace({ task, planTitle, onBack, onStatusChange }: TaskWorkspaceProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const isMobile = useIsMobile();
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("chat");

  const effectiveType = (task.contentType ?? task.category) as TaskCategory;
  const meta = CONTENT_META[effectiveType] ?? CONTENT_META.task;
  const Icon = meta.icon;

  // ── Sources ───────────────────────────────────────────────────────────────
  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const fileQueueRef = useRef<Record<string, File>>({});

  // ── Chat ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Studio ────────────────────────────────────────────────────────────────
  const [studioTab, setStudioTab] = useState<StudioTab>("flashcards");
  const [studioContent, setStudioContent] = useState<Record<StudioTab, string>>({
    flashcards: "", quiz: "", mindmap: "", guide: "",
  });
  const [studioLoading, setStudioLoading] = useState<Record<StudioTab, boolean>>({
    flashcards: false, quiz: false, mindmap: false, guide: false,
  });
  const [flashcardMode, setFlashcardMode] = useState(false);

  // ── Apollo ────────────────────────────────────────────────────────────────
  const [extractText] = useMutation(EXTRACT_TEXT, { client: aiClient });
  const [scrapeUrl] = useMutation(SCRAPE_URL, { client: aiClient });
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => { if (streamRef.current) clearInterval(streamRef.current); }, []);

  // Build context from task + sources
  const buildContext = useCallback(() => {
    const parts: string[] = [];
    parts.push(`Tema: ${task.title}`);
    if (task.description) parts.push(`Contexto: ${task.description}`);
    const readySources = sources.filter((s) => s.status === "ready" && s.summary);
    for (const s of readySources) parts.push(`Fuente "${s.title}": ${s.summary}`);
    return parts.join("\n");
  }, [task, sources]);

  // Stream text into a message
  const streamText = useCallback((msgId: string, text: string, onDone: () => void) => {
    if (streamRef.current) clearInterval(streamRef.current);
    let pos = 0;
    streamRef.current = setInterval(() => {
      pos += STREAM_CHARS;
      const done = pos >= text.length;
      setMessages((prev) => prev.map((m) =>
        m.id === msgId ? { ...m, content: done ? text : text.slice(0, pos), streaming: !done } : m
      ));
      if (done) { clearInterval(streamRef.current!); streamRef.current = null; onDone(); }
    }, STREAM_MS);
  }, []);

  // Send chat message
  const sendChat = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatLoading) return;
    setChatInput("");
    setChatLoading(true);

    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", content: trimmed }]);
    const assistId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: assistId, role: "assistant", content: "", streaming: true }]);

    try {
      const ctx = buildContext();
      const fullMsg = `${ctx}\n\nPregunta del estudiante: ${trimmed}`;
      const { data } = await sendMsg({
        variables: {
          input: { message: fullMsg, sessionId: sessionIdRef.current ?? undefined, useRag: true,
            userProfile: userId ? { userId } : undefined },
        },
      });
      const result = data?.sendMessage;
      if (result?.sessionId) sessionIdRef.current = result.sessionId;
      streamText(assistId, result?.reply ?? "No pude procesar tu pregunta.", () => setChatLoading(false));
    } catch {
      setMessages((prev) => prev.map((m) =>
        m.id === assistId ? { ...m, content: "Error de conexión. Intenta de nuevo.", streaming: false } : m
      ));
      setChatLoading(false);
    }
  }, [chatLoading, buildContext, sendMsg, streamText, userId]);

  // Generate studio content
  const generate = useCallback(async (tab: StudioTab) => {
    if (studioLoading[tab]) return;
    setStudioLoading((prev) => ({ ...prev, [tab]: true }));
    setStudioContent((prev) => ({ ...prev, [tab]: "" }));
    setFlashcardMode(false);

    const ctx = buildContext();
    const prompts: Record<StudioTab, string> = {
      flashcards: `${ctx}\n\nGenera 12 flashcards de estudio sobre este tema. Formato exacto (una por bloque):\n\nFRENTE: [concepto o pregunta]\nREVERSO: [definición o respuesta]\n\nSepara con línea en blanco.`,
      quiz: `${ctx}\n\nCrea un quiz de 8 preguntas de opción múltiple sobre este tema. Para cada pregunta:\n\n[N]. [Pregunta]\na) [opción]\nb) [opción]*\nc) [opción]\nd) [opción]\n\nMarca la correcta con *. Incluye una breve explicación al final.`,
      mindmap: `${ctx}\n\nGenera un mapa mental en JSON con la siguiente estructura exacta:\n{\n  "topic": "Título del tema",\n  "children": [\n    {\n      "topic": "Rama principal",\n      "children": [\n        { "topic": "Sub-concepto" }\n      ]\n    }\n  ]\n}\nMáximo 3 niveles, 6 ramas principales, 4 hijos por rama. Responde SOLO con el JSON.`,
      guide: `${ctx}\n\nCrea una guía de estudio completa y estructurada. Incluye: 📌 Resumen ejecutivo, 🔑 Conceptos clave, 📖 Explicación detallada, 💡 Ejemplos prácticos, ❓ Preguntas de repaso. Usa emojis para separar secciones.`,
    };

    try {
      const { data } = await sendMsg({
        variables: {
          input: { message: prompts[tab], sessionId: sessionIdRef.current ?? undefined, useRag: true,
            userProfile: userId ? { userId } : undefined },
        },
      });
      const result = data?.sendMessage;
      if (result?.sessionId) sessionIdRef.current = result.sessionId;
      setStudioContent((prev) => ({ ...prev, [tab]: result?.reply ?? "" }));
    } catch {
      setStudioContent((prev) => ({ ...prev, [tab]: "Error al generar. Intenta de nuevo." }));
    } finally {
      setStudioLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, [studioLoading, buildContext, sendMsg, userId]);

  // Auto-generate on tab switch if no content
  useEffect(() => {
    if (!studioContent[studioTab] && !studioLoading[studioTab]) {
      generate(studioTab);
    }
  }, [studioTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add source
  const addSource = useCallback(async (type: NotebookSource["type"], title: string, content: string, file?: File) => {
    const id = crypto.randomUUID();
    if (file) fileQueueRef.current[id] = file;
    setSources((prev) => [...prev, { id, title, type, status: "processing" }]);

    const markReady = (summary: string, nodes: number) =>
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: "ready" as const, summary, nodesCreated: nodes } : s));
    const markError = (msg?: string) =>
      setSources((prev) => prev.map((s) => s.id === id ? { ...s, status: "error" as const, errorMsg: msg } : s));

    try {
      if (type === "text") {
        const { data } = await extractText({ variables: { input: { text: content, sourceRef: id, visibility: "private" } } });
        const r = data?.extractText;
        markReady(r?.summary ?? content.slice(0, 200), r?.nodesCreated ?? 0);
      } else if (type === "url") {
        const { data } = await scrapeUrl({ variables: { url: content, sourceRef: id, visibility: "private" } });
        const r = data?.scrapeUrl;
        markReady(r?.summary ?? `Página: ${title}`, r?.nodesCreated ?? 0);
      } else if (type === "file") {
        const fileObj = fileQueueRef.current[id];
        if (!fileObj) { markError("Archivo no encontrado"); return; }
        delete fileQueueRef.current[id];
        const form = new FormData();
        form.append("file", fileObj);
        const resp = await fetch("/api/study/extract-file", { method: "POST", body: form });
        const json = await resp.json();
        if (!resp.ok || json.error) { markError(json.error); return; }
        const { data } = await extractText({ variables: { input: { text: json.text, sourceRef: id, visibility: "private" } } });
        const r = data?.extractText;
        markReady(r?.summary ?? json.text.slice(0, 200), r?.nodesCreated ?? 0);
      }
    } catch (err) {
      markError(err instanceof Error ? err.message : undefined);
    }
  }, [extractText, scrapeUrl]);

  // ── Studio panel content ──────────────────────────────────────────────────
  const mindMapData = useMemo(() => parseMindMap(studioContent.mindmap), [studioContent.mindmap]);
  const flashcards = useMemo(() => parseFlashcards(studioContent.flashcards), [studioContent.flashcards]);

  const STUDIO_TABS: { id: StudioTab; icon: typeof Brain; label: string }[] = [
    { id: "flashcards", icon: Brain,       label: "Flashcards" },
    { id: "quiz",       icon: CheckSquare, label: "Quiz"       },
    { id: "mindmap",    icon: Map,         label: "Mapa Mental" },
    { id: "guide",      icon: BookOpen,    label: "Guía"       },
  ];

  const SOURCE_ICONS: Record<NotebookSource["type"], typeof FileText> = {
    text: FileText, url: Globe, file: Upload,
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3 md:mb-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={cn("p-1.5 rounded-lg border shrink-0", meta.bg)}>
            <Icon className={cn("w-4 h-4", meta.color)} />
          </span>
          <h1 className="font-bold text-base truncate">{task.title}</h1>
          {planTitle && <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">· {planTitle}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.status !== "done" ? (
            <Button size="sm" variant="outline" onClick={() => onStatusChange("done")} className="gap-1.5 h-7 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />Marcar hecha
            </Button>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Completada</span>
          )}
        </div>
      </div>

      {/* Mobile panel tabs */}
      <div className="flex md:hidden border-b border-border/40 bg-background/50 rounded-t-2xl flex-shrink-0 overflow-hidden">
        {(["context", "chat", "studio"] as MobilePanel[]).map((panel) => {
          const labels: Record<MobilePanel, string> = { context: "Contexto", chat: "Tutor IA", studio: "Studio" };
          const icons: Record<MobilePanel, typeof MessageSquare> = { context: Library, chat: MessageSquare, studio: Brain };
          const Icon = icons[panel];
          return (
            <button
              key={panel}
              onClick={() => setMobilePanel(panel)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors",
                mobilePanel === panel
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {labels[panel]}
            </button>
          );
        })}
      </div>

      {/* 3-panel workspace */}
      <div className="flex flex-1 overflow-hidden md:rounded-2xl rounded-b-2xl border border-border/50 border-t-0 md:border-t bg-background/50 gap-0">

        {/* Left: Context */}
        <AnimatePresence initial={false}>
          {(leftOpen && (!isMobile || mobilePanel === "context")) && (
            <motion.div
              initial={isMobile ? { opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1 } : { width: 250, opacity: 1 }}
              exit={isMobile ? { opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "shrink-0 border-r border-border/40 flex flex-col overflow-hidden",
                isMobile ? "w-full" : ""
              )}
              style={isMobile ? {} : { width: 250 }}>
              <div className="px-4 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contexto</p>
                <button onClick={() => setShowAddModal(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />Fuente
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* Task description */}
                {task.description && (
                  <div className="rounded-xl bg-muted/20 border border-border/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{task.description}</p>
                  </div>
                )}
                {/* Added sources */}
                {sources.map((s) => {
                  const SIcon = SOURCE_ICONS[s.type] ?? FileText;
                  return (
                    <motion.div key={s.id} layout initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      className="group rounded-xl border border-border/40 bg-card/60 p-2.5">
                      <div className="flex items-start gap-2">
                        <SIcon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{s.title}</p>
                          {s.status === "processing" && <div className="flex items-center gap-1 mt-0.5"><Loader2 className="w-2.5 h-2.5 animate-spin text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Procesando…</span></div>}
                          {s.status === "ready" && <p className="text-[10px] text-emerald-400 mt-0.5">{s.nodesCreated} conceptos</p>}
                          {s.status === "error" && <p className="text-[10px] text-red-400 mt-0.5">{s.errorMsg ?? "Error"}</p>}
                        </div>
                        <button onClick={() => setSources((p) => p.filter((x) => x.id !== s.id))}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                {sources.length === 0 && !task.description && (
                  <p className="text-xs text-muted-foreground text-center py-4">Agrega fuentes para enriquecer el estudio</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Chat */}
        <div className={cn("flex-1 flex flex-col min-w-0", isMobile && mobilePanel !== "chat" && "hidden")}>
          <div className="hidden md:flex items-center justify-between px-4 h-11 border-b border-border/40 shrink-0">
            <button onClick={() => setLeftOpen((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
              <PanelLeftClose className={cn("w-4 h-4 transition-transform", !leftOpen && "rotate-180")} />
            </button>
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />Tutor IA
            </span>
            <button onClick={() => setRightOpen((v) => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
              <PanelRightClose className={cn("w-4 h-4 transition-transform", !rightOpen && "rotate-180")} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-12">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Bot className="w-7 h-7 text-primary/60" />
                </div>
                <div>
                  <p className="font-semibold">Tutor de Estudio</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">Pregúntame sobre <strong>{task.title}</strong> y te ayudaré a entender el tema en profundidad.</p>
                </div>
                <div className="flex flex-col gap-2 w-full max-w-sm">
                  {[`Explícame ${task.title}`, "¿Cuáles son los conceptos más importantes?", "Dame un ejemplo práctico"].map((q) => (
                    <button key={q} onClick={() => sendChat(q)}
                      className="text-left px-3 py-2 rounded-xl border border-border/50 text-xs text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isUser ? "bg-primary/20" : "bg-accent/20")}>
                      {isUser ? <User className="w-3 h-3 text-primary" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div className={cn("max-w-[82%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                      isUser ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted/60 border border-border/40 rounded-tl-sm")}>
                      {msg.streaming && !msg.content
                        ? <span className="flex gap-1">{[0,150,300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</span>
                        : isUser
                          ? <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
                          : <MarkdownRenderer>{msg.content}</MarkdownRenderer>}
                      {msg.streaming && msg.content && <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 animate-pulse" />}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>

          <div className="px-4 py-3 border-t border-border/40 shrink-0">
            <div className="flex items-end gap-2 rounded-xl border border-border/50 bg-muted/20 px-3 py-2 focus-within:border-primary/50 transition-colors">
              <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(chatInput); } }}
                placeholder={`Pregunta sobre ${task.title}…`}
                disabled={chatLoading} rows={1}
                className="flex-1 bg-transparent text-base md:text-sm resize-none focus:outline-none placeholder:text-muted-foreground/40 max-h-24 disabled:opacity-40 min-h-[44px] md:min-h-0 py-2.5 md:py-0" />
              <Button size="sm" onClick={() => sendChat(chatInput)} disabled={chatLoading || !chatInput.trim()} className="h-7 w-7 p-0 shrink-0">
                {chatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: Studio */}
        <AnimatePresence initial={false}>
          {(rightOpen && (!isMobile || mobilePanel === "studio")) && (
            <motion.div
              initial={isMobile ? { opacity: 0 } : { width: 0, opacity: 0 }}
              animate={isMobile ? { opacity: 1 } : { width: 320, opacity: 1 }}
              exit={isMobile ? { opacity: 0 } : { width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "shrink-0 border-l border-border/40 flex flex-col overflow-hidden",
                isMobile ? "w-full" : ""
              )}
              style={isMobile ? {} : { width: 320 }}>
              {/* Studio tabs */}
              <div className="px-3 pt-3 pb-2 border-b border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Studio</p>
                <div className="grid grid-cols-2 gap-1">
                  {STUDIO_TABS.map(({ id, icon: SIcon, label }) => (
                    <button key={id} onClick={() => setStudioTab(id)}
                      className={cn("flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        studioTab === id
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border")}>
                      <SIcon className="w-3.5 h-3.5" />{label}
                      {studioLoading[id] && <Loader2 className="w-2.5 h-2.5 animate-spin ml-0.5" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Studio content */}
              <div className="flex-1 overflow-y-auto p-3">
                {studioLoading[studioTab] && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    <p className="text-xs text-muted-foreground">Generando con IA…</p>
                  </div>
                )}

                {!studioLoading[studioTab] && studioContent[studioTab] && (
                  <div className="space-y-3">
                    <button onClick={() => generate(studioTab)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-3 h-3" />Regenerar
                    </button>

                    {/* Flashcards */}
                    {studioTab === "flashcards" && flashcards.length > 0 && (
                      <>
                        {!flashcardMode ? (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setFlashcardMode(true)}
                              className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400">
                              <Brain className="w-3.5 h-3.5" />Practicar ({flashcards.length} tarjetas)
                            </Button>
                            <div className="space-y-1.5 max-h-72 overflow-y-auto">
                              {flashcards.map((fc, i) => (
                                <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-xs">
                                  <p className="font-medium">{fc.front}</p>
                                  <p className="text-muted-foreground mt-1">{fc.back}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <FlashcardSession cards={flashcards} onComplete={() => setFlashcardMode(false)} onClose={() => setFlashcardMode(false)} />
                        )}
                      </>
                    )}

                    {/* Mind map */}
                    {studioTab === "mindmap" && mindMapData && (
                      <div className="rounded-xl border border-border/40 bg-muted/10 overflow-hidden" style={{ minHeight: 260 }}>
                        <MindMap data={mindMapData} />
                      </div>
                    )}
                    {studioTab === "mindmap" && !mindMapData && (
                      <div className="text-xs text-muted-foreground bg-muted/20 rounded-xl p-3 leading-relaxed max-h-80 overflow-y-auto">
                        <MarkdownRenderer>{studioContent.mindmap}</MarkdownRenderer>
                      </div>
                    )}

                    {/* Quiz & Guide */}
                    {(studioTab === "quiz" || studioTab === "guide") && (
                      <div className="text-xs leading-relaxed text-foreground/85 bg-muted/20 rounded-xl p-3 border border-border/30 max-h-[calc(100vh-22rem)] overflow-y-auto">
                        <MarkdownRenderer>{studioContent[studioTab]}</MarkdownRenderer>
                      </div>
                    )}

                    {/* Flashcards raw if no cards parsed */}
                    {studioTab === "flashcards" && flashcards.length === 0 && (
                      <div className="text-xs leading-relaxed text-foreground/85 bg-muted/20 rounded-xl p-3 border border-border/30 max-h-72 overflow-y-auto">
                        <MarkdownRenderer>{studioContent.flashcards}</MarkdownRenderer>
                      </div>
                    )}

                    <button onClick={() => sendChat(
                      studioTab === "flashcards" ? "Explícame más los conceptos de las flashcards"
                      : studioTab === "quiz" ? "Explícame las respuestas del quiz"
                      : studioTab === "mindmap" ? "Explícame el mapa mental en detalle"
                      : "Profundiza en la guía de estudio"
                    )} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-1">
                      <MessageSquare className="w-3 h-3" />Preguntar al tutor
                    </button>
                  </div>
                )}

                {!studioLoading[studioTab] && !studioContent[studioTab] && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Button size="sm" onClick={() => generate(studioTab)} className="gap-2">
                      <Sparkles className="w-3.5 h-3.5" />Generar
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <AddSourceModal onAdd={addSource} onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function StudySpacePage() {
  const { tasks, loading, setStatus } = useTasks();
  const { plans } = usePlans();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null);

  const planMap = useMemo(() => Object.fromEntries(plans.map((p) => [p.id, p.title])), [plans]);

  const filtered = useMemo(() => {
    const base = tasks.filter((t) => t.status !== "done" || t.status === "done");
    if (activeFilter === "all") return base;
    return base.filter((t) => (t.contentType ?? t.category) === activeFilter);
  }, [tasks, activeFilter]);

  const pending = filtered.filter((t) => t.status !== "done");
  const done = filtered.filter((t) => t.status === "done");

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tasks.filter((t) => t.status !== "done").length };
    for (const t of tasks) {
      if (t.status === "done") continue;
      const key = t.contentType ?? t.category;
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [tasks]);

  if (selectedTask) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
        className="max-w-full">
        <TaskWorkspace
          task={selectedTask}
          planTitle={selectedTask.planId ? planMap[selectedTask.planId] : undefined}
          onBack={() => setSelectedTask(null)}
          onStatusChange={(s) => { setStatus(selectedTask.id, s); if (s === "done") setSelectedTask(null); }}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-400" />Zona de Estudio
        </h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Estudia tus tareas con IA — flashcards, quizzes, mapas mentales y más.
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => {
          const count = tabCounts[tab.id] ?? 0;
          const TabIcon = tab.icon;
          if (tab.id !== "all" && count === 0 && tasks.length > 0) return null;
          return (
            <button key={tab.id} onClick={() => setActiveFilter(tab.id)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                activeFilter === tab.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border/50 text-muted-foreground hover:border-border hover:text-foreground")}>
              <TabIcon className="w-3.5 h-3.5" />{tab.label}
              {count > 0 && (
                <span className={cn("rounded-full px-1.5 py-px text-[10px] font-semibold",
                  activeFilter === tab.id ? "bg-primary-foreground/20" : "bg-muted text-muted-foreground")}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Task grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-muted/20 animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-medium text-muted-foreground">No tienes tareas de estudio aún</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crea un plan de estudio desde el chat para empezar</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Pendientes · {pending.length}</h2>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {pending.map((task) => (
                    <TaskListCard key={task.id} task={task}
                      planTitle={task.planId ? planMap[task.planId] : undefined}
                      onStudy={() => setSelectedTask(task)}
                      onMarkDone={() => setStatus(task.id, "done")} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Completadas · {done.length}</h2>
              <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {done.map((task) => (
                    <TaskListCard key={task.id} task={task}
                      planTitle={task.planId ? planMap[task.planId] : undefined}
                      onStudy={() => setSelectedTask(task)}
                      onMarkDone={() => setStatus(task.id, "todo")} />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

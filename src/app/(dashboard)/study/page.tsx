"use client";

import {
  useState, useCallback, useRef, useEffect, useMemo, Suspense,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { aiClient, API_BASE_URL } from "@/lib/apollo";
import { SEND_MESSAGE, EXTRACT_TEXT, SCRAPE_URL } from "@/graphql/ai/operations";
import { useTasks } from "@/hooks/usePlanning";
import { usePlans } from "@/hooks/usePlans";
import { FlashcardSession } from "@/components/study/FlashcardSession";
import { MindMap, type MindNode } from "@/components/study/MindMap";
import { MarkdownRenderer } from "@/components/lessons/MarkdownRenderer";
import type { PlanningTask, TaskCategory, StudyPhase, ActionPlan } from "@/types/planning";
import {
  Zap, FileText, Plus, Trash2, X, Loader2, Send, Sparkles,
  BookOpen, Brain, CheckSquare, MessageSquare, RefreshCw,
  CheckCircle2, Globe, Upload, AlertCircle, ArrowLeft,
  CalendarDays, Clock, Library,
  Circle, Bell, Code, Play, Map, ChevronRight, ChevronDown,
  MapPin, Navigation,
} from "lucide-react";
import { FloatingChat } from "@/components/study/FloatingChat";
import { TaskMainContent } from "@/components/study/TaskViews";
import { StudyAgentChat } from "@/components/study/StudyAgentChat";
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

// ── Plan context (passed when opening a task from roadmap) ───────────────────

export interface PlanContext {
  planId: string;
  planTitle: string;
  phaseName: string;
  phaseIndex: number;
  totalPhases: number;
  taskPosition: number;        // 1-based within the phase
  totalTasksInPhase: number;
  prevTaskTitle?: string;
  nextTaskTitle?: string;
}

// ── Phase color map (subset matching plan page) ───────────────────────────────

const PHASE_ACCENT: Record<string, string> = {
  indigo: "bg-indigo-500/15 text-indigo-400 border-indigo-500/30",
  violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  teal:   "bg-teal-500/15   text-teal-400   border-teal-500/30",
  emerald:"bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  amber:  "bg-amber-500/15  text-amber-400  border-amber-500/30",
  rose:   "bg-rose-500/15   text-rose-400   border-rose-500/30",
  sky:    "bg-sky-500/15    text-sky-400    border-sky-500/30",
  orange: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};
const PHASE_DOT: Record<string, string> = {
  indigo: "bg-indigo-500", violet: "bg-violet-500", teal: "bg-teal-500",
  emerald: "bg-emerald-500", amber: "bg-amber-500", rose: "bg-rose-500",
  sky: "bg-sky-500", orange: "bg-orange-500",
};

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

type StudioTab = "flashcards" | "quiz" | "mindmap" | "guide";

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

// ══════════════════════════════════════════════════════════════════════════════
// ROADMAP VIEW
// ══════════════════════════════════════════════════════════════════════════════

function RoadmapView({
  plans,
  tasks,
  onOpenTask,
}: {
  plans: ActionPlan[];
  tasks: PlanningTask[];
  onOpenTask: (task: PlanningTask, ctx: PlanContext) => void;
}) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const studyPlans = useMemo(
    () => plans.filter((p) => p.type === "study" && p.status !== "completed"),
    [plans]
  );

  const parsePhases = (plan: ActionPlan): StudyPhase[] => {
    if (!plan.phases) return [];
    try {
      return JSON.parse(plan.phases) as StudyPhase[];
    } catch { return []; }
  };

  // Auto-expand current phase on mount
  useEffect(() => {
    const init = new Set<string>();
    for (const plan of studyPlans) {
      const phases = parsePhases(plan);
      const planTasks = tasks.filter((t) => t.planId === plan.id);
      for (let i = 0; i < phases.length; i++) {
        const pt = planTasks.filter((t) => t.phaseIndex === i);
        const allDone = pt.length > 0 && pt.every((t) => t.status === "done");
        if (!allDone) { init.add(`${plan.id}-${i}`); break; }
      }
    }
    setExpandedPhases(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studyPlans.length, tasks.length]);

  const togglePhase = (key: string) =>
    setExpandedPhases((prev) => { const s = new Set(prev); s.has(key) ? s.delete(key) : s.add(key); return s; });

  if (studyPlans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center">
          <Map className="w-8 h-8 text-muted-foreground/30" />
        </div>
        <div>
          <p className="font-semibold text-muted-foreground">Sin planes de estudio activos</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Crea un plan desde el asesor IA para ver tu ruta aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {studyPlans.map((plan) => {
        const phases = parsePhases(plan);
        const planTasks = tasks.filter((t) => t.planId === plan.id);
        const donePlanTasks = planTasks.filter((t) => t.status === "done").length;
        const planProgress = planTasks.length === 0 ? 0 : Math.round((donePlanTasks / planTasks.length) * 100);

        // Find overall current task
        const currentTaskIdx = planTasks
          .slice()
          .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
          .findIndex((t) => t.status !== "done");
        const currentTask = planTasks[currentTaskIdx];

        return (
          <div key={plan.id} className="rounded-2xl border border-border/40 overflow-hidden">
            {/* Plan header */}
            <div className="px-5 py-4 bg-muted/10 border-b border-border/30">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
                    <h3 className="font-bold text-base truncate">{plan.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted/40 overflow-hidden max-w-48">
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${planProgress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {donePlanTasks}/{planTasks.length} tareas · {planProgress}%
                    </span>
                  </div>
                </div>
                {plan.dueDate && (
                  <span className="text-xs text-muted-foreground/50 flex-shrink-0">
                    <CalendarDays className="w-3 h-3 inline mr-1" />
                    {new Date(plan.dueDate + "T00:00:00").toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            </div>

            {/* Phases */}
            <div className="divide-y divide-border/20">
              {phases.length === 0 ? (
                // No phases — show tasks flat
                <div className="px-4 py-3 space-y-1">
                  {planTasks.map((task) => (
                    <RoadmapTaskRow
                      key={task.id}
                      task={task}
                      isCurrent={task.id === currentTask?.id}
                      context={{ planId: plan.id, planTitle: plan.title, phaseName: "", phaseIndex: 0, totalPhases: 1, taskPosition: 1, totalTasksInPhase: planTasks.length }}
                      onOpen={onOpenTask}
                    />
                  ))}
                </div>
              ) : (
                phases.map((phase, phaseIdx) => {
                  const phaseKey = `${plan.id}-${phaseIdx}`;
                  const isExpanded = expandedPhases.has(phaseKey);
                  const phaseTasks = planTasks
                    .filter((t) => t.phaseIndex === phaseIdx)
                    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
                  const phaseDone = phaseTasks.filter((t) => t.status === "done").length;
                  const phaseComplete = phaseTasks.length > 0 && phaseDone === phaseTasks.length;
                  const isCurrent = phaseTasks.some((t) => t.id === currentTask?.id);
                  const accent = PHASE_ACCENT[(phase as StudyPhase & { color?: string }).color ?? "indigo"] ?? PHASE_ACCENT.indigo;
                  const dot = PHASE_DOT[(phase as StudyPhase & { color?: string }).color ?? "indigo"] ?? PHASE_DOT.indigo;

                  return (
                    <div key={phaseKey}>
                      {/* Phase header */}
                      <button
                        onClick={() => togglePhase(phaseKey)}
                        className={cn(
                          "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                          isCurrent ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-muted/20"
                        )}
                      >
                        {/* Phase number */}
                        <span className={cn(
                          "w-7 h-7 rounded-xl border flex items-center justify-center text-xs font-bold flex-shrink-0",
                          phaseComplete ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : accent
                        )}>
                          {phaseComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : phaseIdx + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-semibold", isCurrent && "text-primary")}>
                              {phase.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-semibold bg-primary/15 text-primary px-1.5 py-0.5 rounded-full flex-shrink-0">
                                Aquí ahora
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="w-24 h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden flex-shrink-0">
                              <div
                                className={cn("h-full rounded-full transition-all duration-500", dot)}
                                style={{ width: `${phaseTasks.length === 0 ? 0 : Math.round((phaseDone / phaseTasks.length) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-muted-foreground/50 tabular-nums">
                              {phaseDone}/{phaseTasks.length}
                            </span>
                          </div>
                        </div>

                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground/40 flex-shrink-0 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      </button>

                      {/* Phase tasks */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            key="phase-tasks"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-3 pt-1 space-y-1 bg-muted/5 border-t border-border/15">
                              {phaseTasks.map((task, taskIdx) => (
                                <RoadmapTaskRow
                                  key={task.id}
                                  task={task}
                                  isCurrent={task.id === currentTask?.id}
                                  context={{
                                    planId: plan.id,
                                    planTitle: plan.title,
                                    phaseName: phase.title,
                                    phaseIndex: phaseIdx,
                                    totalPhases: phases.length,
                                    taskPosition: taskIdx + 1,
                                    totalTasksInPhase: phaseTasks.length,
                                    prevTaskTitle: phaseTasks[taskIdx - 1]?.title,
                                    nextTaskTitle: phaseTasks[taskIdx + 1]?.title,
                                  }}
                                  onOpen={onOpenTask}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Roadmap task row ──────────────────────────────────────────────────────────

function RoadmapTaskRow({
  task,
  isCurrent,
  context,
  onOpen,
}: {
  task: PlanningTask;
  isCurrent: boolean;
  context: PlanContext;
  onOpen: (task: PlanningTask, ctx: PlanContext) => void;
}) {
  const effectiveType = (task.contentType ?? task.category) as TaskCategory;
  const meta = CONTENT_META[effectiveType] ?? CONTENT_META.task;
  const Icon = meta.icon;
  const isDone = task.status === "done";
  const isStudy = ["lesson", "reading", "quiz", "flashcard", "practice"].includes(effectiveType);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
        isCurrent
          ? "bg-primary/8 border border-primary/20"
          : isDone
            ? "opacity-50"
            : "hover:bg-muted/30"
      )}
    >
      {/* Status icon */}
      <div className="flex-shrink-0">
        {isDone
          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          : isCurrent
            ? <Navigation className="w-4 h-4 text-primary animate-pulse" />
            : <Circle className="w-4 h-4 text-muted-foreground/30" />
        }
      </div>

      {/* Type badge */}
      <span className={cn(
        "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-md border flex-shrink-0",
        meta.bg, meta.color
      )}>
        <Icon className="w-2.5 h-2.5" />
        {meta.label}
      </span>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm truncate",
          isDone && "line-through text-muted-foreground/50",
          isCurrent && "font-semibold text-foreground"
        )}>
          {task.title}
        </p>
        {isCurrent && context.prevTaskTitle && (
          <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">
            Continúa desde: {context.prevTaskTitle}
          </p>
        )}
        {task.dueDate && !isDone && (
          <p className="text-[10px] text-muted-foreground/40 mt-0.5">
            <CalendarDays className="w-2.5 h-2.5 inline mr-0.5" />
            {new Date(task.dueDate + "T00:00:00").toLocaleDateString("es-ES", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Study button */}
      {isStudy && !isDone && (
        <button
          onClick={() => onOpen(task, context)}
          className={cn(
            "flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg transition-all flex-shrink-0",
            isCurrent
              ? "bg-primary text-primary-foreground hover:bg-primary/80"
              : "bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary opacity-0 group-hover:opacity-100"
          )}
        >
          <Play className="w-3 h-3" />
          {isCurrent ? "Estudiar ahora" : "Estudiar"}
        </button>
      )}
    </motion.div>
  );
}

interface TaskWorkspaceProps {
  task: PlanningTask;
  planTitle?: string;
  planContext?: PlanContext;
  onBack: () => void;
  onStatusChange: (s: PlanningTask["status"]) => void;
}

function TaskWorkspace({ task, planTitle, planContext, onBack, onStatusChange }: TaskWorkspaceProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const effectiveType = (task.contentType ?? task.category) as TaskCategory;
  const meta = CONTENT_META[effectiveType] ?? CONTENT_META.task;
  const Icon = meta.icon;

  // ── Sources panel ─────────────────────────────────────────────────────────
  const [sources, setSources] = useState<NotebookSource[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const fileQueueRef = useRef<Record<string, File>>({});

  // ── Studio panel ──────────────────────────────────────────────────────────
  const [studioTab, setStudioTab] = useState<StudioTab>("guide");
  const [studioContent, setStudioContent] = useState<Record<StudioTab, string>>({
    flashcards: "", quiz: "", mindmap: "", guide: "",
  });
  const [studioLoading, setStudioLoading] = useState<Record<StudioTab, boolean>>({
    flashcards: false, quiz: false, mindmap: false, guide: false,
  });
  const [flashcardMode, setFlashcardMode] = useState(false);
  const studioSessionRef = useRef<string | null>(null);

  // ── Apollo ────────────────────────────────────────────────────────────────
  const [extractText] = useMutation(EXTRACT_TEXT, { client: aiClient });
  const [scrapeUrl] = useMutation(SCRAPE_URL, { client: aiClient });
  const [sendMsg] = useMutation(SEND_MESSAGE, { client: aiClient });

  // Build context for AI (shared by type-views and chat)
  const buildContext = useCallback(() => {
    const parts: string[] = [`Tema: ${task.title}`];
    if (task.description) parts.push(`Contexto: ${task.description}`);
    for (const s of sources.filter((s) => s.status === "ready" && s.summary))
      parts.push(`Fuente "${s.title}": ${s.summary}`);
    return parts.join("\n");
  }, [task, sources]);

  // Generate studio content
  const generateStudio = useCallback(async (tab: StudioTab) => {
    if (studioLoading[tab]) return;
    setStudioLoading((prev) => ({ ...prev, [tab]: true }));
    setStudioContent((prev) => ({ ...prev, [tab]: "" }));
    setFlashcardMode(false);
    const ctx = buildContext();
    const prompts: Record<StudioTab, string> = {
      flashcards: `${ctx}\n\nGenera 12 flashcards de estudio. Formato:\n\nFRENTE: [concepto]\nREVERSO: [definición]\n\nSepara con línea en blanco.`,
      quiz: `${ctx}\n\nCrea un quiz de 8 preguntas de opción múltiple.\n[N]. [Pregunta]\na) [opción]\nb) [opción]*\nc) [opción]\nd) [opción]\nMarca la correcta con *.`,
      mindmap: `${ctx}\n\nGenera un mapa mental en JSON:\n{"topic":"Título","children":[{"topic":"Rama","children":[{"topic":"Sub"}]}]}\nMáximo 3 niveles, 6 ramas. Solo JSON.`,
      guide: `${ctx}\n\nCrea una guía de estudio completa: 📌 Resumen, 🔑 Conceptos clave, 📖 Explicación, 💡 Ejemplos, ❓ Preguntas de repaso.`,
    };
    try {
      const { data } = await sendMsg({
        variables: { input: { message: prompts[tab], sessionId: studioSessionRef.current ?? undefined, useRag: true, userProfile: userId ? { userId } : undefined } },
      });
      const r = data?.sendMessage;
      if (r?.sessionId) studioSessionRef.current = r.sessionId;
      setStudioContent((prev) => ({ ...prev, [tab]: r?.reply ?? "" }));
    } catch {
      setStudioContent((prev) => ({ ...prev, [tab]: "Error al generar." }));
    } finally {
      setStudioLoading((prev) => ({ ...prev, [tab]: false }));
    }
  }, [studioLoading, buildContext, sendMsg, userId]);

  useEffect(() => {
    if (rightOpen && !studioContent[studioTab] && !studioLoading[studioTab]) {
      generateStudio(studioTab);
    }
  }, [studioTab, rightOpen]); // eslint-disable-line react-hooks/exhaustive-deps

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
        const token = (session as unknown as { backendToken?: string } | null)?.backendToken;
        const resp = await fetch(`${API_BASE_URL}/api/files/extract`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: form,
        });
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

  const mindMapData = useMemo(() => parseMindMap(studioContent.mindmap), [studioContent.mindmap]);
  const studioFlashcards = useMemo(() => parseFlashcards(studioContent.flashcards), [studioContent.flashcards]);

  const STUDIO_TABS: { id: StudioTab; icon: typeof Brain; label: string }[] = [
    { id: "guide",      icon: BookOpen,    label: "Guía"        },
    { id: "flashcards", icon: Brain,       label: "Flashcards"  },
    { id: "quiz",       icon: CheckSquare, label: "Quiz"        },
    { id: "mindmap",    icon: Map,         label: "Mapa"        },
  ];

  const SOURCE_ICONS: Record<NotebookSource["type"], typeof FileText> = { text: FileText, url: Globe, file: Upload };

  return (
    <div className="flex flex-col h-[calc(100dvh-6rem)] md:h-[calc(100dvh-7rem)]">
      {/* Plan context breadcrumb */}
      {planContext && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mb-2 flex-wrap">
          <MapPin className="w-3 h-3 text-primary/60 flex-shrink-0" />
          <span className="text-primary/80 font-medium truncate max-w-[150px]">{planContext.planTitle}</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[120px]">{planContext.phaseName}</span>
          <ChevronRight className="w-3 h-3 flex-shrink-0" />
          <span className="tabular-nums">Tarea {planContext.taskPosition}/{planContext.totalTasksInPhase}</span>
          {planContext.prevTaskTitle && (
            <>
              <span className="text-muted-foreground/30 mx-1">·</span>
              <span className="text-muted-foreground/40 truncate max-w-[160px]">
                Continúa desde: {planContext.prevTaskTitle}
              </span>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-3 md:mb-4 flex-shrink-0">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />Volver
        </button>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={cn("p-1.5 rounded-lg border shrink-0", meta.bg)}>
            <Icon className={cn("w-4 h-4", meta.color)} />
          </span>
          <h1 className="font-bold text-base truncate">{task.title}</h1>
          {planTitle && !planContext && <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">· {planTitle}</span>}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button title="Fuentes" onClick={() => setLeftOpen((v) => !v)}
            className={cn("p-1.5 rounded-lg border transition-colors text-xs",
              leftOpen ? "bg-primary/10 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground")}>
            <Library className="w-3.5 h-3.5" />
          </button>
          <button title="Studio" onClick={() => { setRightOpen((v) => !v); }}
            className={cn("p-1.5 rounded-lg border transition-colors text-xs",
              rightOpen ? "bg-primary/10 border-primary/30 text-primary" : "border-border/50 text-muted-foreground hover:text-foreground")}>
            <Brain className="w-3.5 h-3.5" />
          </button>
          <FloatingChat task={task} userId={userId} buildContext={buildContext} />
          {task.status !== "done" ? (
            <Button size="sm" variant="outline" onClick={() => onStatusChange("done")} className="gap-1.5 h-7 text-xs ml-1">
              <CheckCircle2 className="w-3.5 h-3.5" />Hecha
            </Button>
          ) : (
            <span className="text-xs text-emerald-400 flex items-center gap-1 ml-1"><CheckCircle2 className="w-3.5 h-3.5" />Completada</span>
          )}
        </div>
      </div>

      {/* 3-panel workspace */}
      <div className="flex flex-1 overflow-hidden rounded-2xl border border-border/50 bg-background/50">

        {/* Left: Sources */}
        <AnimatePresence initial={false}>
          {leftOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-r border-border/40 flex flex-col overflow-hidden"
              style={{ width: 240 }}>
              <div className="px-4 pt-4 pb-3 border-b border-border/40 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuentes</p>
                <button onClick={() => setShowAddModal(true)} className="text-xs text-primary hover:text-primary/80 flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" />Agregar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {task.description && (
                  <div className="rounded-xl bg-muted/20 border border-border/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Descripción</p>
                    <p className="text-xs text-foreground/80 leading-relaxed">{task.description}</p>
                  </div>
                )}
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
                  <p className="text-xs text-muted-foreground text-center py-4">Agrega texto, URL o archivo para enriquecer el contenido</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center: Type-specific content */}
        <div className="flex-1 overflow-hidden min-w-0">
          <TaskMainContent task={task} userId={userId} buildContext={buildContext} />
        </div>

        {/* Right: Studio */}
        <AnimatePresence initial={false}>
          {rightOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 300, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-l border-border/40 flex flex-col overflow-hidden"
              style={{ width: 300 }}>
              <div className="px-3 pt-3 pb-2 border-b border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Studio IA</p>
                <div className="grid grid-cols-2 gap-1">
                  {STUDIO_TABS.map(({ id, icon: SIcon, label }) => (
                    <button key={id} onClick={() => setStudioTab(id)}
                      className={cn("flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all border",
                        studioTab === id ? "bg-primary/10 border-primary/30 text-primary" : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border")}>
                      <SIcon className="w-3.5 h-3.5" />{label}
                      {studioLoading[id] && <Loader2 className="w-2.5 h-2.5 animate-spin ml-0.5" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {studioLoading[studioTab] && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                    <p className="text-xs text-muted-foreground">Generando con IA…</p>
                  </div>
                )}
                {!studioLoading[studioTab] && studioContent[studioTab] && (
                  <div className="space-y-3">
                    <button onClick={() => generateStudio(studioTab)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-3 h-3" />Regenerar
                    </button>
                    {studioTab === "flashcards" && studioFlashcards.length > 0 && (
                      !flashcardMode ? (
                        <>
                          <Button size="sm" variant="outline" onClick={() => setFlashcardMode(true)}
                            className="w-full gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:text-amber-400">
                            <Brain className="w-3.5 h-3.5" />Practicar ({studioFlashcards.length} tarjetas)
                          </Button>
                          <div className="space-y-1.5 max-h-72 overflow-y-auto">
                            {studioFlashcards.map((fc, i) => (
                              <div key={i} className="rounded-lg border border-border/40 bg-muted/20 p-2.5 text-xs">
                                <p className="font-medium">{fc.front}</p>
                                <p className="text-muted-foreground mt-1">{fc.back}</p>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <FlashcardSession cards={studioFlashcards} onComplete={() => setFlashcardMode(false)} onClose={() => setFlashcardMode(false)} />
                      )
                    )}
                    {studioTab === "mindmap" && mindMapData && (
                      <div className="rounded-xl border border-border/40 bg-muted/10 overflow-hidden" style={{ minHeight: 240 }}>
                        <MindMap data={mindMapData} />
                      </div>
                    )}
                    {studioTab === "mindmap" && !mindMapData && (
                      <div className="text-xs bg-muted/20 rounded-xl p-3 max-h-80 overflow-y-auto">
                        <MarkdownRenderer>{studioContent.mindmap}</MarkdownRenderer>
                      </div>
                    )}
                    {(studioTab === "quiz" || studioTab === "guide") && (
                      <div className="text-xs bg-muted/20 rounded-xl p-3 border border-border/30 max-h-[calc(100vh-22rem)] overflow-y-auto">
                        <MarkdownRenderer>{studioContent[studioTab]}</MarkdownRenderer>
                      </div>
                    )}
                    {studioTab === "flashcards" && studioFlashcards.length === 0 && (
                      <div className="text-xs bg-muted/20 rounded-xl p-3 border border-border/30 max-h-72 overflow-y-auto">
                        <MarkdownRenderer>{studioContent.flashcards}</MarkdownRenderer>
                      </div>
                    )}
                  </div>
                )}
                {!studioLoading[studioTab] && !studioContent[studioTab] && (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Button size="sm" onClick={() => generateStudio(studioTab)} className="gap-2">
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
        {showAddModal && <AddSourceModal onAdd={addSource} onClose={() => setShowAddModal(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

function StudySpaceInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks, loading, setStatus } = useTasks();
  const { plans } = usePlans();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [viewMode, setViewMode] = useState<"tareas" | "roadmap">("tareas");
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null);
  const [selectedContext, setSelectedContext] = useState<PlanContext | null>(null);
  const [showStudyAgent, setShowStudyAgent] = useState(false);

  const planMap = useMemo(() => Object.fromEntries(plans.map((p) => [p.id, p.title])), [plans]);

  // Auto-select task from URL param ?taskId=
  useEffect(() => {
    const taskId = searchParams.get("taskId");
    if (!taskId || tasks.length === 0) return;
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setSelectedContext(null);
      // Clean URL without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("taskId");
      router.replace(url.pathname, { scroll: false });
    }
  }, [searchParams, tasks, router]);

  const openTask = useCallback((task: PlanningTask, ctx?: PlanContext) => {
    setSelectedTask(task);
    setSelectedContext(ctx ?? null);
  }, []);

  const filtered = useMemo(() => {
    const base = tasks;
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
          planContext={selectedContext ?? undefined}
          onBack={() => { setSelectedTask(null); setSelectedContext(null); }}
          onStatusChange={(s) => { setStatus(selectedTask.id, s); if (s === "done") { setSelectedTask(null); setSelectedContext(null); } }}
        />
      </motion.div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-400" />Zona de Estudio
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Estudia tus tareas con IA — flashcards, quizzes, mapas mentales y más.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowStudyAgent((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Brain className="w-3.5 h-3.5" />
            Asesor IA
          </button>
        </div>
      </div>

      {/* View mode + filter tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* View mode switcher */}
        <div className="flex rounded-xl border border-border/50 overflow-hidden flex-shrink-0">
          <button
            onClick={() => setViewMode("tareas")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors",
              viewMode === "tareas"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Zap className="w-3.5 h-3.5" />Tareas
          </button>
          <button
            onClick={() => setViewMode("roadmap")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-l border-border/50",
              viewMode === "roadmap"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            )}
          >
            <Map className="w-3.5 h-3.5" />Roadmap
          </button>
        </div>

        {/* Content-type filters (only in tareas view) */}
        {viewMode === "tareas" && FILTER_TABS.map((tab) => {
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

      {/* Roadmap view */}
      {viewMode === "roadmap" && (
        <RoadmapView plans={plans} tasks={tasks} onOpenTask={openTask} />
      )}

      {/* Task grid */}
      {viewMode === "tareas" && (
        loading ? (
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
                        onStudy={() => openTask(task)}
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
                        onStudy={() => openTask(task)}
                        onMarkDone={() => setStatus(task.id, "todo")} />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}
          </div>
        )
      )}

      {/* Study Agent floating chat */}
      <AnimatePresence>
        {showStudyAgent && (
          <StudyAgentChat onClose={() => setShowStudyAgent(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudySpacePage() {
  return (
    <Suspense>
      <StudySpaceInner />
    </Suspense>
  );
}

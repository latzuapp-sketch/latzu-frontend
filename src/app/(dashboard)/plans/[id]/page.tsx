"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { entityClient } from "@/lib/apollo";
import {
  GET_ENTITY,
  GET_ENTITIES,
  UPDATE_ENTITY,
  DELETE_ENTITY,
  CREATE_ENTITY,
} from "@/graphql/api/operations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { BlockEditor } from "@/components/biblioteca/BlockEditor";
import type {
  ActionPlan,
  PlanningTask,
  PlanStatus,
  TaskStatus,
  StudySchedule,
  StudyPhase,
  StudySubPhase,
} from "@/types/planning";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  PauseCircle,
  PlayCircle,
  Trash2,
  Plus,
  CalendarDays,
  Clock,
  Sparkles,
  Target,
  BookOpen,
  Zap,
  Loader2,
  Calendar,
  CheckCheck,
  GripVertical,
  ChevronDown,
  Tag,
  Hash,
  Brain,
  FileText,
  CheckSquare,
  Play,
  Code,
  Bell,
  AlarmClock,
  ChevronRight,
  X,
  Layers,
  CalendarRange,
  LayoutList,
} from "lucide-react";

// ─── Phase color palette ───────────────────────────────────────────────────────

const PHASE_COLORS = [
  { name: "indigo",  border: "border-indigo-500/35",  bg: "bg-indigo-500/10",  headerBg: "bg-gradient-to-br from-indigo-500/20 to-indigo-500/5",  text: "text-indigo-400",  dot: "bg-indigo-500",  numBg: "bg-indigo-500/15 border-indigo-500/40",  chipBg: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"  },
  { name: "violet",  border: "border-violet-500/35",  bg: "bg-violet-500/10",  headerBg: "bg-gradient-to-br from-violet-500/20 to-violet-500/5",  text: "text-violet-400",  dot: "bg-violet-500",  numBg: "bg-violet-500/15 border-violet-500/40",  chipBg: "bg-violet-500/10 border-violet-500/20 text-violet-400"  },
  { name: "teal",    border: "border-teal-500/35",    bg: "bg-teal-500/10",    headerBg: "bg-gradient-to-br from-teal-500/20 to-teal-500/5",    text: "text-teal-400",    dot: "bg-teal-500",    numBg: "bg-teal-500/15 border-teal-500/40",    chipBg: "bg-teal-500/10 border-teal-500/20 text-teal-400"    },
  { name: "emerald", border: "border-emerald-500/35", bg: "bg-emerald-500/10", headerBg: "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-500", numBg: "bg-emerald-500/15 border-emerald-500/40", chipBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" },
  { name: "amber",   border: "border-amber-500/35",   bg: "bg-amber-500/10",   headerBg: "bg-gradient-to-br from-amber-500/20 to-amber-500/5",   text: "text-amber-400",   dot: "bg-amber-500",   numBg: "bg-amber-500/15 border-amber-500/40",   chipBg: "bg-amber-500/10 border-amber-500/20 text-amber-400"   },
  { name: "rose",    border: "border-rose-500/35",    bg: "bg-rose-500/10",    headerBg: "bg-gradient-to-br from-rose-500/20 to-rose-500/5",    text: "text-rose-400",    dot: "bg-rose-500",    numBg: "bg-rose-500/15 border-rose-500/40",    chipBg: "bg-rose-500/10 border-rose-500/20 text-rose-400"    },
  { name: "sky",     border: "border-sky-500/35",     bg: "bg-sky-500/10",     headerBg: "bg-gradient-to-br from-sky-500/20 to-sky-500/5",     text: "text-sky-400",     dot: "bg-sky-500",     numBg: "bg-sky-500/15 border-sky-500/40",     chipBg: "bg-sky-500/10 border-sky-500/20 text-sky-400"     },
  { name: "orange",  border: "border-orange-500/35",  bg: "bg-orange-500/10",  headerBg: "bg-gradient-to-br from-orange-500/20 to-orange-500/5",  text: "text-orange-400",  dot: "bg-orange-500",  numBg: "bg-orange-500/15 border-orange-500/40",  chipBg: "bg-orange-500/10 border-orange-500/20 text-orange-400"  },
];

function getPhaseColor(color?: string) {
  return PHASE_COLORS.find((c) => c.name === color) ?? PHASE_COLORS[0];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entityToPlan(e: { id: string; properties: Record<string, unknown>; createdAt: string | null }): ActionPlan {
  const p = e.properties ?? {};
  return {
    id: e.id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    goal: String(p.goal ?? ""),
    type: (p.type as ActionPlan["type"]) ?? "action",
    status: (p.status as ActionPlan["status"]) ?? "active",
    dueDate: p.dueDate ? String(p.dueDate) : null,
    schedule: p.schedule ? String(p.schedule) : undefined,
    phases: p.phases ? String(p.phases) : undefined,
    userId: String(p.userId ?? ""),
    createdAt: e.createdAt ?? new Date().toISOString(),
    aiGenerated: Boolean(p.aiGenerated ?? false),
  };
}

function entityToTask(e: { id: string; properties: Record<string, unknown>; createdAt: string | null }): PlanningTask {
  const p = e.properties ?? {};
  return {
    id: e.id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    status: (p.status as PlanningTask["status"]) ?? "todo",
    priority: (p.priority as PlanningTask["priority"]) ?? "medium",
    dueDate: p.dueDate ? String(p.dueDate) : null,
    dueTime: p.dueTime ? String(p.dueTime) : null,
    category: (p.category as PlanningTask["category"]) ?? "task",
    contentType: p.contentType ? (p.contentType as PlanningTask["contentType"]) : undefined,
    contentRef: p.contentRef ? String(p.contentRef) : undefined,
    phaseIndex: p.phaseIndex != null ? Number(p.phaseIndex) : undefined,
    subPhaseId: p.subPhaseId ? String(p.subPhaseId) : undefined,
    planId: p.planId ? String(p.planId) : undefined,
    lessonRef: p.lessonRef ? String(p.lessonRef) : undefined,
    googleEventId: p.googleEventId ? String(p.googleEventId) : undefined,
    userId: String(p.userId ?? ""),
    createdAt: e.createdAt ?? new Date().toISOString(),
  };
}

// ─── Content-type metadata ─────────────────────────────────────────────────────

type ContentMeta = { Icon: typeof Circle; color: string; bg: string; label: string };

const CONTENT_TYPE_META: Record<string, ContentMeta> = {
  lesson:    { Icon: BookOpen,    color: "text-blue-400",    bg: "bg-blue-500/10",    label: "Lección" },
  flashcard: { Icon: Brain,       color: "text-amber-400",   bg: "bg-amber-500/10",   label: "Flashcards" },
  reading:   { Icon: FileText,    color: "text-teal-400",    bg: "bg-teal-500/10",    label: "Lectura" },
  quiz:      { Icon: CheckSquare, color: "text-purple-400",  bg: "bg-purple-500/10",  label: "Quiz" },
  video:     { Icon: Play,        color: "text-red-400",     bg: "bg-red-500/10",     label: "Video" },
  practice:  { Icon: Code,        color: "text-emerald-400", bg: "bg-emerald-500/10", label: "Práctica" },
  reminder:  { Icon: Bell,        color: "text-yellow-400",  bg: "bg-yellow-500/10",  label: "Recordatorio" },
  task:      { Icon: Circle,      color: "text-muted-foreground", bg: "bg-muted/30",  label: "Tarea" },
};

function getContentMeta(category: string, contentType?: string): ContentMeta {
  const key = contentType || category;
  return CONTENT_TYPE_META[key] ?? CONTENT_TYPE_META.task;
}

const STATUS_META: Record<PlanStatus, { label: string; Icon: typeof Circle; color: string; dot: string }> = {
  active:    { label: "Activo",     Icon: PlayCircle,   color: "text-emerald-400", dot: "bg-emerald-400" },
  completed: { label: "Completado", Icon: CheckCircle2, color: "text-blue-400",    dot: "bg-blue-400" },
  paused:    { label: "Pausado",    Icon: PauseCircle,  color: "text-muted-foreground", dot: "bg-muted-foreground" },
};

const PRIORITY_COLORS: Record<PlanningTask["priority"], string> = {
  low:    "bg-sky-500/20 text-sky-400",
  medium: "bg-amber-500/20 text-amber-400",
  high:   "bg-red-500/20 text-red-400",
};

const PRIORITY_CYCLE: Record<PlanningTask["priority"], PlanningTask["priority"]> = {
  low: "medium",
  medium: "high",
  high: "low",
};

function formatDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Weekly map helpers ────────────────────────────────────────────────────────

function getISOWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getWeekRange(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(weekStr);
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const weekStart = new Date(jan4);
  weekStart.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "UTC" });
  return `${fmt(weekStart)} – ${fmt(weekEnd)}`;
}

// ─── Content templates ────────────────────────────────────────────────────────

function makeStudyTemplate(goal: string): string {
  const goalText = goal.trim() ? goal.trim() : "Define tu objetivo de aprendizaje principal";
  return JSON.stringify([
    { id: "t1",  type: "callout",       content: `**Objetivo:** ${goalText}`, icon: "🎯" },
    { id: "t2",  type: "heading_2",     content: "📅 Cronograma de Estudio" },
    { id: "t3",  type: "bulleted_list", content: "**Días de estudio:** " },
    { id: "t4",  type: "bulleted_list", content: "**Horas por día:** " },
    { id: "t5",  type: "bulleted_list", content: "**Duración total estimada:** " },
    { id: "t6",  type: "heading_2",     content: "🗺️ Mapa de Aprendizaje" },
    { id: "t7",  type: "heading_3",     content: "Fase 1: Fundamentos" },
    { id: "t8",  type: "bulleted_list", content: "" },
    { id: "t9",  type: "heading_3",     content: "Fase 2: Desarrollo" },
    { id: "t10", type: "bulleted_list", content: "" },
    { id: "t11", type: "heading_3",     content: "Fase 3: Cierre" },
    { id: "t12", type: "bulleted_list", content: "" },
    { id: "t13", type: "heading_2",     content: "📊 Notas de Progreso" },
    { id: "t14", type: "paragraph",     content: "" },
  ]);
}

function makeActionTemplate(goal: string): string {
  const goalText = goal.trim() ? goal.trim() : "Define tu objetivo principal";
  return JSON.stringify([
    { id: "t1", type: "callout",       content: `**Objetivo:** ${goalText}` },
    { id: "t2", type: "heading_2",     content: "Contexto" },
    { id: "t3", type: "paragraph",     content: "" },
    { id: "t4", type: "heading_2",     content: "Criterios de Éxito" },
    { id: "t5", type: "bulleted_list", content: "" },
    { id: "t6", type: "heading_2",     content: "Notas" },
    { id: "t7", type: "paragraph",     content: "" },
  ]);
}

function isEmptyDescription(raw: string): boolean {
  if (!raw || !raw.trim()) return true;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return false;
  } catch { /* not JSON */ }
  return false;
}

// ─── Property row ─────────────────────────────────────────────────────────────

function PropertyRow({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start min-h-[34px] rounded-md hover:bg-muted/20 transition-colors -mx-2 px-2 py-0.5">
      <div className="flex items-center gap-2 w-36 flex-shrink-0 text-xs text-muted-foreground/70 pt-1.5 select-none">
        <span className="flex-shrink-0 opacity-60">{icon}</span>
        <span className="font-medium tracking-wide">{label}</span>
      </div>
      <div className="flex-1 pt-1">{children}</div>
    </div>
  );
}

// ─── Inline editable text ─────────────────────────────────────────────────────

function InlineEdit({
  value,
  onSave,
  className,
  placeholder,
  multiline = false,
}: {
  value: string;
  onSave: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement & HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (editing) {
    const props = {
      ref,
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => setDraft(e.target.value),
      onBlur: commit,
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !multiline) { e.preventDefault(); commit(); }
        if (e.key === "Escape") { setDraft(value); setEditing(false); }
      },
      className: cn("w-full bg-transparent border-b border-primary/40 outline-none resize-none", className),
    };
    return multiline ? <textarea {...props} rows={3} /> : <input {...props} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "cursor-text hover:bg-muted/20 rounded px-1 -mx-1 transition-colors block",
        !value && "text-muted-foreground/40 italic",
        className
      )}
    >
      {value || placeholder}
    </span>
  );
}

// ─── Inline title ─────────────────────────────────────────────────────────────

function InlineTitle({ value, onSave, placeholder }: {
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(value), [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() && draft.trim() !== value) onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { setDraft(value); setEditing(false); }
        }}
        className="w-full bg-transparent outline-none text-4xl font-heading font-bold leading-tight tracking-tight border-b border-primary/40"
      />
    );
  }

  return (
    <h1
      onClick={() => setEditing(true)}
      className={cn(
        "text-4xl font-heading font-bold leading-tight tracking-tight cursor-text hover:bg-muted/20 rounded px-1 -mx-1 transition-colors",
        !value && "text-muted-foreground/40 italic"
      )}
    >
      {value || placeholder}
    </h1>
  );
}

// ─── Task row ─────────────────────────────────────────────────────────────────

interface TaskRowProps {
  task: PlanningTask;
  onToggle: (id: string, status: TaskStatus) => void;
  onUpdate: (id: string, props: Partial<PlanningTask>) => void;
  onDelete: (id: string) => void;
  onPushCalendar: (task: PlanningTask) => Promise<void>;
  pushingId: string | null;
}

function TaskRow({ task, onToggle, onUpdate, onDelete, onPushCalendar, pushingId }: TaskRowProps) {
  const [hovered, setHovered] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const done = task.status === "done";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setEditingDate(false); }}
      className="group flex items-start gap-3 py-2.5 px-2 rounded-lg hover:bg-muted/30 transition-colors"
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/20 mt-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />

      <button
        onClick={() => onToggle(task.id, done ? "todo" : "done")}
        className="flex-shrink-0 mt-0.5 transition-colors"
      >
        {done
          ? <CheckCheck className="w-4 h-4 text-primary" />
          : <Circle className="w-4 h-4 text-muted-foreground/40 hover:text-primary/60" />
        }
      </button>

      {(() => {
        const meta = getContentMeta(task.category, task.contentType);
        return (
          <div className={cn(
            "w-5 h-5 rounded flex items-center justify-center flex-shrink-0",
            done ? "opacity-30" : meta.bg
          )} title={meta.label}>
            <meta.Icon className={cn("w-3 h-3", done ? "text-muted-foreground" : meta.color)} />
          </div>
        );
      })()}

      <div className="flex-1 min-w-0">
        <InlineEdit
          value={task.title}
          onSave={(v) => onUpdate(task.id, { title: v })}
          className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}
          placeholder="Sin título"
        />
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => onUpdate(task.id, { priority: PRIORITY_CYCLE[task.priority] })}
          className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium transition-opacity",
            PRIORITY_COLORS[task.priority],
            !hovered && "opacity-0"
          )}
          title="Cambiar prioridad"
        >
          {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Media" : "Baja"}
        </button>

        {editingDate ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              defaultValue={task.dueDate ?? ""}
              autoFocus
              className="text-[11px] bg-muted/50 border border-border/50 rounded px-1 h-6 w-28"
              onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
              onBlur={() => setEditingDate(false)}
            />
            <input
              type="time"
              defaultValue={task.dueTime ?? ""}
              className="text-[11px] bg-muted/50 border border-border/50 rounded px-1 h-6 w-20"
              onChange={(e) => onUpdate(task.id, { dueTime: e.target.value || null })}
              onBlur={() => setEditingDate(false)}
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className={cn(
              "flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded px-1",
              !task.dueDate && !hovered && "opacity-0"
            )}
          >
            <CalendarDays className="w-3 h-3" />
            {task.dueDate ? (
              <>
                {formatDate(task.dueDate)}
                {task.dueTime && <><Clock className="w-2.5 h-2.5 ml-0.5" />{task.dueTime}</>}
              </>
            ) : "Fecha"}
          </button>
        )}

        {task.dueDate && (
          <button
            onClick={() => onPushCalendar(task)}
            disabled={pushingId === task.id}
            className={cn(
              "text-[11px] px-1.5 py-0.5 rounded border transition-all",
              task.googleEventId
                ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary",
              !hovered && !task.googleEventId && "opacity-0"
            )}
            title={task.googleEventId ? "En Google Calendar" : "Agregar a Google Calendar"}
          >
            {pushingId === task.id
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Calendar className="w-3 h-3" />
            }
          </button>
        )}

        <button
          onClick={() => onDelete(task.id)}
          className={cn(
            "text-muted-foreground/40 hover:text-destructive transition-colors",
            !hovered && "opacity-0"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── New task inline form ─────────────────────────────────────────────────────

function NewTaskRow({
  planId,
  userId,
  onCreated,
  defaultPhaseIndex,
  defaultSubPhaseId,
}: {
  planId: string;
  userId: string;
  onCreated: () => void;
  defaultPhaseIndex?: number;
  defaultSubPhaseId?: string;
}) {
  const [active, setActive] = useState(false);
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const [createEntity, { loading }] = useMutation(CREATE_ENTITY, {
    client: entityClient,
    refetchQueries: [{ query: GET_ENTITIES, variables: { entityType: "PlanningTask", skip: 0, limit: 200 } }],
  });

  const submit = async () => {
    if (!title.trim()) { setActive(false); return; }
    await createEntity({
      variables: {
        input: {
          entityType: "PlanningTask",
          properties: {
            title: title.trim(),
            description: "",
            status: "todo",
            priority: "medium",
            dueDate: dueDate || null,
            dueTime: dueTime || null,
            category: "task",
            planId,
            phaseIndex: defaultPhaseIndex ?? null,
            subPhaseId: defaultSubPhaseId ?? null,
            lessonRef: null,
            googleEventId: null,
            userId,
          },
        },
      },
    });
    setTitle("");
    setDueDate("");
    setDueTime("");
    onCreated();
  };

  if (!active) {
    return (
      <button
        onClick={() => { setActive(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className="flex items-center gap-2 py-2 px-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/30 w-full"
      >
        <Plus className="w-4 h-4" />
        Añadir tarea
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 px-2 rounded-lg bg-muted/20 border border-border/40">
      <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
      <input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") setActive(false);
        }}
        placeholder="Nombre de la tarea…"
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
      />
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="text-[11px] bg-muted/40 border border-border/40 rounded px-1.5 h-6 w-28"
      />
      <input
        type="time"
        value={dueTime}
        onChange={(e) => setDueTime(e.target.value)}
        className="text-[11px] bg-muted/40 border border-border/40 rounded px-1.5 h-6 w-20"
      />
      <Button size="sm" className="h-6 text-xs px-2" disabled={!title.trim() || loading} onClick={submit}>
        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Crear"}
      </Button>
      <button onClick={() => setActive(false)} className="text-muted-foreground hover:text-foreground">
        ×
      </button>
    </div>
  );
}

// ─── Phases view ──────────────────────────────────────────────────────────────

interface PhasesViewProps {
  phases: StudyPhase[];
  tasks: PlanningTask[];
  taskFilter: "all" | "todo" | "done";
  planId: string;
  userId: string;
  onToggle: (id: string, status: TaskStatus) => void;
  onUpdate: (id: string, props: Partial<PlanningTask>) => void;
  onDelete: (id: string) => void;
  onPushCalendar: (task: PlanningTask) => Promise<void>;
  pushingId: string | null;
  onUpdatePhase: (phaseId: string, updates: Partial<StudyPhase>) => void;
  onAddPhase: () => void;
  onDeletePhase: (phaseId: string) => void;
  onAddSubPhase: (phaseId: string) => void;
  onUpdateSubPhase: (phaseId: string, subPhaseId: string, updates: Partial<StudySubPhase>) => void;
  onDeleteSubPhase: (phaseId: string, subPhaseId: string) => void;
  onTaskCreated: () => void;
}

function PhasesView({
  phases, tasks, taskFilter, planId, userId,
  onToggle, onUpdate, onDelete, onPushCalendar, pushingId,
  onUpdatePhase, onAddPhase, onDeletePhase,
  onAddSubPhase, onUpdateSubPhase, onDeleteSubPhase,
  onTaskCreated,
}: PhasesViewProps) {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    () => new Set(phases.slice(0, 6).map((p) => p.id))
  );
  const [expandedSubPhases, setExpandedSubPhases] = useState<Set<string>>(
    () => new Set()
  );

  const togglePhase = (id: string) =>
    setExpandedPhases((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const toggleSubPhase = (id: string) =>
    setExpandedSubPhases((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const filterTasks = (ts: PlanningTask[]) => {
    if (taskFilter === "done") return ts.filter((t) => t.status === "done");
    if (taskFilter === "todo") return ts.filter((t) => t.status !== "done");
    return ts;
  };

  return (
    <div className="relative">
      {/* Vertical timeline line */}
      {phases.length > 1 && (
        <div className="absolute left-[19px] top-10 bottom-20 w-px bg-gradient-to-b from-border/60 via-border/30 to-transparent pointer-events-none" />
      )}

      <div className="space-y-5">
        {phases.map((phase, phaseIdx) => {
          const pc = getPhaseColor(phase.color);
          const phaseTasks = tasks.filter((t) => t.phaseIndex === phaseIdx);
          const phaseDone = phaseTasks.filter((t) => t.status === "done").length;
          const phaseProgress = phaseTasks.length === 0 ? 0 : Math.round((phaseDone / phaseTasks.length) * 100);
          const isExpanded = expandedPhases.has(phase.id);
          const subPhases = phase.subPhases ?? [];
          const assignedSubPhaseIds = new Set(subPhases.map((sp) => sp.id));
          const unassignedTasks = phaseTasks.filter((t) => !t.subPhaseId || !assignedSubPhaseIds.has(t.subPhaseId));
          const isComplete = phaseTasks.length > 0 && phaseDone === phaseTasks.length;

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: phaseIdx * 0.06 }}
              className="relative flex gap-4"
            >
              {/* Phase number node */}
              <div className="flex-shrink-0 flex flex-col items-center gap-0 z-10">
                <div className={cn(
                  "w-10 h-10 rounded-2xl border-2 flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all duration-300",
                  pc.numBg, pc.text,
                  isComplete && "opacity-60"
                )}>
                  {isComplete
                    ? <CheckCircle2 className="w-5 h-5" />
                    : <span className="font-mono">{String(phaseIdx + 1).padStart(2, "0")}</span>
                  }
                </div>
              </div>

              {/* Phase card */}
              <div className={cn(
                "flex-1 rounded-2xl border overflow-hidden transition-all duration-200",
                pc.border,
                isComplete ? "opacity-70" : "shadow-sm"
              )}>
                {/* Phase header */}
                <div className={cn("px-4 pt-4 pb-3", pc.headerBg, "group/phase")}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <div onClick={(e) => e.stopPropagation()}>
                          <InlineEdit
                            value={phase.title}
                            onSave={(v) => onUpdatePhase(phase.id, { title: v })}
                            className={cn("font-bold text-base leading-tight", pc.text)}
                            placeholder="Nombre de la fase"
                          />
                        </div>
                        {phase.durationWeeks > 0 && (
                          <span className="text-[11px] text-muted-foreground/60 bg-background/50 px-2 py-0.5 rounded-full border border-border/30 flex-shrink-0">
                            {phase.durationWeeks} {phase.durationWeeks === 1 ? "semana" : "semanas"}
                          </span>
                        )}
                      </div>

                      {/* Progress */}
                      {phaseTasks.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-1.5 rounded-full bg-black/15 dark:bg-white/10 overflow-hidden">
                            <motion.div
                              className={cn("h-full rounded-full", pc.dot)}
                              initial={{ width: 0 }}
                              animate={{ width: `${phaseProgress}%` }}
                              transition={{ duration: 0.7, ease: "easeOut", delay: phaseIdx * 0.06 + 0.2 }}
                            />
                          </div>
                          <span className={cn("text-[11px] font-semibold tabular-nums flex-shrink-0", pc.text)}>
                            {phaseDone}/{phaseTasks.length}
                          </span>
                        </div>
                      )}

                      {/* Topics chips */}
                      {phase.topics && phase.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {phase.topics.map((topic, ti) => (
                            <span
                              key={ti}
                              className={cn(
                                "text-[11px] px-2 py-0.5 rounded-full border font-medium",
                                pc.chipBg
                              )}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Color picker */}
                      <div className="flex gap-1 opacity-0 group-hover/phase:opacity-100 transition-opacity">
                        {PHASE_COLORS.map((c) => (
                          <button
                            key={c.name}
                            onClick={() => onUpdatePhase(phase.id, { color: c.name })}
                            className={cn(
                              "w-2.5 h-2.5 rounded-full transition-transform hover:scale-125 flex-shrink-0",
                              c.dot,
                              phase.color === c.name && "ring-1 ring-white/70 ring-offset-1 ring-offset-transparent"
                            )}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => onDeletePhase(phase.id)}
                        className="opacity-0 group-hover/phase:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive p-1 rounded ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => togglePhase(phase.id)}
                        className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1 rounded ml-0.5"
                      >
                        <ChevronDown className={cn(
                          "w-4 h-4 transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Phase body */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pt-2 pb-3 space-y-2 border-t border-border/20 bg-card/30">
                        {/* Sub-phases */}
                        {subPhases.map((subPhase) => {
                          const spTasks = filterTasks(phaseTasks.filter((t) => t.subPhaseId === subPhase.id));
                          const isSpExpanded = expandedSubPhases.has(subPhase.id);
                          const spDone = spTasks.filter((t) => t.status === "done").length;

                          return (
                            <div key={subPhase.id} className="rounded-xl border border-border/25 bg-muted/10 overflow-hidden">
                              <div
                                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors group/sp"
                                onClick={() => toggleSubPhase(subPhase.id)}
                              >
                                <ChevronRight className={cn(
                                  "w-3 h-3 text-muted-foreground/50 transition-transform flex-shrink-0",
                                  isSpExpanded && "rotate-90"
                                )} />
                                <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                  <InlineEdit
                                    value={subPhase.title}
                                    onSave={(v) => onUpdateSubPhase(phase.id, subPhase.id, { title: v })}
                                    className="text-xs font-semibold text-foreground/70"
                                    placeholder="Sub-fase"
                                  />
                                </div>
                                <span className="text-[10px] text-muted-foreground/40 flex-shrink-0 tabular-nums">
                                  {spDone}/{spTasks.length}
                                </span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); onDeleteSubPhase(phase.id, subPhase.id); }}
                                  className="opacity-0 group-hover/sp:opacity-100 transition-opacity text-muted-foreground/30 hover:text-destructive flex-shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              {isSpExpanded && (
                                <div className="px-2 pb-2 space-y-0.5 border-t border-border/20 pt-1">
                                  <AnimatePresence>
                                    {spTasks.map((task) => (
                                      <TaskRow key={task.id} task={task} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onPushCalendar={onPushCalendar} pushingId={pushingId} />
                                    ))}
                                  </AnimatePresence>
                                  <NewTaskRow planId={planId} userId={userId} defaultPhaseIndex={phaseIdx} defaultSubPhaseId={subPhase.id} onCreated={onTaskCreated} />
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* Unassigned tasks */}
                        {(subPhases.length === 0 || unassignedTasks.length > 0) && (
                          <div className="space-y-0.5">
                            {subPhases.length > 0 && unassignedTasks.length > 0 && (
                              <p className="text-[10px] text-muted-foreground/40 px-1 pb-0.5 uppercase tracking-wide">Sin sub-fase</p>
                            )}
                            <AnimatePresence>
                              {filterTasks(unassignedTasks).map((task) => (
                                <TaskRow key={task.id} task={task} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onPushCalendar={onPushCalendar} pushingId={pushingId} />
                              ))}
                            </AnimatePresence>
                            {subPhases.length === 0 && (
                              <NewTaskRow planId={planId} userId={userId} defaultPhaseIndex={phaseIdx} onCreated={onTaskCreated} />
                            )}
                          </div>
                        )}

                        {/* Add sub-phase */}
                        <button
                          onClick={() => onAddSubPhase(phase.id)}
                          className="flex items-center gap-1.5 text-[11px] text-muted-foreground/40 hover:text-muted-foreground transition-colors py-1 px-2 rounded-lg hover:bg-muted/20 w-full"
                        >
                          <Plus className="w-3 h-3" />
                          Añadir sub-fase
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}

        {/* Unphased tasks */}
        {(() => {
          const unphasedTasks = filterTasks(tasks.filter((t) => t.phaseIndex == null));
          if (unphasedTasks.length === 0 && phases.length > 0) return null;
          return (
            <div className={cn("space-y-0.5", phases.length > 0 && "pl-14")}>
              {phases.length > 0 && (
                <p className="text-xs text-muted-foreground/40 px-1 mb-1 uppercase tracking-wide">Sin fase</p>
              )}
              <AnimatePresence>
                {unphasedTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={onToggle} onUpdate={onUpdate} onDelete={onDelete} onPushCalendar={onPushCalendar} pushingId={pushingId} />
                ))}
              </AnimatePresence>
            </div>
          );
        })()}

        {/* Add phase */}
        <button
          onClick={onAddPhase}
          className={cn(
            "w-full flex items-center justify-center gap-2 text-sm text-muted-foreground",
            "hover:text-foreground transition-all duration-200 py-3.5 px-4 rounded-2xl",
            "border-2 border-dashed border-border/40 hover:border-primary/40 hover:bg-primary/5",
            phases.length > 0 && "ml-14 w-[calc(100%-3.5rem)]"
          )}
        >
          <Plus className="w-4 h-4" />
          Añadir fase
        </button>
      </div>
    </div>
  );
}

// ─── Weekly map view ──────────────────────────────────────────────────────────

function WeeklyMapView({
  tasks,
  taskFilter,
  onToggle,
  onUpdate,
  onDelete,
  onPushCalendar,
  pushingId,
}: {
  tasks: PlanningTask[];
  taskFilter: "all" | "todo" | "done";
  onToggle: (id: string, status: TaskStatus) => void;
  onUpdate: (id: string, props: Partial<PlanningTask>) => void;
  onDelete: (id: string) => void;
  onPushCalendar: (task: PlanningTask) => Promise<void>;
  pushingId: string | null;
}) {
  const filtered = useMemo(() => {
    if (taskFilter === "done") return tasks.filter((t) => t.status === "done");
    if (taskFilter === "todo") return tasks.filter((t) => t.status !== "done");
    return tasks;
  }, [tasks, taskFilter]);

  const { weeks, unscheduled } = useMemo(() => {
    const weekMap = new Map<string, PlanningTask[]>();
    const unscheduled: PlanningTask[] = [];

    for (const task of filtered) {
      if (!task.dueDate) {
        unscheduled.push(task);
        continue;
      }
      const key = getISOWeekKey(task.dueDate);
      if (!weekMap.has(key)) weekMap.set(key, []);
      weekMap.get(key)!.push(task);
    }

    const sortedKeys = Array.from(weekMap.keys()).sort();
    return { weeks: sortedKeys.map((k) => ({ key: k, tasks: weekMap.get(k)! })), unscheduled };
  }, [filtered]);

  const today = new Date().toISOString().slice(0, 10);
  const currentWeekKey = getISOWeekKey(today);

  if (weeks.length === 0 && unscheduled.length === 0) {
    return (
      <p className="text-sm text-muted-foreground/40 text-center py-8 italic">
        Sin tareas para mostrar
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {weeks.map(({ key, tasks: weekTasks }) => {
        const isCurrent = key === currentWeekKey;
        const [, weekNum] = key.split("-W");
        const range = getWeekRange(key);

        return (
          <div key={key} className={cn(
            "rounded-xl border overflow-hidden",
            isCurrent ? "border-primary/30 bg-primary/5" : "border-border/40"
          )}>
            <div className={cn(
              "px-4 py-2.5 flex items-center justify-between",
              isCurrent ? "bg-primary/10" : "bg-muted/20"
            )}>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  isCurrent ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                )}>
                  Sem. {weekNum}
                </span>
                <span className="text-xs text-muted-foreground">{range}</span>
                {isCurrent && (
                  <span className="text-[10px] text-primary font-medium">Esta semana</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground/60">
                {weekTasks.filter((t) => t.status === "done").length}/{weekTasks.length}
              </span>
            </div>
            <div className="px-2 py-1 space-y-0.5">
              <AnimatePresence>
                {weekTasks
                  .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
                  .map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={onToggle}
                      onUpdate={onUpdate}
                      onDelete={onDelete}
                      onPushCalendar={onPushCalendar}
                      pushingId={pushingId}
                    />
                  ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}

      {unscheduled.length > 0 && (
        <div className="rounded-xl border border-border/40 border-dashed">
          <div className="px-4 py-2 bg-muted/10 flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60 font-medium">Sin fecha programada</span>
            <span className="text-xs text-muted-foreground/40">{unscheduled.length}</span>
          </div>
          <div className="px-2 py-1 space-y-0.5">
            {unscheduled.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onPushCalendar={onPushCalendar}
                pushingId={pushingId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Plan page ────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: authSession } = useSession();
  const userId = (authSession?.user as { id?: string })?.id ?? "";

  const [pushingId, setPushingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskFilter, setTaskFilter] = useState<"all" | "todo" | "done">("all");
  const [editingDueDate, setEditingDueDate] = useState(false);
  const [viewMode, setViewMode] = useState<"fases" | "semanas" | "lista">("fases");
  const [localPhases, setLocalPhases] = useState<StudyPhase[]>([]);
  const [phasesLoaded, setPhasesLoaded] = useState(false);
  const templateInitialized = useRef(false);
  const savePhaseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: planData, loading: planLoading } = useQuery(GET_ENTITY, {
    client: entityClient,
    variables: { id },
    fetchPolicy: "cache-and-network",
  });

  const { data: tasksData, loading: tasksLoading, refetch: refetchTasks } = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: "PlanningTask", skip: 0, limit: 200 },
    fetchPolicy: "cache-and-network",
  });

  const [updateEntity] = useMutation(UPDATE_ENTITY, { client: entityClient });
  const [deleteEntity] = useMutation(DELETE_ENTITY, { client: entityClient });

  const plan: ActionPlan | null = useMemo(() => {
    if (!planData?.entity) return null;
    return entityToPlan(planData.entity);
  }, [planData]);

  const parsedSchedule = useMemo((): StudySchedule | null => {
    if (!plan?.schedule) return null;
    try { return JSON.parse(plan.schedule); } catch { return null; }
  }, [plan?.schedule]);

  const parsedPhases = useMemo((): StudyPhase[] => {
    if (!plan?.phases) return [];
    try {
      const raw = JSON.parse(plan.phases);
      return (raw as Array<Record<string, unknown>>).map((p, i) => ({
        id: String(p.id ?? `ph-${i}`),
        title: String(p.title ?? ""),
        description: p.description ? String(p.description) : undefined,
        durationWeeks: Number(p.durationWeeks ?? 1),
        topics: Array.isArray(p.topics) ? (p.topics as string[]) : undefined,
        color: p.color ? String(p.color) : PHASE_COLORS[i % PHASE_COLORS.length].name,
        subPhases: Array.isArray(p.subPhases)
          ? (p.subPhases as Array<Record<string, unknown>>).map((sp, j) => ({
              id: String(sp.id ?? `sp-${i}-${j}`),
              title: String(sp.title ?? ""),
              topics: Array.isArray(sp.topics) ? (sp.topics as string[]) : undefined,
            }))
          : [],
      }));
    } catch { return []; }
  }, [plan?.phases]);

  // Load phases into local state once per plan
  useEffect(() => {
    if (!phasesLoaded && plan) {
      setLocalPhases(parsedPhases);
      setPhasesLoaded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id]);

  // Auto-initialize content template for new/empty plans
  useEffect(() => {
    if (!plan || templateInitialized.current) return;
    if (!isEmptyDescription(plan.description)) { templateInitialized.current = true; return; }

    templateInitialized.current = true;
    const template = plan.type === "study"
      ? makeStudyTemplate(plan.goal)
      : makeActionTemplate(plan.goal);

    const current: Record<string, unknown> = {
      title: plan.title, description: plan.description, goal: plan.goal,
      type: plan.type, status: plan.status, dueDate: plan.dueDate,
      userId: plan.userId, aiGenerated: plan.aiGenerated ?? false,
    };
    updateEntity({ variables: { id, input: { properties: { ...current, description: template } } } });
  }, [plan, id, updateEntity]);

  const planTasks: PlanningTask[] = useMemo(() => {
    const items = tasksData?.entities?.items ?? [];
    return (items as Array<{ id: string; properties: Record<string, unknown>; createdAt: string | null }>)
      .map(entityToTask)
      .filter((t: PlanningTask) => t.planId === id)
      .sort((a: PlanningTask, b: PlanningTask) => {
        if (a.status === "done" && b.status !== "done") return 1;
        if (a.status !== "done" && b.status === "done") return -1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  }, [tasksData, id]);

  const filteredTasks = useMemo(() => {
    if (taskFilter === "all") return planTasks;
    if (taskFilter === "done") return planTasks.filter((t) => t.status === "done");
    return planTasks.filter((t) => t.status !== "done");
  }, [planTasks, taskFilter]);

  const doneTasks = useMemo(() => planTasks.filter((t) => t.status === "done").length, [planTasks]);
  const progress = planTasks.length === 0 ? 0 : Math.round((doneTasks / planTasks.length) * 100);

  const updatePlanProp = useCallback(async (props: Partial<ActionPlan>) => {
    if (!plan) return;
    const current: Record<string, unknown> = {
      title: plan.title, description: plan.description, goal: plan.goal,
      type: plan.type, status: plan.status, dueDate: plan.dueDate,
      userId: plan.userId, aiGenerated: plan.aiGenerated ?? false,
    };
    await updateEntity({ variables: { id, input: { properties: { ...current, ...props } } } });
  }, [plan, id, updateEntity]);

  const saveContent = useCallback(async (content: string) => {
    await updatePlanProp({ description: content });
  }, [updatePlanProp]);

  const updateTask = useCallback(async (taskId: string, props: Partial<PlanningTask>) => {
    const task = planTasks.find((t) => t.id === taskId);
    if (!task) return;
    const current: Record<string, unknown> = {
      title: task.title, description: task.description, status: task.status,
      priority: task.priority, dueDate: task.dueDate, dueTime: task.dueTime,
      category: task.category, contentType: task.contentType, contentRef: task.contentRef,
      phaseIndex: task.phaseIndex, subPhaseId: task.subPhaseId ?? null,
      planId: task.planId, lessonRef: task.lessonRef,
      googleEventId: task.googleEventId, userId: task.userId,
    };
    await updateEntity({ variables: { id: taskId, input: { properties: { ...current, ...props } } } });
  }, [planTasks, updateEntity]);

  const toggleTask = useCallback((taskId: string, status: TaskStatus) => {
    updateTask(taskId, { status });
  }, [updateTask]);

  const deleteTask = useCallback(async (taskId: string) => {
    await deleteEntity({ variables: { id: taskId } });
    refetchTasks();
  }, [deleteEntity, refetchTasks]);

  const deletePlan = useCallback(async () => {
    await deleteEntity({ variables: { id } });
    router.push("/plans");
  }, [deleteEntity, id, router]);

  const pushToCalendar = useCallback(async (task: PlanningTask) => {
    if (!task.dueDate || task.googleEventId) return;
    setPushingId(task.id);
    try {
      const start = task.dueTime ? `${task.dueDate}T${task.dueTime}:00` : task.dueDate;
      const end = task.dueTime
        ? `${task.dueDate}T${task.dueTime.split(":")[0]}:${String(parseInt(task.dueTime.split(":")[1]) + 30).padStart(2, "0")}:00`
        : task.dueDate;
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: task.title,
          description: task.description || undefined,
          start, end, allDay: !task.dueTime,
        }),
      });
      const data = await res.json();
      if (data.event?.id) {
        await updateTask(task.id, { googleEventId: data.event.id });
      }
    } catch {/* silent */} finally {
      setPushingId(null);
    }
  }, [updateTask]);

  // ─── Phase CRUD ───────────────────────────────────────────────────────────────

  const savePhases = useCallback((phases: StudyPhase[]) => {
    if (savePhaseTimerRef.current) clearTimeout(savePhaseTimerRef.current);
    savePhaseTimerRef.current = setTimeout(() => {
      updatePlanProp({ phases: JSON.stringify(phases) });
    }, 700);
  }, [updatePlanProp]);

  const addPhase = useCallback(() => {
    setLocalPhases((prev) => {
      const next: StudyPhase[] = [
        ...prev,
        {
          id: `ph-${Date.now()}`,
          title: "Nueva fase",
          durationWeeks: 1,
          color: PHASE_COLORS[prev.length % PHASE_COLORS.length].name,
          subPhases: [],
        },
      ];
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  const updatePhase = useCallback((phaseId: string, updates: Partial<StudyPhase>) => {
    setLocalPhases((prev) => {
      const next = prev.map((p) => p.id === phaseId ? { ...p, ...updates } : p);
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  const deletePhase = useCallback((phaseId: string) => {
    setLocalPhases((prev) => {
      const next = prev.filter((p) => p.id !== phaseId);
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  const addSubPhase = useCallback((phaseId: string) => {
    setLocalPhases((prev) => {
      const next = prev.map((p) => p.id === phaseId ? {
        ...p,
        subPhases: [
          ...(p.subPhases ?? []),
          { id: `sp-${Date.now()}`, title: "Nueva sub-fase", topics: [] },
        ],
      } : p);
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  const updateSubPhase = useCallback((phaseId: string, subPhaseId: string, updates: Partial<StudySubPhase>) => {
    setLocalPhases((prev) => {
      const next = prev.map((p) => p.id === phaseId ? {
        ...p,
        subPhases: (p.subPhases ?? []).map((sp) => sp.id === subPhaseId ? { ...sp, ...updates } : sp),
      } : p);
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  const deleteSubPhase = useCallback((phaseId: string, subPhaseId: string) => {
    setLocalPhases((prev) => {
      const next = prev.map((p) => p.id === phaseId ? {
        ...p,
        subPhases: (p.subPhases ?? []).filter((sp) => sp.id !== subPhaseId),
      } : p);
      savePhases(next);
      return next;
    });
  }, [savePhases]);

  // ─── Loading / not found ──────────────────────────────────────────────────────

  if (planLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Plan no encontrado.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/plans")}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver a Planes
        </Button>
      </div>
    );
  }

  const { label: statusLabel, dot: statusDot } = STATUS_META[plan.status];
  const TypeIcon = plan.type === "study" ? BookOpen : Zap;
  const typeLabel = plan.type === "study" ? "Estudio" : "Acción";
  const typeColor = plan.type === "study" ? "text-blue-400 bg-blue-500/10" : "text-amber-400 bg-amber-500/10";

  return (
    <div className="max-w-3xl mx-auto pb-20">
      {/* Back */}
      <button
        onClick={() => router.push("/plans")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Planes
      </button>

      {/* Title */}
      <div className="mb-6 space-y-2">
        <div className={cn(
          "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3",
          plan.type === "study" ? "bg-blue-500/10" : "bg-amber-500/10"
        )}>
          <TypeIcon className={cn("w-6 h-6", plan.type === "study" ? "text-blue-400" : "text-amber-400")} />
        </div>
        <InlineTitle
          value={plan.title}
          onSave={(v) => updatePlanProp({ title: v })}
          placeholder="Sin título"
        />
      </div>

      {/* Properties */}
      <div className="rounded-xl border border-border/40 bg-card/30 p-4 mb-8 space-y-0.5">
        <PropertyRow icon={<Circle className="w-3.5 h-3.5" />} label="Estado">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 text-sm px-2 py-0.5 rounded hover:bg-muted/40 transition-colors">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot)} />
                <span>{statusLabel}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {(Object.entries(STATUS_META) as [PlanStatus, typeof STATUS_META[PlanStatus]][]).map(([key, meta]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => updatePlanProp({ status: key })}
                  className="flex items-center gap-2"
                >
                  <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
                  {meta.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </PropertyRow>

        <PropertyRow icon={<Tag className="w-3.5 h-3.5" />} label="Tipo">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center gap-1.5 text-sm px-2 py-0.5 rounded transition-colors hover:opacity-80",
                typeColor
              )}>
                <TypeIcon className="w-3.5 h-3.5" />
                <span>{typeLabel}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-36">
              <DropdownMenuItem
                onClick={() => updatePlanProp({ type: "study" })}
                className="flex items-center gap-2 text-blue-400"
              >
                <BookOpen className="w-3.5 h-3.5" /> Estudio
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => updatePlanProp({ type: "action" })}
                className="flex items-center gap-2 text-amber-400"
              >
                <Zap className="w-3.5 h-3.5" /> Acción
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PropertyRow>

        <PropertyRow icon={<Target className="w-3.5 h-3.5" />} label="Objetivo">
          <InlineEdit
            value={plan.goal}
            onSave={(v) => updatePlanProp({ goal: v })}
            className="text-sm leading-relaxed"
            placeholder="Define el objetivo principal…"
          />
        </PropertyRow>

        <PropertyRow icon={<CalendarDays className="w-3.5 h-3.5" />} label="Fecha límite">
          {editingDueDate ? (
            <input
              type="date"
              defaultValue={plan.dueDate ?? ""}
              autoFocus
              className="text-sm bg-muted/40 border border-border/50 rounded px-2 h-7 w-36 outline-none"
              onChange={(e) => updatePlanProp({ dueDate: e.target.value || null })}
              onBlur={() => setEditingDueDate(false)}
            />
          ) : (
            <button
              onClick={() => setEditingDueDate(true)}
              className="text-sm px-2 py-0.5 rounded hover:bg-muted/40 transition-colors text-left"
            >
              {plan.dueDate
                ? <span>{formatDate(plan.dueDate)}</span>
                : <span className="text-muted-foreground/40 italic text-sm">Sin fecha</span>
              }
            </button>
          )}
        </PropertyRow>

        {parsedSchedule && (
          <PropertyRow icon={<AlarmClock className="w-3.5 h-3.5" />} label="Horario">
            <span className="text-sm text-muted-foreground px-2 py-0.5 block">
              {parsedSchedule.preferredDays?.join(", ") || `${parsedSchedule.daysPerWeek} días/sem`}
              {" · "}
              {parsedSchedule.hoursPerDay}h/día
              {parsedSchedule.preferredTime && ` · ${parsedSchedule.preferredTime}`}
            </span>
          </PropertyRow>
        )}

        {plan.aiGenerated && (
          <PropertyRow icon={<Sparkles className="w-3.5 h-3.5" />} label="Origen">
            <span className="flex items-center gap-1.5 text-sm text-violet-400 px-2 py-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              Generado con IA
            </span>
          </PropertyRow>
        )}

        <PropertyRow icon={<Hash className="w-3.5 h-3.5" />} label="Creado">
          <span className="text-sm text-muted-foreground/60 px-2 py-0.5 block">
            {new Date(plan.createdAt).toLocaleDateString("es-ES", {
              day: "numeric", month: "long", year: "numeric"
            })}
          </span>
        </PropertyRow>
      </div>

      {/* Block editor */}
      <div className="mb-10">
        <BlockEditor
          nodeId={plan.id}
          content={plan.description}
          onSave={saveContent}
        />
      </div>

      {/* Progress */}
      {planTasks.length > 0 && (
        <div className="mb-8 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneTasks} de {planTasks.length} tareas completadas</span>
            <span className={cn("font-medium tabular-nums", progress === 100 && "text-emerald-400")}>
              {progress}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      )}

      {/* Tasks section */}
      <div className="space-y-3">
        {/* Header with view toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
            Tareas
          </h2>
          <div className="flex items-center gap-2">
            {/* View mode */}
            <div className="flex rounded-lg border border-border/40 overflow-hidden">
              {([
                { mode: "fases" as const,   Icon: Layers,       label: "Fases" },
                { mode: "semanas" as const, Icon: CalendarRange, label: "Semanas" },
                { mode: "lista" as const,   Icon: LayoutList,    label: "Lista" },
              ]).map(({ mode, Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 text-xs transition-colors",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Filter */}
            <div className="flex gap-1">
              {(["all", "todo", "done"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-full text-xs transition-all",
                    taskFilter === f
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? "Todas" : f === "todo" ? "Pendientes" : "Hechas"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tasksLoading && planTasks.length === 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Views */}
        {viewMode === "fases" && (
          <PhasesView
            phases={localPhases}
            tasks={planTasks}
            taskFilter={taskFilter}
            planId={id}
            userId={userId}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onPushCalendar={pushToCalendar}
            pushingId={pushingId}
            onUpdatePhase={updatePhase}
            onAddPhase={addPhase}
            onDeletePhase={deletePhase}
            onAddSubPhase={addSubPhase}
            onUpdateSubPhase={updateSubPhase}
            onDeleteSubPhase={deleteSubPhase}
            onTaskCreated={() => refetchTasks()}
          />
        )}

        {viewMode === "semanas" && (
          <WeeklyMapView
            tasks={planTasks}
            taskFilter={taskFilter}
            onToggle={toggleTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
            onPushCalendar={pushToCalendar}
            pushingId={pushingId}
          />
        )}

        {viewMode === "lista" && (
          <>
            <div className="space-y-0.5">
              <AnimatePresence>
                {filteredTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onUpdate={updateTask}
                    onDelete={deleteTask}
                    onPushCalendar={pushToCalendar}
                    pushingId={pushingId}
                  />
                ))}
              </AnimatePresence>
            </div>
            {filteredTasks.length === 0 && !tasksLoading && (
              <p className="text-sm text-muted-foreground/40 text-center py-8 italic">
                {taskFilter === "done" ? "Ninguna tarea completada aún" : "Sin tareas pendientes"}
              </p>
            )}
            <div className="mt-2">
              <NewTaskRow planId={id} userId={userId} onCreated={() => refetchTasks()} />
            </div>
          </>
        )}
      </div>

      {/* Delete */}
      <div className="mt-12 pt-6 border-t border-border/20 flex justify-end">
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground/40 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar plan
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">¿Eliminar este plan permanentemente?</span>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={deletePlan}>
              Eliminar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

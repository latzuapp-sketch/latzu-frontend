"use client";

import { useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskActivity, useTaskComments, useTaskRelationships } from "@/hooks/usePlanning";
import type {
  ActivityEvent,
  CreateTaskInput,
  EntityRelationship,
  PlanningTask,
  TaskComment,
  TaskPriority,
  TaskStatus,
} from "@/types/planning";
import {
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  Clock,
  GitBranch,
  Link2,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Style maps ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<TaskStatus, { label: string; classes: string; Icon: typeof Circle }> = {
  todo:        { label: "Por hacer",   classes: "bg-muted/60 text-muted-foreground border border-border/60",         Icon: Circle       },
  in_progress: { label: "En progreso", classes: "bg-amber-500/15 text-amber-400 border border-amber-500/30",         Icon: Clock        },
  done:        { label: "Hecho",       classes: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",   Icon: CheckCircle2 },
};

const PRIORITY_STYLES: Record<TaskPriority, { label: string; dot: string; classes: string }> = {
  high:   { label: "Alta",  dot: "bg-red-500",   classes: "text-red-400 border-red-500/30 bg-red-500/10"     },
  medium: { label: "Media", dot: "bg-amber-400", classes: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  low:    { label: "Baja",  dot: "bg-sky-400",   classes: "text-sky-400 border-sky-500/30 bg-sky-500/10"     },
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function SubtaskRow({
  task,
  onToggle,
}: {
  task: PlanningTask;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 hover:bg-muted/30 transition-colors group">
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 rounded border transition-all flex items-center justify-center",
          task.status === "done"
            ? "bg-emerald-500 border-emerald-500 text-white"
            : "border-border/60 hover:border-primary/50"
        )}
        style={{ width: 16, height: 16 }}
      >
        {task.status === "done" && <Check className="w-2.5 h-2.5" />}
      </button>
      <span className={cn("text-sm flex-1 leading-snug", task.status === "done" && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      {task.issueKey && (
        <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">
          {task.issueKey}
        </span>
      )}
    </div>
  );
}

function CommentItem({ comment }: { comment: TaskComment }) {
  const date = new Date(comment.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <div className="flex gap-3">
      <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
        {comment.authorName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-xs font-semibold">{comment.authorName}</span>
          <span className="text-[10px] text-muted-foreground">{date}</span>
        </div>
        <div className="rounded-xl bg-muted/30 border border-border/30 px-3 py-2">
          <p className="text-sm leading-relaxed">{comment.body}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main modal ─────────────────────────────────────────────────────────────────

interface TaskIssueModalProps {
  task: PlanningTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onCreateTask?: (input: CreateTaskInput) => Promise<void>;
  allTasks?: PlanningTask[];
}

export function TaskIssueModal({
  task,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
  onCreateTask,
  allTasks = [],
}: TaskIssueModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="max-w-5xl w-full h-[88vh] max-h-[900px] p-0 gap-0 overflow-hidden"
      >
        <DialogTitle className="sr-only">{task?.title ?? "Detalle de tarea"}</DialogTitle>
        {task && (
          <IssueContent
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onCreateTask={onCreateTask}
            onClose={() => onOpenChange(false)}
            allTasks={allTasks}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Issue content ──────────────────────────────────────────────────────────────

function IssueContent({
  task,
  onUpdate,
  onDelete,
  onCreateTask,
  onClose,
  allTasks,
}: {
  task: PlanningTask;
  onUpdate: TaskIssueModalProps["onUpdate"];
  onDelete: TaskIssueModalProps["onDelete"];
  onCreateTask?: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
  allTasks: PlanningTask[];
}) {
  const { data: session } = useSession();

  // Text fields — save on blur
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);

  // Atomic fields — auto-save on change
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task.dueTime ?? "");
  const [assigneeName, setAssigneeName] = useState(task.assigneeName ?? "");
  const [estimateMinutes, setEstimateMinutes] = useState(
    task.estimateMinutes ? String(task.estimateMinutes) : ""
  );
  const [spentMinutes, setSpentMinutes] = useState(
    task.spentMinutes ? String(task.spentMinutes) : ""
  );
  const [labels, setLabels] = useState<string[]>(task.labels ?? []);
  const [labelInput, setLabelInput] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const { comments, addComment } = useTaskComments(task.id);
  const { activity: activityEvents, recordActivity } = useTaskActivity(task.id);
  const { relationships } = useTaskRelationships(task.id);

  const subtasks = useMemo(
    () => allTasks.filter((t) => t.parentTaskId === task.id),
    [allTasks, task.id]
  );

  const relatedTasks = useMemo(
    () =>
      relationships.map((rel: EntityRelationship) => {
        const relatedId = rel.fromId === task.id ? rel.toId : rel.fromId;
        return { ...rel, relatedTask: allTasks.find((t) => t.id === relatedId) };
      }),
    [relationships, task.id, allTasks]
  );

  const progressPct = useMemo(() => {
    if (!estimateMinutes || !spentMinutes) return 0;
    return Math.min(100, Math.round((Number(spentMinutes) / Number(estimateMinutes)) * 100));
  }, [estimateMinutes, spentMinutes]);

  const subtasksDone = subtasks.filter((t) => t.status === "done").length;

  const autoSave = (patch: Partial<Omit<PlanningTask, "id" | "createdAt">>) =>
    onUpdate(task.id, patch);

  const handleStatusChange = (next: TaskStatus) => {
    setStatus(next);
    autoSave({ status: next });
    recordActivity({
      taskId: task.id,
      projectId: task.projectId,
      boardId: task.boardId,
      action: "changed_status",
      summary: `Cambió el estado a "${STATUS_STYLES[next].label}"`,
    });
  };

  const handlePriorityChange = (next: TaskPriority) => {
    setPriority(next);
    autoSave({ priority: next });
    recordActivity({
      taskId: task.id,
      projectId: task.projectId,
      boardId: task.boardId,
      action: "changed_priority",
      summary: `Cambió la prioridad a "${PRIORITY_STYLES[next].label}"`,
    });
  };

  const saveTitle = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      autoSave({ title: trimmed });
      recordActivity({ taskId: task.id, action: "updated_title", summary: "Actualizó el título" });
    } else {
      setTitle(task.title);
    }
    setEditingTitle(false);
  };

  const saveDescription = () => {
    const trimmed = description.trim();
    if (trimmed !== (task.description ?? "")) {
      autoSave({ description: trimmed });
      recordActivity({ taskId: task.id, action: "updated_description", summary: "Actualizó la descripción" });
    }
    setEditingDesc(false);
  };

  const addLabel = () => {
    const newLabel = labelInput.trim();
    if (!newLabel || labels.includes(newLabel)) {
      setLabelInput("");
      return;
    }
    const next = [...labels, newLabel];
    setLabels(next);
    autoSave({ labels: next });
    setLabelInput("");
  };

  const removeLabel = (label: string) => {
    const next = labels.filter((l) => l !== label);
    setLabels(next);
    autoSave({ labels: next });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !onCreateTask) return;
    await onCreateTask({
      title: newSubtaskTitle.trim(),
      status: "todo",
      priority: "medium",
      category: "task",
      source: "manual",
      parentTaskId: task.id,
      projectId: task.projectId,
      boardId: task.boardId,
      listId: task.listId,
    });
    setNewSubtaskTitle("");
    setAddingSubtask(false);
  };

  const handleToggleSubtask = (subtask: PlanningTask) => {
    const next: TaskStatus = subtask.status === "done" ? "todo" : "done";
    onUpdate(subtask.id, { status: next });
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    await addComment(comment.trim(), { projectId: task.projectId, boardId: task.boardId });
    await recordActivity({
      taskId: task.id,
      projectId: task.projectId,
      boardId: task.boardId,
      action: "commented_task",
      summary: "Comentó en la tarea",
    });
    setComment("");
  };

  const StatusIcon = STATUS_STYLES[status].Icon;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* ── Top bar ── */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2.5 shrink-0">
        {/* Issue key */}
        {task.issueKey && (
          <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border/40 shrink-0">
            {task.issueKey}
          </span>
        )}

        {/* AI badge */}
        {(task.createdBy === "ai" || task.source === "ai") && (
          <span className="flex items-center gap-1 text-[11px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 shrink-0">
            <Bot className="w-3 h-3" />
            IA
          </span>
        )}

        {/* Status dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all shrink-0",
                STATUS_STYLES[status].classes
              )}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {STATUS_STYLES[status].label}
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(Object.entries(STATUS_STYLES) as [TaskStatus, (typeof STATUS_STYLES)[TaskStatus]][]).map(
              ([val, cfg]) => (
                <DropdownMenuItem key={val} onClick={() => handleStatusChange(val)} className="gap-2">
                  <cfg.Icon className="w-3.5 h-3.5" />
                  {cfg.label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 min-w-0" />

        {/* Priority dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all shrink-0",
                PRIORITY_STYLES[priority].classes
              )}
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_STYLES[priority].dot)} />
              {PRIORITY_STYLES[priority].label}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.entries(PRIORITY_STYLES) as [TaskPriority, (typeof PRIORITY_STYLES)[TaskPriority]][]).map(
              ([val, cfg]) => (
                <DropdownMenuItem key={val} onClick={() => handlePriorityChange(val)} className="gap-2">
                  <span className={cn("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                  {cfg.label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          onClick={onClose}
          className="ml-1 rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── Left: main content ── */}
        <ScrollArea className="flex-1 min-w-0">
          <div className="p-6 space-y-8 max-w-3xl">

            {/* Title */}
            <div>
              {editingTitle ? (
                <Textarea
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveTitle(); }
                    if (e.key === "Escape") { setTitle(task.title); setEditingTitle(false); }
                  }}
                  className="text-2xl font-bold resize-none border-0 shadow-none p-0 focus-visible:ring-0 min-h-0 bg-transparent leading-tight"
                  rows={2}
                />
              ) : (
                <h2
                  onClick={() => setEditingTitle(true)}
                  className="text-2xl font-bold leading-tight cursor-text hover:bg-muted/30 rounded px-1.5 -mx-1.5 py-0.5 transition-colors"
                  title="Clic para editar"
                >
                  {title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </p>
              {editingDesc ? (
                <Textarea
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={saveDescription}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") { setDescription(task.description ?? ""); setEditingDesc(false); }
                  }}
                  className="min-h-[120px] text-sm leading-relaxed"
                  placeholder="Añade una descripción detallada..."
                />
              ) : (
                <div
                  onClick={() => setEditingDesc(true)}
                  className={cn(
                    "min-h-[60px] rounded-xl px-4 py-3 text-sm cursor-text transition-colors border",
                    description
                      ? "border-transparent hover:border-border/40 hover:bg-muted/20 leading-relaxed"
                      : "border-border/30 border-dashed text-muted-foreground hover:border-border/50 hover:bg-muted/20"
                  )}
                >
                  {description || "Haz clic para añadir una descripción..."}
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Subtareas
                  {subtasks.length > 0 && (
                    <span className="text-[10px] font-normal bg-muted/60 px-1.5 py-0.5 rounded-full ml-1">
                      {subtasksDone}/{subtasks.length}
                    </span>
                  )}
                </p>
                {onCreateTask && (
                  <button
                    onClick={() => setAddingSubtask(true)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Añadir subtarea
                  </button>
                )}
              </div>

              {subtasks.length > 0 && (
                <>
                  {subtasks.length > 1 && (
                    <div className="flex items-center gap-2 px-2">
                      <Progress value={(subtasksDone / subtasks.length) * 100} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {Math.round((subtasksDone / subtasks.length) * 100)}%
                      </span>
                    </div>
                  )}
                  <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden divide-y divide-border/20">
                    {subtasks.map((st) => (
                      <SubtaskRow key={st.id} task={st} onToggle={() => handleToggleSubtask(st)} />
                    ))}
                  </div>
                </>
              )}

              {addingSubtask && (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleAddSubtask();
                      if (e.key === "Escape") { setAddingSubtask(false); setNewSubtaskTitle(""); }
                    }}
                    placeholder="Título de la subtarea..."
                    className="flex-1 h-9 text-sm"
                  />
                  <Button
                    size="sm"
                    className="h-9 shrink-0"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                  >
                    Crear
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 shrink-0"
                    onClick={() => { setAddingSubtask(false); setNewSubtaskTitle(""); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}

              {subtasks.length === 0 && !addingSubtask && (
                <p className="text-xs text-muted-foreground/60 px-1">Sin subtareas.</p>
              )}
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Comentarios
                {comments.length > 0 && (
                  <span className="text-[10px] font-normal bg-muted/60 px-1.5 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                )}
              </p>

              {/* Composer */}
              <div className="flex gap-3 items-start">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {session?.user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
                    className="min-h-[72px] text-sm resize-none"
                    onKeyDown={(e) => {
                      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                        e.preventDefault();
                        void submitComment();
                      }
                    }}
                  />
                  {comment.trim() && (
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={submitComment}>
                        Comentar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setComment("")}
                      >
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Comment list */}
              {comments.length > 0 && (
                <div className="space-y-5">
                  {[...comments].reverse().map((c: TaskComment) => (
                    <CommentItem key={c.id} comment={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {/* ── Right sidebar ── */}
        <div className="w-60 shrink-0 border-l border-border/50 bg-card/20 overflow-y-auto">
          <div className="p-4 space-y-5">

            {/* Assignee */}
            <SidebarField label="Responsable">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">
                  {assigneeName ? assigneeName.charAt(0).toUpperCase() : "?"}
                </div>
                <Input
                  value={assigneeName}
                  onChange={(e) => setAssigneeName(e.target.value)}
                  onBlur={() =>
                    assigneeName !== (task.assigneeName ?? "") &&
                    autoSave({ assigneeName: assigneeName.trim() || undefined })
                  }
                  placeholder="Sin asignar"
                  className="h-7 text-xs border-0 shadow-none bg-transparent p-0 focus-visible:ring-0 placeholder:text-muted-foreground/50"
                />
              </div>
            </SidebarField>

            <Separator className="opacity-30" />

            {/* Due date */}
            <SidebarField label="Fecha límite">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  onBlur={() =>
                    dueDate !== (task.dueDate ?? "") && autoSave({ dueDate: dueDate || null })
                  }
                  className="h-7 text-xs flex-1"
                />
              </div>
            </SidebarField>

            {dueDate && (
              <SidebarField label="Hora">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    onBlur={() =>
                      dueTime !== (task.dueTime ?? "") && autoSave({ dueTime: dueTime || null })
                    }
                    className="h-7 text-xs flex-1"
                  />
                </div>
              </SidebarField>
            )}

            <Separator className="opacity-30" />

            {/* Time estimate */}
            <SidebarField label="Tiempo">
              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Estimado (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={estimateMinutes}
                    onChange={(e) => setEstimateMinutes(e.target.value)}
                    onBlur={() =>
                      autoSave({ estimateMinutes: estimateMinutes ? Number(estimateMinutes) : undefined })
                    }
                    placeholder="—"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground">Gastado (min)</label>
                  <Input
                    type="number"
                    min={0}
                    value={spentMinutes}
                    onChange={(e) => setSpentMinutes(e.target.value)}
                    onBlur={() =>
                      autoSave({ spentMinutes: spentMinutes ? Number(spentMinutes) : undefined })
                    }
                    placeholder="—"
                    className="h-7 text-xs"
                  />
                </div>
                {estimateMinutes && (
                  <div className="space-y-1">
                    <Progress value={progressPct} className="h-1.5" />
                    <p className="text-[10px] text-muted-foreground">{progressPct}% completado</p>
                  </div>
                )}
              </div>
            </SidebarField>

            <Separator className="opacity-30" />

            {/* Labels */}
            <SidebarField label="Etiquetas">
              {labels.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] text-primary/80"
                    >
                      {label}
                      <button
                        onClick={() => removeLabel(label)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); addLabel(); }
                    if (e.key === "Escape") setLabelInput("");
                  }}
                  placeholder="Nueva etiqueta..."
                  className="h-7 text-xs flex-1"
                />
                {labelInput && (
                  <Button size="sm" className="h-7 px-2 shrink-0" onClick={addLabel}>
                    <Plus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </SidebarField>

            {/* Related tasks */}
            {relatedTasks.length > 0 && (
              <>
                <Separator className="opacity-30" />
                <SidebarField label="Relaciones">
                  <div className="space-y-1.5">
                    {relatedTasks.map((rel) => (
                      <div
                        key={`${rel.fromId}-${rel.toId}-${rel.relationshipType}`}
                        className="flex items-start gap-1.5 text-xs"
                      >
                        <Link2 className="w-3 h-3 shrink-0 text-muted-foreground mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-muted-foreground text-[10px] block capitalize">
                            {rel.relationshipType.toLowerCase().replace(/_/g, " ")}
                          </span>
                          <span className="font-medium leading-snug truncate block">
                            {rel.relatedTask?.title ?? (rel.fromId === task.id ? rel.toId : rel.fromId)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </SidebarField>
              </>
            )}

            <Separator className="opacity-30" />

            {/* Activity */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actividad reciente
              </p>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <p>
                  Creada{" "}
                  {new Date(task.createdAt).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                {task.updatedAt && (
                  <p>
                    Actualizada{" "}
                    {new Date(task.updatedAt).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}
                {(task.createdBy === "ai" || task.source === "ai") && (
                  <p className="text-violet-400/80">Generada por IA</p>
                )}
                {activityEvents.slice(-8).map((ev: ActivityEvent) => (
                  <p key={ev.id}>{ev.summary}</p>
                ))}
              </div>
            </div>

            <Separator className="opacity-30" />

            {/* Metadata */}
            {task.lastEditedByName && (
              <p className="text-[10px] text-muted-foreground/60">
                Última edición: {task.lastEditedByName}
              </p>
            )}

            {/* Delete */}
            <Button
              variant="destructive"
              size="sm"
              className="w-full gap-2"
              onClick={async () => {
                if (!confirmDel) {
                  setConfirmDel(true);
                  setTimeout(() => setConfirmDel(false), 3000);
                  return;
                }
                await onDelete(task.id);
                onClose();
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {confirmDel ? "¿Confirmar?" : "Eliminar tarea"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

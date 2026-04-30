"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BoardList, CreateTaskInput, TaskPriority } from "@/types/planning";
import { CalendarDays, Clock, GripVertical, Plus, Tag, UserRound, X } from "lucide-react";
import { useState } from "react";

const priorityClasses: Record<TaskPriority, string> = {
  high: "border-red-500/30 bg-red-500/10 text-red-400",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-400",
};

const priorityLabels: Record<TaskPriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

interface TaskBoardComposerProps {
  list: BoardList;
  onSubmit: (input: CreateTaskInput) => Promise<void>;
  onClose: () => void;
}

export function TaskBoardComposer({ list, onSubmit, onClose }: TaskBoardComposerProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [estimateMinutes, setEstimateMinutes] = useState("");
  const [assigneeName, setAssigneeName] = useState("");
  const [labels, setLabels] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const parsedLabels = labels.split(",").map((label) => label.trim()).filter(Boolean);
  const submit = async () => {
    if (!title.trim() || submitting) return;
    setSubmitting(true);
    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      status: list.mapsToTaskStatus,
      source: "manual",
      projectId: list.projectId,
      boardId: list.boardId,
      listId: list.id,
      priority,
      dueDate: dueDate || null,
      assigneeName: assigneeName.trim() || undefined,
      labels: parsedLabels,
      estimateMinutes: estimateMinutes ? Number(estimateMinutes) : undefined,
      category: "task",
    });
    setSubmitting(false);
    onClose();
  };

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        await submit();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
        if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void submit();
      }}
      className="group rounded-xl border border-primary/40 bg-card/95 p-3 text-left shadow-sm ring-1 ring-primary/10"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Textarea
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="¿Qué hay que hacer?"
              className="min-h-8 resize-none border-0 bg-transparent p-0 text-sm font-medium leading-snug shadow-none focus-visible:ring-0"
              rows={1}
            />
          </div>

          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Añade una descripción breve..."
            className="min-h-12 resize-none border-0 bg-muted/25 px-2 py-1.5 text-xs leading-relaxed text-muted-foreground shadow-none focus-visible:ring-1 focus-visible:ring-primary/30"
          />

          <div className="flex flex-wrap items-center gap-1.5">
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value as TaskPriority)}
              className={cn("h-6 rounded-md border px-2 text-[10px] font-medium outline-none", priorityClasses[priority])}
              aria-label="Prioridad"
            >
              <option value="low">{priorityLabels.low}</option>
              <option value="medium">{priorityLabels.medium}</option>
              <option value="high">{priorityLabels.high}</option>
            </select>

            <label className="inline-flex h-6 items-center gap-1 rounded-md border border-border/50 bg-background/70 px-2 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              <Input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
                className="h-5 w-[7.5rem] border-0 bg-transparent p-0 text-[11px] shadow-none focus-visible:ring-0"
                aria-label="Fecha límite"
              />
            </label>

            <label className="inline-flex h-6 items-center gap-1 rounded-md border border-border/50 bg-background/70 px-2 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              <Input
                type="number"
                min={0}
                value={estimateMinutes}
                onChange={(event) => setEstimateMinutes(event.target.value)}
                placeholder="min"
                className="h-5 w-11 border-0 bg-transparent p-0 text-[11px] shadow-none focus-visible:ring-0"
                aria-label="Estimación en minutos"
              />
            </label>

            <label className="inline-flex h-6 items-center gap-1 rounded-md border border-border/50 bg-background/70 px-2 text-[11px] text-muted-foreground">
              <UserRound className="h-3 w-3" />
              <Input
                value={assigneeName}
                onChange={(event) => setAssigneeName(event.target.value)}
                placeholder="Responsable"
                className="h-5 w-20 border-0 bg-transparent p-0 text-[11px] shadow-none focus-visible:ring-0"
                aria-label="Responsable"
              />
            </label>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1 rounded-md border border-border/50 bg-background/70 px-2 py-1 text-[11px] text-muted-foreground">
              <Tag className="h-3 w-3" />
              <Input
                value={labels}
                onChange={(event) => setLabels(event.target.value)}
                placeholder="Etiquetas separadas por coma"
                className="h-5 border-0 bg-transparent p-0 text-[11px] shadow-none focus-visible:ring-0"
                aria-label="Etiquetas"
              />
            </label>
            {parsedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {parsedLabels.slice(0, 4).map((label) => (
                  <Badge key={label} variant="outline" className="gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    <Tag className="h-2.5 w-2.5" />
                    {label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" size="sm" disabled={!title.trim() || submitting} className="h-8 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {submitting ? "Creando..." : "Crear"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-8 gap-1.5">
              <X className="h-3.5 w-3.5" />
              Cancelar
            </Button>
            <span className="ml-auto hidden text-[10px] text-muted-foreground sm:inline">Ctrl/Cmd + Enter</span>
          </div>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { PlanningTask, TaskPriority, TaskStatus } from "@/types/planning";
import { Bot, CalendarDays, CheckCircle2, Clock, GitBranch, ListChecks, Sparkles, Tag } from "lucide-react";

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "Por hacer" },
  { value: "in_progress", label: "En progreso" },
  { value: "done", label: "Hecho" },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

interface TaskDetailDrawerProps {
  task: PlanningTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export function TaskDetailDrawer({ task, open, onOpenChange, onUpdate, onDelete }: TaskDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Detalle de tarea</SheetTitle>
          <SheetDescription>
            Edita el trabajo, los metadatos y el seguimiento de esta tarea.
          </SheetDescription>
        </SheetHeader>

        {task && (
          <TaskDetailContent
            key={task.id}
            task={task}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskDetailContent({
  task,
  onUpdate,
  onDelete,
  onClose,
}: {
  task: PlanningTask;
  onUpdate: TaskDetailDrawerProps["onUpdate"];
  onDelete: TaskDetailDrawerProps["onDelete"];
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task.dueTime ?? "");
  const [labels, setLabels] = useState((task.labels ?? []).join(", "));
  const [assigneeName, setAssigneeName] = useState(task.assigneeName ?? "");
  const [estimateMinutes, setEstimateMinutes] = useState(task.estimateMinutes ? String(task.estimateMinutes) : "");
  const [spentMinutes, setSpentMinutes] = useState(task.spentMinutes ? String(task.spentMinutes) : "");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(task.acceptanceCriteria ?? "");
  const [saving, setSaving] = useState(false);

  const activity = useMemo(() => {
    if (!task) return [];
    return [
      `Creada ${new Date(task.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}`,
      task.updatedAt ? `Actualizada ${new Date(task.updatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}` : null,
      task.createdBy === "ai" || task.source === "ai" ? "Generada por IA" : "Creada manualmente",
    ].filter(Boolean) as string[];
  }, [task]);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await onUpdate(task.id, {
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate || null,
      dueTime: dueTime || null,
      labels: labels.split(",").map((label) => label.trim()).filter(Boolean),
      assigneeName: assigneeName.trim() || undefined,
      estimateMinutes: estimateMinutes ? Number(estimateMinutes) : undefined,
      spentMinutes: spentMinutes ? Number(spentMinutes) : undefined,
      acceptanceCriteria: acceptanceCriteria.trim() || undefined,
    });
    setSaving(false);
  };

  return (
          <div className="space-y-5 px-4 pb-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Título</Label>
              <Input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-description">Descripción</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-28"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Estado</Label>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskStatus)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <select
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskPriority)}
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-date" className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Fecha
                </Label>
                <Input id="task-date" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-time" className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Hora
                </Label>
                <Input id="task-time" type="time" value={dueTime} onChange={(event) => setDueTime(event.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-labels" className="inline-flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                Etiquetas
              </Label>
              <Input id="task-labels" value={labels} onChange={(event) => setLabels(event.target.value)} placeholder="frontend, IA, urgente" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-assignee">Responsable</Label>
                <Input id="task-assignee" value={assigneeName} onChange={(event) => setAssigneeName(event.target.value)} placeholder="Nombre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-estimate">Estimación (min)</Label>
                <Input id="task-estimate" type="number" min={0} value={estimateMinutes} onChange={(event) => setEstimateMinutes(event.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="task-spent">Tiempo usado (min)</Label>
                <Input id="task-spent" type="number" min={0} value={spentMinutes} onChange={(event) => setSpentMinutes(event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="inline-flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" />
                  Subtareas
                </Label>
                <p className="rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  Base lista vía parentTaskId.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-criteria" className="inline-flex items-center gap-1">
                <ListChecks className="h-3.5 w-3.5" />
                Criterios de aceptación
              </Label>
              <Textarea
                id="task-criteria"
                value={acceptanceCriteria}
                onChange={(event) => setAcceptanceCriteria(event.target.value)}
                placeholder="Qué debe cumplirse para considerar esta tarea terminada..."
              />
            </div>

            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-300">
                <Sparkles className="h-4 w-4" />
                Acciones IA
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" size="sm" className="justify-start gap-2" disabled>
                  <Bot className="h-3.5 w-3.5" />
                  Dividir tarea
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2" disabled>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Siguiente paso
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actividad</p>
              <div className="space-y-1">
                {activity.map((item) => (
                  <p key={item} className="text-xs text-muted-foreground">{item}</p>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={save} disabled={saving || !title.trim()} className="flex-1">
                {saving ? "Guardando..." : "Guardar cambios"}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  await onDelete(task.id);
                  onClose();
                }}
              >
                Eliminar
              </Button>
            </div>
          </div>
  );
}

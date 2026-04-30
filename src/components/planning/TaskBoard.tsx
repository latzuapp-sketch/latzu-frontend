"use client";

import { useMemo, useState } from "react";
import { TaskBoardColumn } from "@/components/planning/TaskBoardColumn";
import { TaskDetailDrawer } from "@/components/planning/TaskDetailDrawer";
import type { CreateTaskInput, PlanningTask, TaskStatus } from "@/types/planning";
import { CheckCircle2, Circle, Clock } from "lucide-react";

const columns: Array<{
  status: TaskStatus;
  title: string;
  description: string;
  icon: typeof Circle;
  tone: string;
}> = [
  {
    status: "todo",
    title: "Por hacer",
    description: "Backlog listo para empezar.",
    icon: Circle,
    tone: "bg-muted text-muted-foreground",
  },
  {
    status: "in_progress",
    title: "En progreso",
    description: "Trabajo activo ahora.",
    icon: Clock,
    tone: "bg-amber-500/10 text-amber-400",
  },
  {
    status: "done",
    title: "Hecho",
    description: "Trabajo completado.",
    icon: CheckCircle2,
    tone: "bg-emerald-500/10 text-emerald-400",
  },
];

interface TaskBoardProps {
  tasks: PlanningTask[];
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onUpdateTask: (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => Promise<void> | void;
  onDeleteTask: (id: string) => Promise<void> | void;
}

export function TaskBoard({ tasks, onCreateTask, onUpdateTask, onDeleteTask }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const grouped = useMemo(() => {
    const byStatus = new Map<TaskStatus, PlanningTask[]>();
    for (const column of columns) byStatus.set(column.status, []);
    for (const task of tasks) {
      const list = byStatus.get(task.status) ?? byStatus.get("todo");
      list?.push(task);
    }
    for (const list of byStatus.values()) {
      list.sort((a, b) => {
        const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
        const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
        if (rankA !== rankB) return rankA - rankB;
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
    }
    return byStatus;
  }, [tasks]);

  const dropTask = (taskId: string, status: TaskStatus) => {
    const task = tasks.find((item) => item.id === taskId);
    setDraggedTaskId(null);
    if (!task || task.status === status) return;
    onUpdateTask(taskId, { status, rank: Date.now() });
  };

  return (
    <>
      <div className="flex h-full gap-3 overflow-x-auto p-3 md:p-4">
        {columns.map((column) => (
          <TaskBoardColumn
            key={column.status}
            {...column}
            tasks={grouped.get(column.status) ?? []}
            draggedTaskId={draggedTaskId}
            onCreateTask={onCreateTask}
            onDropTask={dropTask}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            onDragStart={setDraggedTaskId}
          />
        ))}
      </div>

      <TaskDetailDrawer
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
      />
    </>
  );
}

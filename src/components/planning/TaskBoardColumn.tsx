"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { TaskBoardCard } from "@/components/planning/TaskBoardCard";
import { TaskForm } from "@/components/planning/TaskForm";
import { cn } from "@/lib/utils";
import type { BoardList, CreateTaskInput, PlanningTask, TaskStatus } from "@/types/planning";
import { Plus, type LucideIcon } from "lucide-react";
import { useState } from "react";

interface TaskBoardColumnProps {
  list: BoardList;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: string;
  tasks: PlanningTask[];
  draggedTaskId: string | null;
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onDropTask: (taskId: string, list: BoardList) => void;
  onOpenTask: (task: PlanningTask) => void;
  onDragStart: (taskId: string) => void;
}

export function TaskBoardColumn({
  list,
  title,
  description,
  icon: Icon,
  tone,
  tasks,
  draggedTaskId,
  onCreateTask,
  onDropTask,
  onOpenTask,
  onDragStart,
}: TaskBoardColumnProps) {
  const [adding, setAdding] = useState(false);
  const [isOver, setIsOver] = useState(false);

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsOver(false);
        if (draggedTaskId) onDropTask(draggedTaskId, list);
      }}
      className={cn(
        "flex min-h-[22rem] min-w-[18rem] flex-1 flex-col rounded-2xl border bg-muted/20 transition-colors",
        isOver ? "border-primary/60 bg-primary/5" : "border-border/50"
      )}
    >
      <div className="border-b border-border/40 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg", tone)}>
                <Icon className="h-3.5 w-3.5" />
              </span>
              <h2 className="text-sm font-semibold">{title}</h2>
              <span className="rounded-full bg-background/70 px-2 py-0.5 text-[10px] text-muted-foreground">
                {tasks.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAdding((value) => !value)}
            className="h-7 w-7 shrink-0 p-0"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {adding && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <TaskForm
                defaultStatus={list.mapsToTaskStatus as TaskStatus}
                defaultSource="manual"
                onSubmit={async (input) => {
                  await onCreateTask({
                    ...input,
                    projectId: list.projectId,
                    boardId: list.boardId,
                    listId: list.id,
                    status: list.mapsToTaskStatus,
                  });
                  setAdding(false);
                }}
                onClose={() => setAdding(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {tasks.length === 0 && !adding ? (
          <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-border/50 px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">Sin tareas</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Arrastra una tarjeta aquí o crea una nueva.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskBoardCard
                key={task.id}
                task={task}
                onOpen={() => onOpenTask(task)}
                onDragStart={onDragStart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

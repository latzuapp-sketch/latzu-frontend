"use client";

import { useMemo, useState } from "react";
import { TaskBoardColumn } from "@/components/planning/TaskBoardColumn";
import { TaskIssueModal } from "@/components/planning/TaskIssueModal";
import type { ActivityEvent, BoardList, CreateTaskInput, PlanningTask } from "@/types/planning";
import { CheckCircle2, Circle, Clock, ListTodo } from "lucide-react";

const listIcon = {
  todo: Circle,
  in_progress: Clock,
  done: CheckCircle2,
  custom: ListTodo,
};

const listTone = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-amber-500/10 text-amber-400",
  done: "bg-emerald-500/10 text-emerald-400",
  custom: "bg-primary/10 text-primary",
};

interface TaskBoardProps {
  tasks: PlanningTask[];
  lists: BoardList[];
  onCreateTask: (input: CreateTaskInput) => Promise<void>;
  onUpdateTask: (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => Promise<void> | void;
  onDeleteTask: (id: string) => Promise<void> | void;
  onRecordActivity?: (event: Partial<ActivityEvent>) => Promise<void> | void;
}

export function TaskBoard({ tasks, lists, onCreateTask, onUpdateTask, onDeleteTask, onRecordActivity }: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  );

  const grouped = useMemo(() => {
    const byList = new Map<string, PlanningTask[]>();
    const fallbackByStatus = new Map(lists.map((list) => [list.mapsToTaskStatus, list.id]));
    for (const list of lists) byList.set(list.id, []);
    for (const task of tasks) {
      const listId = task.listId ?? fallbackByStatus.get(task.status) ?? lists[0]?.id;
      if (!listId) continue;
      const list = byList.get(listId) ?? [];
      list.push(task);
      byList.set(listId, list);
    }
    for (const list of byList.values()) {
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
    return byList;
  }, [lists, tasks]);

  const dropTask = (taskId: string, list: BoardList) => {
    const task = tasks.find((item) => item.id === taskId);
    setDraggedTaskId(null);
    if (!task || task.listId === list.id) return;
    onUpdateTask(taskId, {
      status: list.mapsToTaskStatus,
      projectId: list.projectId,
      boardId: list.boardId,
      listId: list.id,
      rank: Date.now(),
    });
    onRecordActivity?.({
      taskId,
      projectId: list.projectId,
      boardId: list.boardId,
      action: "moved_task",
      summary: `Movió la tarea a ${list.name}`,
      payload: { fromListId: task.listId, toListId: list.id },
    });
  };

  return (
    <>
      <div className="flex h-full gap-3 overflow-x-auto p-3 md:p-4">
        {lists.map((list) => (
          <TaskBoardColumn
            key={list.id}
            list={list}
            title={list.name}
            description={list.description}
            icon={listIcon[list.kind]}
            tone={listTone[list.kind]}
            tasks={grouped.get(list.id) ?? []}
            draggedTaskId={draggedTaskId}
            onCreateTask={onCreateTask}
            onDropTask={dropTask}
            onOpenTask={(task) => setSelectedTaskId(task.id)}
            onDragStart={setDraggedTaskId}
          />
        ))}
      </div>

      <TaskIssueModal
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => {
          if (!open) setSelectedTaskId(null);
        }}
        onUpdate={onUpdateTask}
        onDelete={onDeleteTask}
        onCreateTask={onCreateTask}
        allTasks={tasks}
      />
    </>
  );
}

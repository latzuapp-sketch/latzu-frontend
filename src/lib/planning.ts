import type {
  ABCDEPriority,
  CreateTaskInput,
  LifeArea,
  PlanningTask,
  TaskCategory,
  TaskCreator,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/types/planning";

export const PLANNING_TASK_ENTITY_TYPE = "PlanningTask";
export const PLANNING_TASK_QUERY_LIMIT = 200;

export type PlanningTaskEntity = {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
  updatedAt?: string | null;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return values.length > 0 ? values : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function entityToPlanningTask(entity: PlanningTaskEntity): PlanningTask {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    status: (p.status as TaskStatus) ?? "todo",
    priority: (p.priority as TaskPriority) ?? "medium",
    abcdePriority: optionalString(p.abcdePriority) as ABCDEPriority | undefined,
    lifeArea: optionalString(p.lifeArea) as LifeArea | undefined,
    dueDate: nullableString(p.dueDate),
    dueTime: nullableString(p.dueTime),
    category: (p.category as TaskCategory) ?? "task",
    contentType: optionalString(p.contentType) as TaskCategory | undefined,
    contentRef: optionalString(p.contentRef),
    phaseIndex: optionalNumber(p.phaseIndex),
    subPhaseId: optionalString(p.subPhaseId),
    planId: optionalString(p.planId),
    lessonRef: optionalString(p.lessonRef),
    googleEventId: optionalString(p.googleEventId),
    source: optionalString(p.source) as TaskSource | undefined,
    labels: stringList(p.labels),
    assigneeUserId: optionalString(p.assigneeUserId),
    assigneeName: optionalString(p.assigneeName),
    estimateMinutes: optionalNumber(p.estimateMinutes),
    spentMinutes: optionalNumber(p.spentMinutes),
    rank: optionalNumber(p.rank),
    parentTaskId: optionalString(p.parentTaskId),
    blockedBy: stringList(p.blockedBy),
    acceptanceCriteria: optionalString(p.acceptanceCriteria),
    createdBy: optionalString(p.createdBy) as TaskCreator | undefined,
    userId: String(p.userId ?? ""),
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? undefined,
  };
}

export function taskToProperties(task: PlanningTask): Record<string, unknown> {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    abcdePriority: task.abcdePriority ?? null,
    lifeArea: task.lifeArea ?? null,
    dueDate: task.dueDate ?? null,
    dueTime: task.dueTime ?? null,
    category: task.category,
    contentType: task.contentType ?? null,
    contentRef: task.contentRef ?? null,
    phaseIndex: task.phaseIndex ?? null,
    subPhaseId: task.subPhaseId ?? null,
    planId: task.planId ?? null,
    lessonRef: task.lessonRef ?? null,
    googleEventId: task.googleEventId ?? null,
    source: task.source ?? "manual",
    labels: task.labels ?? [],
    assigneeUserId: task.assigneeUserId ?? null,
    assigneeName: task.assigneeName ?? null,
    estimateMinutes: task.estimateMinutes ?? null,
    spentMinutes: task.spentMinutes ?? null,
    rank: task.rank ?? null,
    parentTaskId: task.parentTaskId ?? null,
    blockedBy: task.blockedBy ?? [],
    acceptanceCriteria: task.acceptanceCriteria ?? null,
    createdBy: task.createdBy ?? "user",
    userId: task.userId,
    updatedAt: new Date().toISOString(),
  };
}

export function createTaskProperties(input: CreateTaskInput, userId: string): Record<string, unknown> {
  const abcdeToPriority: Record<ABCDEPriority, TaskPriority> = {
    A: "high",
    B: "high",
    C: "medium",
    D: "low",
    E: "low",
  };
  const derivedPriority = input.abcdePriority
    ? abcdeToPriority[input.abcdePriority]
    : (input.priority ?? "medium");

  return {
    title: input.title,
    description: input.description ?? "",
    status: input.status ?? "todo",
    priority: derivedPriority,
    abcdePriority: input.abcdePriority ?? null,
    lifeArea: input.lifeArea ?? null,
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    category: input.category ?? "task",
    contentType: input.contentType ?? null,
    contentRef: input.contentRef ?? null,
    phaseIndex: input.phaseIndex ?? null,
    subPhaseId: input.subPhaseId ?? null,
    planId: input.planId ?? null,
    lessonRef: input.lessonRef ?? null,
    googleEventId: null,
    source: input.source ?? "manual",
    labels: input.labels ?? [],
    assigneeUserId: input.assigneeUserId ?? null,
    assigneeName: input.assigneeName ?? null,
    estimateMinutes: input.estimateMinutes ?? null,
    spentMinutes: input.spentMinutes ?? null,
    rank: input.rank ?? Date.now(),
    parentTaskId: input.parentTaskId ?? null,
    blockedBy: input.blockedBy ?? [],
    acceptanceCriteria: input.acceptanceCriteria ?? null,
    createdBy: input.createdBy ?? "user",
    userId,
    updatedAt: new Date().toISOString(),
  };
}

export function taskPatchProperties(
  props: Partial<Omit<PlanningTask, "id" | "createdAt">>,
): Record<string, unknown> {
  return {
    ...props,
    updatedAt: new Date().toISOString(),
  };
}

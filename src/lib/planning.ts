import type {
  ABCDEPriority,
  ActivityEvent,
  BoardList,
  CreateTaskInput,
  LifeArea,
  PlanningTask,
  ProjectBoard,
  ProjectBoardProject,
  ProjectMember,
  TaskComment,
  TaskCategory,
  TaskCreator,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/types/planning";

export const PLANNING_TASK_ENTITY_TYPE = "PlanningTask";
export const PROJECT_ENTITY_TYPE = "Project";
export const BOARD_ENTITY_TYPE = "Board";
export const BOARD_LIST_ENTITY_TYPE = "BoardList";
export const TASK_COMMENT_ENTITY_TYPE = "TaskComment";
export const ACTIVITY_EVENT_ENTITY_TYPE = "ActivityEvent";
export const PLANNING_TASK_QUERY_LIMIT = 200;

export type PlanningTaskEntity = {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
  updatedAt?: string | null;
};

export type EntityInstance = PlanningTaskEntity;

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

function requiredStringList(value: unknown): string[] {
  return stringList(value) ?? [];
}

function memberList(value: unknown): ProjectMember[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ProjectMember => typeof item === "object" && item !== null && "userId" in item)
    .map((item) => ({
      userId: String(item.userId),
      name: String(item.name ?? item.userId),
      email: item.email ? String(item.email) : undefined,
      role: item.role ?? "member",
    }));
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
    projectId: optionalString(p.projectId),
    boardId: optionalString(p.boardId),
    listId: optionalString(p.listId),
    issueKey: optionalString(p.issueKey),
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
    watcherUserIds: stringList(p.watcherUserIds),
    memberUserIds: stringList(p.memberUserIds),
    lastEditedByUserId: optionalString(p.lastEditedByUserId),
    lastEditedByName: optionalString(p.lastEditedByName),
    linkedTaskIds: stringList(p.linkedTaskIds),
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
    projectId: task.projectId ?? null,
    boardId: task.boardId ?? null,
    listId: task.listId ?? null,
    issueKey: task.issueKey ?? null,
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
    watcherUserIds: task.watcherUserIds ?? [],
    memberUserIds: task.memberUserIds ?? [],
    lastEditedByUserId: task.lastEditedByUserId ?? null,
    lastEditedByName: task.lastEditedByName ?? null,
    linkedTaskIds: task.linkedTaskIds ?? [],
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
    projectId: input.projectId ?? null,
    boardId: input.boardId ?? null,
    listId: input.listId ?? null,
    issueKey: input.issueKey ?? null,
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
    watcherUserIds: input.watcherUserIds ?? [],
    memberUserIds: input.memberUserIds ?? [],
    lastEditedByUserId: input.lastEditedByUserId ?? null,
    lastEditedByName: input.lastEditedByName ?? null,
    linkedTaskIds: input.linkedTaskIds ?? [],
    acceptanceCriteria: input.acceptanceCriteria ?? null,
    createdBy: input.createdBy ?? "user",
    userId,
    updatedAt: new Date().toISOString(),
  };
}

export function entityToProject(entity: EntityInstance): ProjectBoardProject {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    name: String(p.name ?? "Mi trabajo"),
    key: String(p.key ?? "WORK"),
    description: String(p.description ?? ""),
    ownerUserId: String(p.ownerUserId ?? p.userId ?? ""),
    ownerName: optionalString(p.ownerName),
    tenantId: optionalString(p.tenantId),
    memberUserIds: requiredStringList(p.memberUserIds),
    memberNames: requiredStringList(p.memberNames),
    members: memberList(p.members),
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? undefined,
  };
}

export function projectToProperties(project: Partial<ProjectBoardProject>): Record<string, unknown> {
  return {
    name: project.name ?? "Mi trabajo",
    key: project.key ?? "WORK",
    description: project.description ?? "",
    ownerUserId: project.ownerUserId ?? "",
    ownerName: project.ownerName ?? null,
    tenantId: project.tenantId ?? null,
    memberUserIds: project.memberUserIds ?? [],
    memberNames: project.memberNames ?? [],
    members: project.members ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function entityToBoard(entity: EntityInstance): ProjectBoard {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    projectId: String(p.projectId ?? ""),
    name: String(p.name ?? "General"),
    description: String(p.description ?? ""),
    ownerUserId: String(p.ownerUserId ?? p.userId ?? ""),
    memberUserIds: requiredStringList(p.memberUserIds),
    memberNames: requiredStringList(p.memberNames),
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? undefined,
  };
}

export function boardToProperties(board: Partial<ProjectBoard>): Record<string, unknown> {
  return {
    projectId: board.projectId ?? "",
    name: board.name ?? "General",
    description: board.description ?? "",
    ownerUserId: board.ownerUserId ?? "",
    memberUserIds: board.memberUserIds ?? [],
    memberNames: board.memberNames ?? [],
    updatedAt: new Date().toISOString(),
  };
}

export function entityToBoardList(entity: EntityInstance): BoardList {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    projectId: String(p.projectId ?? ""),
    boardId: String(p.boardId ?? ""),
    name: String(p.name ?? "Lista"),
    description: String(p.description ?? ""),
    order: optionalNumber(p.order) ?? 0,
    kind: p.kind === "todo" || p.kind === "in_progress" || p.kind === "done" ? p.kind : "custom",
    mapsToTaskStatus: (p.mapsToTaskStatus as TaskStatus) ?? "todo",
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? undefined,
  };
}

export function boardListToProperties(list: Partial<BoardList>): Record<string, unknown> {
  return {
    projectId: list.projectId ?? "",
    boardId: list.boardId ?? "",
    name: list.name ?? "Lista",
    description: list.description ?? "",
    order: list.order ?? Date.now(),
    kind: list.kind ?? "custom",
    mapsToTaskStatus: list.mapsToTaskStatus ?? "todo",
    updatedAt: new Date().toISOString(),
  };
}

export function entityToTaskComment(entity: EntityInstance): TaskComment {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    taskId: String(p.taskId ?? ""),
    projectId: optionalString(p.projectId),
    boardId: optionalString(p.boardId),
    authorUserId: String(p.authorUserId ?? ""),
    authorName: String(p.authorName ?? "Usuario"),
    body: String(p.body ?? ""),
    createdAt: entity.createdAt ?? new Date().toISOString(),
    updatedAt: entity.updatedAt ?? undefined,
  };
}

export function commentToProperties(comment: Partial<TaskComment>): Record<string, unknown> {
  return {
    taskId: comment.taskId ?? "",
    projectId: comment.projectId ?? null,
    boardId: comment.boardId ?? null,
    authorUserId: comment.authorUserId ?? "",
    authorName: comment.authorName ?? "Usuario",
    body: comment.body ?? "",
    updatedAt: new Date().toISOString(),
  };
}

export function entityToActivityEvent(entity: EntityInstance): ActivityEvent {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    taskId: optionalString(p.taskId),
    projectId: optionalString(p.projectId),
    boardId: optionalString(p.boardId),
    actorUserId: String(p.actorUserId ?? ""),
    actorName: String(p.actorName ?? "Usuario"),
    action: String(p.action ?? "updated"),
    summary: String(p.summary ?? ""),
    payload: typeof p.payload === "object" && p.payload !== null ? p.payload as Record<string, unknown> : undefined,
    createdAt: entity.createdAt ?? new Date().toISOString(),
  };
}

export function activityToProperties(activity: Partial<ActivityEvent>): Record<string, unknown> {
  return {
    taskId: activity.taskId ?? null,
    projectId: activity.projectId ?? null,
    boardId: activity.boardId ?? null,
    actorUserId: activity.actorUserId ?? "",
    actorName: activity.actorName ?? "Usuario",
    action: activity.action ?? "updated",
    summary: activity.summary ?? "",
    payload: activity.payload ?? {},
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

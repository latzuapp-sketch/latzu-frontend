"use client";

/**
 * usePlanning — Hooks for the Planning module.
 *
 * Tasks: persisted as EntityInstances (entityType "PlanningTask") via Entity API.
 * Calendar events: fetched from /api/calendar/events (Google Calendar REST via server proxy).
 *
 * Sync behaviour:
 *   create task  → if dueDate and calendar connected → auto-create Calendar event, store googleEventId
 *   update task  → if title/dueDate/dueTime changed and task has googleEventId → PATCH Calendar event
 *   delete task  → if task has googleEventId → DELETE Calendar event first
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { entityClient } from "@/lib/apollo";
import {
  GET_ENTITIES,
  CREATE_ENTITY,
  UPDATE_ENTITY,
  DELETE_ENTITY,
  GET_ENTITY_RELATIONSHIPS,
  CREATE_ENTITY_RELATIONSHIP,
  DELETE_ENTITY_RELATIONSHIP,
} from "@/graphql/api/operations";
import type {
  ActivityEvent,
  BoardList,
  CalendarEvent,
  CreateTaskInput,
  EntityRelationship,
  PlanningTask,
  ProjectBoard,
  ProjectBoardProject,
  TaskComment,
  TaskRelationshipType,
  TaskStatus,
} from "@/types/planning";
import {
  ACTIVITY_EVENT_ENTITY_TYPE,
  activityToProperties,
  BOARD_ENTITY_TYPE,
  BOARD_LIST_ENTITY_TYPE,
  boardListToProperties,
  boardToProperties,
  commentToProperties,
  createTaskProperties,
  entityToActivityEvent,
  entityToBoard,
  entityToBoardList,
  entityToPlanningTask,
  entityToProject,
  entityToTaskComment,
  PLANNING_TASK_ENTITY_TYPE,
  PLANNING_TASK_QUERY_LIMIT,
  PROJECT_ENTITY_TYPE,
  projectToProperties,
  TASK_COMMENT_ENTITY_TYPE,
  taskPatchProperties,
} from "@/lib/planning";

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_TYPE = PLANNING_TASK_ENTITY_TYPE;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function taskToEventTimes(task: { dueDate: string; dueTime?: string | null }) {
  const allDay = !task.dueTime;
  const start = task.dueTime ? `${task.dueDate}T${task.dueTime}:00` : task.dueDate;
  const end = task.dueTime
    ? (() => {
        const [h, m] = task.dueTime!.split(":").map(Number);
        const totalMin = h * 60 + m + 30;
        const eh = Math.floor(totalMin / 60) % 24;
        const em = totalMin % 60;
        return `${task.dueDate}T${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}:00`;
      })()
    : task.dueDate;
  return { start, end, allDay };
}

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toDateString(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── useCalendarEvents ────────────────────────────────────────────────────────

export function useCalendarEvents(timeMin: Date, timeMax: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
      });
      const res = await fetch(`/api/calendar/events?${params}`);
      const data = await res.json();
      if (data.connected === false) {
        setConnected(false);
        setEvents([]);
      } else {
        setConnected(true);
        setEvents(data.events ?? []);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [timeMin.toISOString(), timeMax.toISOString()]); // eslint-disable-line

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const pushEvent = useCallback(async (task: PlanningTask): Promise<string | null> => {
    if (!task.dueDate) return null;
    try {
      const { start, end, allDay } = taskToEventTimes({
        dueDate: task.dueDate,
        dueTime: task.dueTime,
      });
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: task.title,
          description: task.description || undefined,
          start,
          end,
          allDay,
        }),
      });
      const data = await res.json();
      if (data.connected === false) { setConnected(false); return null; }
      if (data.event) {
        setEvents((prev) => [...prev, data.event]);
        return data.event.id as string;
      }
    } catch {/* silent */}
    return null;
  }, []);

  const updateEvent = useCallback(async (
    eventId: string,
    changes: { title?: string; description?: string; dueDate?: string; dueTime?: string | null },
  ): Promise<boolean> => {
    try {
      const body: Record<string, unknown> = {};
      if (changes.title !== undefined) body.summary = changes.title;
      if (changes.description !== undefined) body.description = changes.description;
      if (changes.dueDate !== undefined) {
        const { start, end, allDay } = taskToEventTimes({
          dueDate: changes.dueDate,
          dueTime: changes.dueTime,
        });
        body.start = start;
        body.end = end;
        body.allDay = allDay;
      }
      const res = await fetch(`/api/calendar/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.connected === false) { setConnected(false); return false; }
      if (data.event) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, ...data.event } : e)),
        );
        return true;
      }
    } catch {/* silent */}
    return false;
  }, []);

  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.connected === false) { setConnected(false); return; }
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    } catch {/* silent */}
  }, []);

  return { events, connected, loading, refetch: fetchEvents, pushEvent, updateEvent, deleteEvent };
}

// ─── useTasks ─────────────────────────────────────────────────────────────────

type CalendarActions = {
  connected: boolean | null;
  pushEvent: (task: PlanningTask) => Promise<string | null>;
  updateEvent: (eventId: string, changes: { title?: string; description?: string; dueDate?: string; dueTime?: string | null }) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<void>;
};

export function useTasks(calendar?: CalendarActions) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: ENTITY_TYPE, skip: 0, limit: PLANNING_TASK_QUERY_LIMIT },
    fetchPolicy: "cache-and-network",
  });

  const [createEntityMutation] = useMutation(CREATE_ENTITY, {
    client: entityClient,
    refetchQueries: [{ query: GET_ENTITIES, variables: { entityType: ENTITY_TYPE, skip: 0, limit: PLANNING_TASK_QUERY_LIMIT } }],
  });

  const [updateEntityMutation] = useMutation(UPDATE_ENTITY, {
    client: entityClient,
    update(cache, { data: res }) {
      if (res?.updateEntity) {
        cache.modify({
          id: cache.identify({ __typename: "EntityGQL", id: res.updateEntity.id }),
          fields: {
            properties: () => res.updateEntity.properties,
            updatedAt: () => res.updateEntity.updatedAt,
          },
        });
      }
    },
  });

  const [deleteEntityMutation] = useMutation(DELETE_ENTITY, {
    client: entityClient,
    update(cache, _result, { variables }) {
      if (variables?.id) {
        cache.evict({ id: cache.identify({ __typename: "EntityGQL", id: variables.id }) });
        cache.gc();
      }
    },
  });

  const allTasks: PlanningTask[] = useMemo(() => {
    const items = data?.entities?.items ?? [];
    const mapped: PlanningTask[] = items.map(entityToPlanningTask);
    if (!userId) return mapped;
    return mapped.filter((t) =>
      !t.userId ||
      t.userId === userId ||
      (t.memberUserIds ?? []).includes(userId) ||
      (t.watcherUserIds ?? []).includes(userId),
    );
  }, [data, userId]);

  const _updateEntity = useCallback(
    async (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => {
      await updateEntityMutation({ variables: { id, input: { properties: taskPatchProperties(props) } } });
    },
    [updateEntityMutation],
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<PlanningTask | null> => {
      if (!userId) return null;
      try {
        const { data: res } = await createEntityMutation({
          variables: {
            input: {
              entityType: ENTITY_TYPE,
              properties: createTaskProperties(input, userId),
            },
          },
        });

        const task = res?.createEntity ? entityToPlanningTask(res.createEntity) : null;

        // Auto-push to Calendar if connected and task has a date
        if (task && task.dueDate && calendar?.connected) {
          const eventId = await calendar.pushEvent(task);
          if (eventId) {
            await _updateEntity(task.id, { googleEventId: eventId });
          }
        }

        return task;
      } catch {
        return null;
      }
    },
    [userId, createEntityMutation, calendar, _updateEntity],
  );

  const updateTask = useCallback(
    async (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => {
      try {
        // Find the current task to compare and get the googleEventId
        const current = allTasks.find((t) => t.id === id);
        await _updateEntity(id, props);

        // Sync Calendar event if the task had one and relevant fields changed
        const googleEventId = current?.googleEventId ?? (props.googleEventId as string | undefined);
        if (googleEventId && calendar?.connected) {
          const calendarChanged =
            props.title !== undefined ||
            props.dueDate !== undefined ||
            props.dueTime !== undefined ||
            props.description !== undefined;

          if (calendarChanged) {
            await calendar.updateEvent(googleEventId, {
              title: props.title ?? current?.title,
              description: props.description ?? current?.description,
              dueDate: props.dueDate !== undefined ? (props.dueDate ?? undefined) : (current?.dueDate ?? undefined),
              dueTime: props.dueTime !== undefined ? props.dueTime : current?.dueTime,
            });
          }
        }
      } catch {/* silent */}
    },
    [allTasks, _updateEntity, calendar],
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        const task = allTasks.find((t) => t.id === id);

        // Delete Calendar event first if it exists
        if (task?.googleEventId && calendar?.connected) {
          await calendar.deleteEvent(task.googleEventId);
        }

        await deleteEntityMutation({ variables: { id } });
      } catch {/* silent */}
    },
    [allTasks, deleteEntityMutation, calendar],
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => updateTask(id, { status }),
    [updateTask],
  );

  return {
    tasks: allTasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    setStatus,
    refetch,
  };
}

export function useProjectBoards() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;
  const userName = session?.user?.name ?? "Usuario";

  const projectsQuery = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: PROJECT_ENTITY_TYPE, skip: 0, limit: 100 },
    fetchPolicy: "cache-and-network",
  });
  const boardsQuery = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: BOARD_ENTITY_TYPE, skip: 0, limit: 100 },
    fetchPolicy: "cache-and-network",
  });
  const listsQuery = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: BOARD_LIST_ENTITY_TYPE, skip: 0, limit: 200 },
    fetchPolicy: "cache-and-network",
  });

  const [createEntityMutation] = useMutation(CREATE_ENTITY, { client: entityClient });
  const [updateEntityMutation] = useMutation(UPDATE_ENTITY, { client: entityClient });

  const projects = useMemo(() => {
    const items = projectsQuery.data?.entities?.items ?? [];
    return items.map(entityToProject).filter((project: ProjectBoardProject) =>
      !userId ||
      project.ownerUserId === userId ||
      project.memberUserIds.includes(userId) ||
      project.members.some((member) => member.userId === userId),
    );
  }, [projectsQuery.data, userId]);

  const boards = useMemo(() => {
    const items = boardsQuery.data?.entities?.items ?? [];
    return items.map(entityToBoard).filter((board: ProjectBoard) =>
      !userId ||
      board.ownerUserId === userId ||
      board.memberUserIds.includes(userId) ||
      projects.some((project: ProjectBoardProject) => project.id === board.projectId),
    );
  }, [boardsQuery.data, projects, userId]);

  const boardLists = useMemo(() => {
    const items = listsQuery.data?.entities?.items ?? [];
    return items.map(entityToBoardList).sort((a: BoardList, b: BoardList) => a.order - b.order);
  }, [listsQuery.data]);

  const createProject = useCallback(async (input: Partial<ProjectBoardProject>) => {
    if (!userId) return null;
    const { data: res } = await createEntityMutation({
      variables: {
        input: {
          entityType: PROJECT_ENTITY_TYPE,
          properties: projectToProperties({
            name: input.name ?? "Mi trabajo",
            key: input.key ?? "WORK",
            description: input.description ?? "",
            ownerUserId: userId,
            ownerName: userName,
            memberUserIds: [userId],
            memberNames: [userName],
            members: [{ userId, name: userName, role: "owner" }],
          }),
        },
      },
    });
    await projectsQuery.refetch();
    return res?.createEntity ? entityToProject(res.createEntity) : null;
  }, [createEntityMutation, projectsQuery, userId, userName]);

  const createBoard = useCallback(async (input: Partial<ProjectBoard>) => {
    if (!userId || !input.projectId) return null;
    const { data: res } = await createEntityMutation({
      variables: {
        input: {
          entityType: BOARD_ENTITY_TYPE,
          properties: boardToProperties({
            projectId: input.projectId,
            name: input.name ?? "General",
            description: input.description ?? "",
            ownerUserId: userId,
            memberUserIds: [userId],
            memberNames: [userName],
          }),
        },
      },
    });
    await boardsQuery.refetch();
    return res?.createEntity ? entityToBoard(res.createEntity) : null;
  }, [boardsQuery, createEntityMutation, userId, userName]);

  const createBoardList = useCallback(async (input: Partial<BoardList>) => {
    if (!input.projectId || !input.boardId) return null;
    const { data: res } = await createEntityMutation({
      variables: {
        input: {
          entityType: BOARD_LIST_ENTITY_TYPE,
          properties: boardListToProperties(input),
        },
      },
    });
    await listsQuery.refetch();
    return res?.createEntity ? entityToBoardList(res.createEntity) : null;
  }, [createEntityMutation, listsQuery]);

  const updateProject = useCallback(async (id: string, props: Partial<ProjectBoardProject>) => {
    await updateEntityMutation({ variables: { id, input: { properties: projectToProperties(props) } } });
    await projectsQuery.refetch();
  }, [projectsQuery, updateEntityMutation]);

  const updateBoard = useCallback(async (id: string, props: Partial<ProjectBoard>) => {
    await updateEntityMutation({ variables: { id, input: { properties: boardToProperties(props) } } });
    await boardsQuery.refetch();
  }, [boardsQuery, updateEntityMutation]);

  const updateBoardList = useCallback(async (id: string, props: Partial<BoardList>) => {
    await updateEntityMutation({ variables: { id, input: { properties: boardListToProperties(props) } } });
    await listsQuery.refetch();
  }, [listsQuery, updateEntityMutation]);

  const ensureDefaultWorkspace = useCallback(async () => {
    if (!userId) return null;
    const existingProject = projects[0] ?? await createProject({ name: "Mi trabajo", key: "WORK" });
    if (!existingProject) return null;
    const existingBoard = boards.find((board: ProjectBoard) => board.projectId === existingProject.id)
      ?? await createBoard({ projectId: existingProject.id, name: "General" });
    if (!existingBoard) return { project: existingProject, board: null, lists: [] };

    let lists = boardLists.filter((list: BoardList) => list.boardId === existingBoard.id);
    if (lists.length === 0) {
      const defaults: Array<Pick<BoardList, "name" | "description" | "kind" | "mapsToTaskStatus" | "order">> = [
        { name: "Por hacer", description: "Backlog listo para empezar.", kind: "todo", mapsToTaskStatus: "todo", order: 10 },
        { name: "En progreso", description: "Trabajo activo ahora.", kind: "in_progress", mapsToTaskStatus: "in_progress", order: 20 },
        { name: "Hecho", description: "Trabajo completado.", kind: "done", mapsToTaskStatus: "done", order: 30 },
      ];
      for (const list of defaults) {
        await createBoardList({ ...list, projectId: existingProject.id, boardId: existingBoard.id });
      }
      await listsQuery.refetch();
      lists = (listsQuery.data?.entities?.items ?? []).map(entityToBoardList).filter((list: BoardList) => list.boardId === existingBoard.id);
    }
    return { project: existingProject, board: existingBoard, lists };
  }, [boardLists, boards, createBoard, createBoardList, createProject, listsQuery, projects, userId]);

  return {
    projects,
    boards,
    boardLists,
    loading: projectsQuery.loading || boardsQuery.loading || listsQuery.loading,
    createProject,
    createBoard,
    createBoardList,
    updateProject,
    updateBoard,
    updateBoardList,
    ensureDefaultWorkspace,
    refetch: async () => {
      await Promise.all([projectsQuery.refetch(), boardsQuery.refetch(), listsQuery.refetch()]);
    },
  };
}

export function useBoardTasks(tasks: PlanningTask[], projectId?: string | null, boardId?: string | null, lists: BoardList[] = []) {
  return useMemo(() => {
    const listByStatus = new Map<TaskStatus, BoardList>();
    for (const list of lists) listByStatus.set(list.mapsToTaskStatus, list);
    return tasks.filter((task) => {
      if (projectId && task.projectId && task.projectId !== projectId) return false;
      if (boardId && task.boardId && task.boardId !== boardId) return false;
      return true;
    }).map((task) => {
      if (task.listId || !lists.length) return task;
      const fallbackList = listByStatus.get(task.status);
      return fallbackList ? { ...task, projectId: task.projectId ?? projectId ?? undefined, boardId: task.boardId ?? boardId ?? undefined, listId: fallbackList.id } : task;
    });
  }, [boardId, lists, projectId, tasks]);
}

export function useTaskComments(taskId?: string | null) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "Usuario";
  const query = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: TASK_COMMENT_ENTITY_TYPE, skip: 0, limit: 200 },
    fetchPolicy: "cache-and-network",
  });
  const [createEntityMutation] = useMutation(CREATE_ENTITY, { client: entityClient });
  const comments = useMemo(() => {
    const items = query.data?.entities?.items ?? [];
    return items.map(entityToTaskComment)
      .filter((comment: TaskComment) => !taskId || comment.taskId === taskId)
      .sort((a: TaskComment, b: TaskComment) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [query.data, taskId]);
  const addComment = useCallback(async (body: string, context?: { projectId?: string; boardId?: string }) => {
    if (!taskId || !body.trim()) return null;
    const { data: res } = await createEntityMutation({
      variables: {
        input: {
          entityType: TASK_COMMENT_ENTITY_TYPE,
          properties: commentToProperties({
            taskId,
            projectId: context?.projectId,
            boardId: context?.boardId,
            authorUserId: userId,
            authorName: userName,
            body: body.trim(),
          }),
        },
      },
    });
    await query.refetch();
    return res?.createEntity ? entityToTaskComment(res.createEntity) : null;
  }, [createEntityMutation, query, taskId, userId, userName]);
  return { comments, loading: query.loading, addComment, refetch: query.refetch };
}

export function useTaskActivity(taskId?: string | null) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const userName = session?.user?.name ?? "Usuario";
  const query = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: ACTIVITY_EVENT_ENTITY_TYPE, skip: 0, limit: 200 },
    fetchPolicy: "cache-and-network",
  });
  const [createEntityMutation] = useMutation(CREATE_ENTITY, { client: entityClient });
  const activity = useMemo(() => {
    const items = query.data?.entities?.items ?? [];
    return items.map(entityToActivityEvent)
      .filter((event: ActivityEvent) => !taskId || event.taskId === taskId)
      .sort((a: ActivityEvent, b: ActivityEvent) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [query.data, taskId]);
  const recordActivity = useCallback(async (event: Partial<ActivityEvent>) => {
    const { data: res } = await createEntityMutation({
      variables: {
        input: {
          entityType: ACTIVITY_EVENT_ENTITY_TYPE,
          properties: activityToProperties({
            ...event,
            taskId: event.taskId ?? taskId ?? undefined,
            actorUserId: event.actorUserId ?? userId,
            actorName: event.actorName ?? userName,
          }),
        },
      },
    });
    await query.refetch();
    return res?.createEntity ? entityToActivityEvent(res.createEntity) : null;
  }, [createEntityMutation, query, taskId, userId, userName]);
  return { activity, loading: query.loading, recordActivity, refetch: query.refetch };
}

export function useTaskRelationships(taskId?: string | null) {
  const query = useQuery(GET_ENTITY_RELATIONSHIPS, {
    client: entityClient,
    variables: { id: taskId ?? "", direction: null },
    skip: !taskId,
    fetchPolicy: "cache-and-network",
  });
  const [createRelationshipMutation] = useMutation(CREATE_ENTITY_RELATIONSHIP, { client: entityClient });
  const [deleteRelationshipMutation] = useMutation(DELETE_ENTITY_RELATIONSHIP, { client: entityClient });
  const relationships = (query.data?.entityRelationships ?? []) as EntityRelationship[];
  const linkTask = useCallback(async (toId: string, relationshipType: TaskRelationshipType) => {
    if (!taskId || !toId) return;
    await createRelationshipMutation({ variables: { fromId: taskId, toId, relationshipType } });
    await query.refetch();
  }, [createRelationshipMutation, query, taskId]);
  const unlinkTask = useCallback(async (toId: string, relationshipType: string) => {
    if (!taskId || !toId) return;
    await deleteRelationshipMutation({ variables: { fromId: taskId, toId, relationshipType } });
    await query.refetch();
  }, [deleteRelationshipMutation, query, taskId]);
  return { relationships, loading: query.loading, linkTask, unlinkTask, refetch: query.refetch };
}

// ─── useWeekNavigation ────────────────────────────────────────────────────────

export function useWeekNavigation() {
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  const days = useMemo(() => getWeekDays(weekStart), [weekStart]);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [weekStart]);

  const prevWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const nextWeek = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setWeekStart(getWeekStart(new Date()));
  }, []);

  return { weekStart, weekEnd, days, prevWeek, nextWeek, goToToday };
}

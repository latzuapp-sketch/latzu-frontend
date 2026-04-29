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
} from "@/graphql/api/operations";
import type {
  PlanningTask,
  CalendarEvent,
  CreateTaskInput,
  TaskStatus,
  ABCDEPriority,
  TaskPriority,
} from "@/types/planning";

// ─── Constants ────────────────────────────────────────────────────────────────

const ENTITY_TYPE = "PlanningTask";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entityToTask(entity: {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
}): PlanningTask {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    status: (p.status as PlanningTask["status"]) ?? "todo",
    priority: (p.priority as PlanningTask["priority"]) ?? "medium",
    abcdePriority: p.abcdePriority ? (p.abcdePriority as ABCDEPriority) : undefined,
    lifeArea: p.lifeArea ? (p.lifeArea as PlanningTask["lifeArea"]) : undefined,
    dueDate: p.dueDate ? String(p.dueDate) : null,
    dueTime: p.dueTime ? String(p.dueTime) : null,
    category: (p.category as PlanningTask["category"]) ?? "task",
    contentType: p.contentType ? (p.contentType as PlanningTask["category"]) : undefined,
    contentRef: p.contentRef ? String(p.contentRef) : undefined,
    phaseIndex: p.phaseIndex !== undefined ? Number(p.phaseIndex) : undefined,
    planId: p.planId ? String(p.planId) : undefined,
    lessonRef: p.lessonRef ? String(p.lessonRef) : undefined,
    googleEventId: p.googleEventId ? String(p.googleEventId) : undefined,
    userId: String(p.userId ?? ""),
    createdAt: entity.createdAt ?? new Date().toISOString(),
  };
}

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
    variables: { entityType: ENTITY_TYPE, skip: 0, limit: 50 },
    fetchPolicy: "cache-and-network",
  });

  const [createEntityMutation] = useMutation(CREATE_ENTITY, {
    client: entityClient,
    refetchQueries: [{ query: GET_ENTITIES, variables: { entityType: ENTITY_TYPE, skip: 0, limit: 50 } }],
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
    const mapped: PlanningTask[] = items.map(entityToTask);
    if (!userId) return mapped;
    return mapped.filter((t) => !t.userId || t.userId === userId);
  }, [data, userId]);

  const _updateEntity = useCallback(
    async (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => {
      await updateEntityMutation({ variables: { id, input: { properties: props } } });
    },
    [updateEntityMutation],
  );

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<PlanningTask | null> => {
      if (!userId) return null;
      try {
        const abcdeToPriority: Record<ABCDEPriority, TaskPriority> = {
          A: "high", B: "high", C: "medium", D: "low", E: "low",
        };
        const derivedPriority = input.abcdePriority
          ? abcdeToPriority[input.abcdePriority]
          : (input.priority ?? "medium");

        const { data: res } = await createEntityMutation({
          variables: {
            input: {
              entityType: ENTITY_TYPE,
              properties: {
                title: input.title,
                description: input.description ?? "",
                status: input.status ?? "todo",
                priority: derivedPriority,
                abcdePriority: input.abcdePriority ?? null,
                lifeArea: input.lifeArea ?? null,
                dueDate: input.dueDate ?? null,
                dueTime: input.dueTime ?? null,
                category: input.category ?? "task",
                planId: input.planId ?? null,
                lessonRef: input.lessonRef ?? null,
                googleEventId: null,
                userId,
              },
            },
          },
        });

        const task = res?.createEntity ? entityToTask(res.createEntity) : null;

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

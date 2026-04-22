"use client";

/**
 * usePlanning — Hooks for the Planning module.
 *
 * Tasks: persisted as EntityInstances (entityType "PlanningTask") via Entity API.
 * Calendar events: fetched from /api/calendar/events (Google Calendar REST via server proxy).
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

// ─── Week helpers ─────────────────────────────────────────────────────────────

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  // Monday = first day
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

// ─── useTasks ─────────────────────────────────────────────────────────────────

export function useTasks() {
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

  // Filter to current user's tasks
  const allTasks: PlanningTask[] = useMemo(() => {
    const items = data?.entities?.items ?? [];
    const mapped: PlanningTask[] = items.map(entityToTask);
    if (!userId) return mapped;
    return mapped.filter((t) => !t.userId || t.userId === userId);
  }, [data, userId]);

  const createTask = useCallback(
    async (input: CreateTaskInput): Promise<PlanningTask | null> => {
      if (!userId) return null;
      try {
        const { data: res } = await createEntityMutation({
          variables: {
            input: {
              entityType: ENTITY_TYPE,
              properties: {
                title: input.title,
                description: input.description ?? "",
                status: input.status ?? "todo",
                priority: input.priority ?? "medium",
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
        return res?.createEntity ? entityToTask(res.createEntity) : null;
      } catch {
        return null;
      }
    },
    [userId, createEntityMutation]
  );

  const updateTask = useCallback(
    async (id: string, props: Partial<Omit<PlanningTask, "id" | "createdAt">>) => {
      try {
        await updateEntityMutation({
          variables: { id, input: { properties: props } },
        });
      } catch {/* silent */}
    },
    [updateEntityMutation]
  );

  const deleteTask = useCallback(
    async (id: string) => {
      try {
        await deleteEntityMutation({ variables: { id } });
      } catch {/* silent */}
    },
    [deleteEntityMutation]
  );

  const setStatus = useCallback(
    (id: string, status: TaskStatus) => updateTask(id, { status }),
    [updateTask]
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

// ─── useCalendarEvents ────────────────────────────────────────────────────────

export function useCalendarEvents(timeMin: Date, timeMax: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null); // null = unknown
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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const pushEvent = useCallback(
    async (task: PlanningTask): Promise<string | null> => {
      if (!task.dueDate) return null;
      try {
        const start = task.dueTime
          ? `${task.dueDate}T${task.dueTime}:00`
          : task.dueDate;
        const end = task.dueTime
          ? `${task.dueDate}T${task.dueTime.split(":")[0]}:${
              String(parseInt(task.dueTime.split(":")[1]) + 30).padStart(2, "0")
            }:00`
          : task.dueDate;
        const allDay = !task.dueTime;

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
        if (data.connected === false) {
          setConnected(false);
          return null;
        }
        if (data.event) {
          setEvents((prev) => [...prev, data.event]);
          return data.event.id as string;
        }
      } catch {/* silent */}
      return null;
    },
    []
  );

  return { events, connected, loading, refetch: fetchEvents, pushEvent };
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

"use client";

/**
 * useScheduler — list/create/cancel/snooze ScheduledEvents.
 *
 * Backed by the new GraphQL ops:
 *   query    upcomingEvents
 *   mutation scheduleEvent
 *   mutation cancelScheduledEvent
 *   mutation snoozeScheduledEvent
 */

import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_UPCOMING_EVENTS,
  SCHEDULE_EVENT,
  CANCEL_SCHEDULED_EVENT,
  SNOOZE_SCHEDULED_EVENT,
} from "@/graphql/ai/operations";
import type { ScheduledEvent, ScheduledEventKind, DeliveryChannel } from "@/graphql/types";

// ─── List upcoming ───────────────────────────────────────────────────────────

export interface UseUpcomingOptions {
  daysAhead?: number;
  includePastUnfired?: boolean;
  limit?: number;
}

export function useUpcomingEvents(opts: UseUpcomingOptions = {}) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    upcomingEvents: ScheduledEvent[];
  }>(GET_UPCOMING_EVENTS, {
    client: aiClient,
    variables: {
      userId,
      daysAhead: opts.daysAhead ?? 7,
      includePastUnfired: opts.includePastUnfired ?? true,
      limit: opts.limit ?? 50,
    },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
  });

  return {
    events: data?.upcomingEvents ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── Schedule / cancel / snooze ──────────────────────────────────────────────

export interface ScheduleInput {
  kind: ScheduledEventKind;
  title: string;
  whenIso: string;
  description?: string;
  durationMinutes?: number;
  reminderMinutesBefore?: number;
  relatedTargetId?: string;
  channels?: DeliveryChannel[];
}

export function useSchedulerMutations() {
  const [scheduleMutation, { loading: scheduling }] = useMutation<{
    scheduleEvent: ScheduledEvent;
  }>(SCHEDULE_EVENT, {
    client: aiClient,
    refetchQueries: [GET_UPCOMING_EVENTS],
    awaitRefetchQueries: true,
  });

  const [cancelMutation, { loading: cancelling }] = useMutation<{
    cancelScheduledEvent: { success: boolean; deletedId: string | null };
  }>(CANCEL_SCHEDULED_EVENT, {
    client: aiClient,
    refetchQueries: [GET_UPCOMING_EVENTS],
  });

  const [snoozeMutation, { loading: snoozing }] = useMutation<{
    snoozeScheduledEvent: ScheduledEvent | null;
  }>(SNOOZE_SCHEDULED_EVENT, {
    client: aiClient,
    refetchQueries: [GET_UPCOMING_EVENTS],
  });

  const schedule = useCallback(
    async (input: ScheduleInput): Promise<ScheduledEvent | null> => {
      const { data } = await scheduleMutation({ variables: { ...input } });
      return data?.scheduleEvent ?? null;
    },
    [scheduleMutation]
  );

  const cancel = useCallback(
    async (eventId: string): Promise<boolean> => {
      const { data } = await cancelMutation({ variables: { eventId } });
      return data?.cancelScheduledEvent.success ?? false;
    },
    [cancelMutation]
  );

  const snooze = useCallback(
    async (eventId: string, minutes = 15): Promise<ScheduledEvent | null> => {
      const { data } = await snoozeMutation({ variables: { eventId, minutes } });
      return data?.snoozeScheduledEvent ?? null;
    },
    [snoozeMutation]
  );

  return {
    schedule,
    cancel,
    snooze,
    loading: scheduling || cancelling || snoozing,
  };
}

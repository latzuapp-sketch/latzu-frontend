"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  APPLY_ACTION,
  DISMISS_ACTION,
  GET_AGENT_ACTIONS,
  GET_USER_MODEL,
  TRACK_INTERACTION,
  TRACK_INTERACTIONS,
  TRIGGER_REFLECTION,
} from "@/graphql/ai/operations";
import type {
  ActionResult,
  AgentAction,
  AgentActionVisibility,
  UserModel,
} from "@/graphql/types";

// ─── useAgentActions ──────────────────────────────────────────────────────────

/** List AgentAction items for the current user. Replaces useAgentIntents + useFocusSignals. */
export function useAgentActions(opts: {
  status?: string;
  visibility?: AgentActionVisibility;
  limit?: number;
} = {}) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    agentActions: AgentAction[];
  }>(GET_AGENT_ACTIONS, {
    client: aiClient,
    variables: {
      userId,
      status: opts.status ?? null,
      visibility: opts.visibility ?? null,
      limit: opts.limit ?? 50,
    },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
  });

  return {
    actions: data?.agentActions ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useActionMutations ───────────────────────────────────────────────────────

export function useActionMutations() {
  const [applyMutation, { loading: applying }] = useMutation<{
    applyAction: ActionResult;
  }>(APPLY_ACTION, {
    client: aiClient,
    refetchQueries: [GET_AGENT_ACTIONS],
  });

  const [dismissMutation, { loading: dismissing }] = useMutation<{
    dismissAction: ActionResult;
  }>(DISMISS_ACTION, {
    client: aiClient,
    refetchQueries: [GET_AGENT_ACTIONS],
  });

  const [triggerMutation, { loading: triggering }] = useMutation(
    TRIGGER_REFLECTION,
    { client: aiClient }
  );

  const apply = useCallback(
    async (actionId: string): Promise<boolean> => {
      try {
        const { data } = await applyMutation({ variables: { actionId } });
        return data?.applyAction.success ?? false;
      } catch {
        return false;
      }
    },
    [applyMutation]
  );

  const dismiss = useCallback(
    async (actionId: string): Promise<boolean> => {
      try {
        const { data } = await dismissMutation({ variables: { actionId } });
        return data?.dismissAction.success ?? false;
      } catch {
        return false;
      }
    },
    [dismissMutation]
  );

  const triggerReflection = useCallback(async (): Promise<void> => {
    try {
      await triggerMutation();
    } catch {
      // best-effort
    }
  }, [triggerMutation]);

  return {
    apply,
    dismiss,
    triggerReflection,
    loading: applying || dismissing || triggering,
  };
}

// ─── useTrackInteraction ──────────────────────────────────────────────────────
//
// Events are buffered client-side (≤10 items / ≤5s) and flushed via the batch
// mutation `trackInteractions`. Calls before flush coalesce — a single noisy
// page no longer hits the backend N times. The buffer also flushes on
// `visibilitychange` (tab hidden) and on unmount, so we don't lose tail events.

type TrackPayload = {
  eventType: string;
  targetId?: string | null;
  targetType?: string | null;
  workspaceId?: string | null;
  durationMs?: number | null;
};

const TRACK_BUFFER_MAX = 10;
const TRACK_BUFFER_FLUSH_MS = 5_000;

// Module-level buffer so multiple hook consumers share a single queue.
const trackBuffer: TrackPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushHandler: ((events: TrackPayload[]) => Promise<void>) | null = null;

function scheduleFlush() {
  if (flushTimer != null) return;
  flushTimer = setTimeout(flushNow, TRACK_BUFFER_FLUSH_MS);
}

function flushNow() {
  if (flushTimer != null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (trackBuffer.length === 0 || !flushHandler) return;
  const drained = trackBuffer.splice(0, trackBuffer.length);
  flushHandler(drained).catch(() => {
    // silent — telemetry failures should never disrupt the UI
  });
}

export function useTrackInteraction() {
  const [trackOne] = useMutation(TRACK_INTERACTION, { client: aiClient });
  const [trackMany] = useMutation(TRACK_INTERACTIONS, { client: aiClient });

  // Bind the latest mutation closure to the module-level flush handler.
  useEffect(() => {
    flushHandler = async (events) => {
      if (events.length === 1) {
        await trackOne({ variables: events[0] });
        return;
      }
      await trackMany({ variables: { events } });
    };
    return () => {
      flushHandler = null;
    };
  }, [trackOne, trackMany]);

  // Flush on tab hide and on unmount so we don't lose tail events.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flushNow();
    };
  }, []);

  const track = useCallback(
    (
      eventType: string,
      opts: {
        targetId?: string;
        targetType?: string;
        workspaceId?: string;
        durationMs?: number;
      } = {}
    ): void => {
      trackBuffer.push({
        eventType,
        targetId: opts.targetId ?? null,
        targetType: opts.targetType ?? null,
        workspaceId: opts.workspaceId ?? null,
        durationMs: opts.durationMs ?? null,
      });
      if (trackBuffer.length >= TRACK_BUFFER_MAX) {
        flushNow();
      } else {
        scheduleFlush();
      }
    },
    []
  );

  return { track };
}

// ─── usePageTelemetry ─────────────────────────────────────────────────────────
//
// Drop-in for any dashboard route. Emits `page.viewed` on mount and
// `page.exited` with `durationMs` on unmount. No-op on the server.

export function usePageTelemetry(pathname: string, opts: { targetId?: string } = {}) {
  const { track } = useTrackInteraction();
  const enteredAt = useRef<number | null>(null);

  useEffect(() => {
    enteredAt.current = Date.now();
    track("page.viewed", { targetId: opts.targetId, targetType: "route", workspaceId: pathname });
    return () => {
      const ms = enteredAt.current != null ? Date.now() - enteredAt.current : 0;
      track("page.exited", {
        targetId: opts.targetId,
        targetType: "route",
        workspaceId: pathname,
        durationMs: ms,
      });
      enteredAt.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}

// ─── useUserModel ─────────────────────────────────────────────────────────────

export function useUserModel() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error } = useQuery<{
    userModel: UserModel | null;
  }>(GET_USER_MODEL, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 300_000,
  });

  return {
    userModel: data?.userModel ?? null,
    loading,
    error: error?.message ?? null,
  };
}

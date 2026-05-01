"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  APPROVE_INTENT,
  DISMISS_INTENT,
  DISMISS_FOCUS_SIGNAL,
  GET_AGENT_INTENTS,
  GET_FOCUS_SIGNALS,
  GET_USER_MODEL,
  TRACK_INTERACTION,
  TRIGGER_REFLECTION,
} from "@/graphql/ai/operations";
import type {
  AgentIntent,
  DeleteResult,
  FocusSignal,
  IntentActionResult,
  UserModel,
} from "@/graphql/types";

// ─── useAgentIntents ──────────────────────────────────────────────────────────

export function useAgentIntents(status?: string) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    agentIntents: AgentIntent[];
  }>(GET_AGENT_INTENTS, {
    client: aiClient,
    variables: { userId, status: status ?? null, limit: 20 },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000, // refresh every minute to surface new intents
  });

  return {
    intents: data?.agentIntents ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useIntentActions ─────────────────────────────────────────────────────────

export function useIntentActions() {
  const [approveMutation, { loading: approving }] = useMutation<{
    approveIntent: IntentActionResult;
  }>(APPROVE_INTENT, {
    client: aiClient,
    refetchQueries: [GET_AGENT_INTENTS],
  });

  const [dismissMutation, { loading: dismissing }] = useMutation<{
    dismissIntent: IntentActionResult;
  }>(DISMISS_INTENT, {
    client: aiClient,
    refetchQueries: [GET_AGENT_INTENTS],
  });

  const [triggerMutation, { loading: triggering }] = useMutation(
    TRIGGER_REFLECTION,
    { client: aiClient }
  );

  const approve = useCallback(
    async (intentId: string): Promise<boolean> => {
      try {
        const { data } = await approveMutation({ variables: { intentId } });
        return data?.approveIntent.success ?? false;
      } catch {
        return false;
      }
    },
    [approveMutation]
  );

  const dismiss = useCallback(
    async (intentId: string): Promise<boolean> => {
      try {
        const { data } = await dismissMutation({ variables: { intentId } });
        return data?.dismissIntent.success ?? false;
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
    approve,
    dismiss,
    triggerReflection,
    loading: approving || dismissing || triggering,
  };
}

// ─── useTrackInteraction ──────────────────────────────────────────────────────

export function useTrackInteraction() {
  const [trackMutation] = useMutation(TRACK_INTERACTION, { client: aiClient });

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
      // Fire-and-forget: tracking must never block user actions
      trackMutation({
        variables: {
          eventType,
          targetId: opts.targetId ?? null,
          targetType: opts.targetType ?? null,
          workspaceId: opts.workspaceId ?? null,
          durationMs: opts.durationMs ?? null,
        },
      }).catch(() => {
        // silent — tracking failures are non-critical
      });
    },
    [trackMutation]
  );

  return { track };
}

// ─── useFocusSignals ──────────────────────────────────────────────────────────

export function useFocusSignals(status?: string) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    focusSignals: FocusSignal[];
  }>(GET_FOCUS_SIGNALS, {
    client: aiClient,
    variables: { userId, status: status ?? "pending", limit: 10 },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
  });

  return {
    signals: data?.focusSignals ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useDismissFocusSignal ────────────────────────────────────────────────────

export function useDismissFocusSignal() {
  const [dismissMutation, { loading }] = useMutation<{
    dismissFocusSignal: DeleteResult;
  }>(DISMISS_FOCUS_SIGNAL, {
    client: aiClient,
    refetchQueries: [GET_FOCUS_SIGNALS],
  });

  const dismiss = useCallback(
    async (signalId: string): Promise<boolean> => {
      try {
        const { data } = await dismissMutation({ variables: { signalId } });
        return data?.dismissFocusSignal.success ?? false;
      } catch {
        return false;
      }
    },
    [dismissMutation]
  );

  return { dismiss, loading };
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
    pollInterval: 300_000, // refresh every 5 min
  });

  return {
    userModel: data?.userModel ?? null,
    loading,
    error: error?.message ?? null,
  };
}

"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  APPLY_ACTION,
  DISMISS_ACTION,
  GET_AGENT_ACTIONS,
  GET_USER_MODEL,
  TRACK_INTERACTION,
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

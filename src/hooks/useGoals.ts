"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import { useRouter } from "next/navigation";
import {
  GET_USER_GOALS,
  CREATE_GOAL,
  RESPOND_TO_ACTION,
  EXECUTE_ACTION_BUTTON,
  GET_AGENT_ACTIONS,
} from "@/graphql/ai/operations";
import type { GoalNode, DeleteResult } from "@/graphql/types";

/**
 * Typed button action attached to an AgentAction.responseOptions entry.
 * Mirrors apps/ai/services/agent_actions.py::ACTION_KINDS.
 */
export type ButtonActionKind =
  | "open_task"
  | "complete_task"
  | "start_chat"
  | "unlock_next_phase"
  | "mark_blocker"
  | "pause_goal"
  | "resume_goal"
  | "defer_goal"
  | "snooze"
  | "dismiss";

export interface ButtonActionOption {
  label: string;
  value: string;
  action?: ButtonActionKind;
  payload?: Record<string, unknown>;
}

interface ButtonActionResult {
  success: boolean;
  message: string;
  navigateTo: string | null;
}

// ─── useUserGoals ─────────────────────────────────────────────────────────────

export function useUserGoals(status?: string) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    userGoals: GoalNode[];
  }>(GET_USER_GOALS, {
    client: aiClient,
    variables: { userId, status: status ?? null },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 120_000,
  });

  return {
    goals: data?.userGoals ?? [],
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useCreateGoal ────────────────────────────────────────────────────────────

export function useCreateGoal() {
  const [createMutation, { loading }] = useMutation<{
    createGoal: Pick<GoalNode, "id" | "title" | "status" | "createdAt">;
  }>(CREATE_GOAL, {
    client: aiClient,
    refetchQueries: [GET_USER_GOALS],
  });

  const createGoal = useCallback(
    async (title: string, rawStatement?: string): Promise<GoalNode["id"] | null> => {
      try {
        const { data } = await createMutation({
          variables: { title, rawStatement: rawStatement ?? "" },
        });
        return data?.createGoal.id ?? null;
      } catch {
        return null;
      }
    },
    [createMutation]
  );

  return { createGoal, loading };
}

// ─── useRespondToAction ───────────────────────────────────────────────────────

/**
 * Single entry-point for tapping any button on an AgentAction. If the option
 * declares a typed `action` kind, it routes through `executeActionButton` and
 * the backend performs the real graph mutation (mark task done, snooze the
 * notification, pause a goal, etc). Falls back to the legacy clarification
 * flow (`respondToAction`) for plain `{label, value}` options.
 *
 * Returns a callback `respond(actionId, option)` plus a `loading` flag.
 */
export function useRespondToAction() {
  const router = useRouter();

  const [respondMutation, { loading: respondLoading }] = useMutation<{
    respondToAction: DeleteResult;
  }>(RESPOND_TO_ACTION, {
    client: aiClient,
    refetchQueries: [GET_AGENT_ACTIONS, GET_USER_GOALS],
  });

  const [executeMutation, { loading: executeLoading }] = useMutation<{
    executeActionButton: ButtonActionResult;
  }>(EXECUTE_ACTION_BUTTON, {
    client: aiClient,
    refetchQueries: [GET_AGENT_ACTIONS, GET_USER_GOALS],
  });

  const respond = useCallback(
    async (
      actionId: string,
      optionOrValue: ButtonActionOption | string,
      responseLabel?: string
    ): Promise<boolean> => {
      // Normalise to an option object.
      const option: ButtonActionOption = typeof optionOrValue === "string"
        ? { label: responseLabel ?? optionOrValue, value: optionOrValue }
        : optionOrValue;

      // Typed action → backend executor → optional navigation.
      if (option.action) {
        try {
          const { data } = await executeMutation({
            variables: {
              actionId,
              kind: option.action,
              payload: JSON.stringify(option.payload ?? {}),
            },
          });
          const result = data?.executeActionButton;
          if (result?.success && result.navigateTo) {
            router.push(result.navigateTo);
          }
          return result?.success ?? false;
        } catch {
          return false;
        }
      }

      // Legacy free-text response → clarification questions on goals.
      try {
        const { data } = await respondMutation({
          variables: {
            actionId,
            responseValue: option.value,
            responseLabel: option.label ?? option.value,
          },
        });
        return data?.respondToAction.success ?? false;
      } catch {
        return false;
      }
    },
    [respondMutation, executeMutation, router]
  );

  return { respond, loading: respondLoading || executeLoading };
}

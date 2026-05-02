"use client";

import { useCallback } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_USER_GOALS,
  CREATE_GOAL,
  RESPOND_TO_ACTION,
  GET_AGENT_ACTIONS,
} from "@/graphql/ai/operations";
import type { GoalNode, DeleteResult } from "@/graphql/types";

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

export function useRespondToAction() {
  const [respondMutation, { loading }] = useMutation<{
    respondToAction: DeleteResult;
  }>(RESPOND_TO_ACTION, {
    client: aiClient,
    refetchQueries: [GET_AGENT_ACTIONS, GET_USER_GOALS],
  });

  const respond = useCallback(
    async (
      actionId: string,
      responseValue: string,
      responseLabel?: string
    ): Promise<boolean> => {
      try {
        const { data } = await respondMutation({
          variables: { actionId, responseValue, responseLabel: responseLabel ?? responseValue },
        });
        return data?.respondToAction.success ?? false;
      } catch {
        return false;
      }
    },
    [respondMutation]
  );

  return { respond, loading };
}

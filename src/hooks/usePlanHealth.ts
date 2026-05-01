"use client";

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_ALL_PLAN_HEALTH,
  GET_PLAN_HEALTH,
  REFRESH_PLAN_HEALTH,
} from "@/graphql/ai/operations";
import type { PlanHealth } from "@/graphql/types";

// ─── useAllPlanHealth ─────────────────────────────────────────────────────────

export function useAllPlanHealth() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    allPlanHealth: PlanHealth[];
  }>(GET_ALL_PLAN_HEALTH, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 300_000, // refresh every 5 min
  });

  // Keyed by planId for fast O(1) lookups in PlanCard
  const healthByPlanId = useMemo(() => {
    const map: Record<string, PlanHealth> = {};
    for (const h of data?.allPlanHealth ?? []) {
      map[h.planId] = h;
    }
    return map;
  }, [data]);

  return {
    healthByPlanId,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── usePlanHealth ────────────────────────────────────────────────────────────

export function usePlanHealth(planId: string | null) {
  const { data, loading, error, refetch } = useQuery<{
    planHealth: PlanHealth | null;
  }>(GET_PLAN_HEALTH, {
    client: aiClient,
    variables: { planId },
    skip: !planId,
    fetchPolicy: "cache-and-network",
  });

  return {
    health: data?.planHealth ?? null,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useRefreshPlanHealth ─────────────────────────────────────────────────────

export function useRefreshPlanHealth() {
  const [refreshMutation, { loading }] = useMutation(REFRESH_PLAN_HEALTH, {
    client: aiClient,
    refetchQueries: [GET_ALL_PLAN_HEALTH],
  });

  const refresh = useCallback(async (planId: string): Promise<boolean> => {
    try {
      const { data } = await refreshMutation({ variables: { planId } });
      return data?.refreshPlanHealth?.success ?? false;
    } catch {
      return false;
    }
  }, [refreshMutation]);

  return { refresh, loading };
}

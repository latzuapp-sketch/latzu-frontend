"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_AGENT_NETWORK_STATUS,
  TRIGGER_AGENT_NETWORK,
} from "@/graphql/ai/operations";

export interface AgentSummary {
  agentName: string;
  insights: string[];
  recommendations: string;  // JSON string
  metadata: string;         // JSON string
  updatedAt: string;
}

export interface AgentNetworkStatus {
  agents: AgentSummary[];
  lastDeepReflection: string | null;
  graphHealth: string;
  totalIntentsPending: number;
  totalSignalsPending: number;
}

// ─── useAgentNetworkStatus ────────────────────────────────────────────────────

export function useAgentNetworkStatus(pollMs = 120_000) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    agentNetworkStatus: AgentNetworkStatus;
  }>(GET_AGENT_NETWORK_STATUS, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: pollMs,
  });

  return {
    status: data?.agentNetworkStatus ?? null,
    loading,
    error,
    refetch,
  };
}

// ─── useTriggerAgentNetwork ───────────────────────────────────────────────────

export function useTriggerAgentNetwork() {
  const [trigger, { loading }] = useMutation<{
    triggerAgentNetwork: { success: boolean; message: string };
  }>(TRIGGER_AGENT_NETWORK, { client: aiClient });

  const triggerNetwork = useCallback(async () => {
    try {
      const result = await trigger();
      return result.data?.triggerAgentNetwork ?? null;
    } catch {
      return null;
    }
  }, [trigger]);

  return { triggerNetwork, loading };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function parseAgentMetadata(metadataJson: string): Record<string, unknown> {
  try {
    return JSON.parse(metadataJson || "{}");
  } catch {
    return {};
  }
}

export function parseAgentRecommendations(recsJson: string): unknown[] {
  try {
    return JSON.parse(recsJson || "[]");
  } catch {
    return [];
  }
}

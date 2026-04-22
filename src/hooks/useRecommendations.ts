"use client";

import { useQuery, useMutation } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_RECOMMENDATIONS,
  GET_USER_MEMORY,
  GET_USER_STATS,
  RECORD_INTERACTION,
  REFRESH_USER_MEMORY,
} from "@/graphql/ai/operations";
import { useUserStore } from "@/stores/userStore";

export interface Recommendation {
  id: string;
  name: string;
  type: string;
  content: string;
  sourceRef: string | null;
  connectionStrength: number;
  reason: "graph_traversal" | "interest_match";
}

export interface UserMemory {
  userId: string;
  summary: string;
  interests: string[];
  knowledgeGaps: string[];
  learningStyle: string;
  sessionCount: number;
  messageCount: number;
  updatedAt: string | null;
}

export interface UserStats {
  ownedNodes: number;
  ownedRelationships: number;
  sessionCount: number;
  messageCount: number;
}

// ─── useRecommendations ───────────────────────────────────────────────────────

export function useRecommendations(limit = 8) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_RECOMMENDATIONS, {
    client: aiClient,
    variables: { userId, limit },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [recordMutation] = useMutation(RECORD_INTERACTION, { client: aiClient });

  const recommendations: Recommendation[] = data?.recommendations ?? [];

  const recordInteraction = async (
    nodeId: string,
    interactionType: "viewed" | "saved" | "dismissed" = "viewed"
  ) => {
    if (!userId) return;
    await recordMutation({
      variables: {
        input: { userId, nodeId, interactionType },
      },
    }).catch(() => {});  // Non-critical, never throw
  };

  return { recommendations, loading, refetch, recordInteraction };
}

// ─── useUserMemory ────────────────────────────────────────────────────────────

export function useUserMemory() {
  const { data: session } = useSession();
  const { profileType, preferences } = useUserStore();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_USER_MEMORY, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [refreshMutation, { loading: refreshing }] = useMutation(
    REFRESH_USER_MEMORY,
    { client: aiClient, onCompleted: () => refetch() }
  );

  const memory: UserMemory | null = data?.userMemory ?? null;

  const refreshMemory = async () => {
    if (!userId) return;
    await refreshMutation({
      variables: {
        userId,
        userProfile: {
          userId,
          name: session?.user?.name ?? "",
          profileType: profileType ?? "estudiante",
          experience: (session?.user as { experience?: string })?.experience ?? "",
          goals: (session?.user as { goals?: string[] })?.goals ?? [],
          interests: preferences?.focusAreas ?? [],
        },
      },
    });
  };

  return { memory, loading, refreshing, refreshMemory };
}

// ─── useUserStats ─────────────────────────────────────────────────────────────

export function useUserStats() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading } = useQuery(GET_USER_STATS, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const stats: UserStats = data?.userStats ?? {
    ownedNodes: 0,
    ownedRelationships: 0,
    sessionCount: 0,
    messageCount: 0,
  };

  return { stats, loading };
}

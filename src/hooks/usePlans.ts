"use client";

/**
 * usePlans — CRUD hook for ActionPlan entities.
 *
 * Plans are stored as EntityInstances (entityType "ActionPlan") via the Entity API.
 * The ActionPlan entity type is seeded by the backend on startup.
 * Each plan can have multiple PlanningTask instances linked via task.planId.
 */

import { useCallback, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { entityClient } from "@/lib/apollo";
import {
  GET_ENTITIES,
  CREATE_ENTITY,
  UPDATE_ENTITY,
  DELETE_ENTITY,
} from "@/graphql/api/operations";
import type { ActionPlan, CreatePlanInput, PlanType, PlanStatus } from "@/types/planning";

const PLAN_ENTITY_TYPE = "ActionPlan";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function entityToPlan(entity: {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
}): ActionPlan {
  const p = entity.properties ?? {};
  return {
    id: entity.id,
    title: String(p.title ?? ""),
    description: String(p.description ?? ""),
    goal: String(p.goal ?? ""),
    type: (p.type as PlanType) ?? "action",
    status: (p.status as PlanStatus) ?? "active",
    dueDate: p.dueDate ? String(p.dueDate) : null,
    userId: String(p.userId ?? ""),
    createdAt: entity.createdAt ?? new Date().toISOString(),
    aiGenerated: Boolean(p.aiGenerated ?? false),
    schedule: p.schedule ? String(p.schedule) : undefined,
    phases: p.phases ? String(p.phases) : undefined,
  };
}

// ─── usePlans ─────────────────────────────────────────────────────────────────

export function usePlans() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: { entityType: PLAN_ENTITY_TYPE, skip: 0, limit: 50 },
    fetchPolicy: "cache-and-network",
  });

  const [createEntityMutation] = useMutation(CREATE_ENTITY, {
    client: entityClient,
    refetchQueries: [{ query: GET_ENTITIES, variables: { entityType: PLAN_ENTITY_TYPE, skip: 0, limit: 50 } }],
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

  const plans: ActionPlan[] = useMemo(() => {
    const items = data?.entities?.items ?? [];
    const mapped: ActionPlan[] = items.map(entityToPlan);
    if (!userId) return mapped;
    return mapped
      .filter((p) => !p.userId || p.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, userId]);

  const createPlan = useCallback(
    async (input: CreatePlanInput): Promise<ActionPlan | null> => {
      if (!userId) return null;
      try {
        const { data: res } = await createEntityMutation({
          variables: {
            input: {
              entityType: PLAN_ENTITY_TYPE,
              properties: {
                title: input.title,
                description: input.description ?? "",
                goal: input.goal,
                type: input.type,
                status: "active",
                dueDate: input.dueDate ?? null,
                userId,
                aiGenerated: input.generateWithAI ?? false,
              },
            },
          },
        });
        return res?.createEntity ? entityToPlan(res.createEntity) : null;
      } catch { return null; }
    },
    [userId, createEntityMutation]
  );

  const updatePlan = useCallback(
    async (id: string, props: Partial<Omit<ActionPlan, "id" | "createdAt">>) => {
      try {
        await updateEntityMutation({ variables: { id, input: { properties: props } } });
      } catch {/* silent */}
    },
    [updateEntityMutation]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      try { await deleteEntityMutation({ variables: { id } }); }
      catch {/* silent */}
    },
    [deleteEntityMutation]
  );

  const setPlanStatus = useCallback(
    (id: string, status: PlanStatus) => updatePlan(id, { status }),
    [updatePlan]
  );

  return {
    plans,
    loading,
    createPlan,
    updatePlan,
    deletePlan,
    setPlanStatus,
    refetch,
  };
}

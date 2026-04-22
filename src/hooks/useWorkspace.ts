"use client";

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
import type { WorkspaceDoc } from "@/types/workspace";

const ENTITY_TYPE = "Workspace";
const QUERY_VARS = { entityType: ENTITY_TYPE, skip: 0, limit: 100 };

function entityToWorkspace(e: {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
}): WorkspaceDoc {
  const p = e.properties ?? {};
  return {
    id: e.id,
    title: String(p.title ?? "Sin título"),
    description: String(p.description ?? ""),
    icon: String(p.icon ?? "📁"),
    userId: String(p.userId ?? ""),
    createdAt: e.createdAt ?? new Date().toISOString(),
  };
}

export function useWorkspaces() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: QUERY_VARS,
    fetchPolicy: "cache-and-network",
  });

  const [createMutation] = useMutation(CREATE_ENTITY, {
    client: entityClient,
    refetchQueries: [{ query: GET_ENTITIES, variables: QUERY_VARS }],
  });

  const [updateMutation] = useMutation(UPDATE_ENTITY, {
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

  const [deleteMutation] = useMutation(DELETE_ENTITY, {
    client: entityClient,
    update(cache, _result, { variables }) {
      if (variables?.id) {
        cache.evict({ id: cache.identify({ __typename: "EntityGQL", id: variables.id }) });
        cache.gc();
      }
    },
  });

  const workspaces: WorkspaceDoc[] = useMemo(() => {
    const items = data?.entities?.items ?? [];
    const mapped = (items as Array<{ id: string; properties: Record<string, unknown>; createdAt: string | null }>)
      .map(entityToWorkspace);
    if (!userId) return mapped;
    return mapped
      .filter((w) => !w.userId || w.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [data, userId]);

  const createWorkspace = useCallback(
    async (input: { title: string; icon: string; description?: string }): Promise<WorkspaceDoc | null> => {
      if (!userId) return null;
      try {
        const { data: res } = await createMutation({
          variables: {
            input: {
              entityType: ENTITY_TYPE,
              properties: {
                title: input.title,
                description: input.description ?? "",
                icon: input.icon,
                userId,
              },
            },
          },
        });
        return res?.createEntity ? entityToWorkspace(res.createEntity) : null;
      } catch { return null; }
    },
    [userId, createMutation]
  );

  const updateWorkspace = useCallback(
    async (id: string, props: Partial<WorkspaceDoc>) => {
      try { await updateMutation({ variables: { id, input: { properties: props } } }); }
      catch {/* silent */}
    },
    [updateMutation]
  );

  const deleteWorkspace = useCallback(
    async (id: string) => {
      try { await deleteMutation({ variables: { id } }); }
      catch {/* silent */}
    },
    [deleteMutation]
  );

  return { workspaces, loading, createWorkspace, updateWorkspace, deleteWorkspace, refetch };
}

// Hook for a single workspace by id
export function useWorkspace(id: string | null) {
  const { workspaces, loading } = useWorkspaces();
  const workspace = useMemo(
    () => (id ? workspaces.find((w) => w.id === id) ?? null : null),
    [workspaces, id]
  );
  return { workspace, loading };
}

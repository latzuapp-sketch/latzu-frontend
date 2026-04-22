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
import type { WorkspacePage, PageType } from "@/types/workspace";
import { PAGE_TYPE_META } from "@/types/workspace";

const ENTITY_TYPE = "WorkspacePage";
const QUERY_VARS = { entityType: ENTITY_TYPE, skip: 0, limit: 500 };

function entityToPage(e: {
  id: string;
  properties: Record<string, unknown>;
  createdAt: string | null;
}): WorkspacePage {
  const p = e.properties ?? {};
  return {
    id: e.id,
    workspaceId: String(p.workspaceId ?? ""),
    parentId: p.parentId ? String(p.parentId) : null,
    title: String(p.title ?? "Sin título"),
    icon: String(p.icon ?? "📄"),
    pageType: (p.pageType as PageType) ?? "page",
    content: String(p.content ?? ""),
    mediaUrl: p.mediaUrl ? String(p.mediaUrl) : null,
    order: Number(p.order ?? 0),
    userId: String(p.userId ?? ""),
    createdAt: e.createdAt ?? new Date().toISOString(),
  };
}

export function useWorkspacePages(workspaceId: string | null) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_ENTITIES, {
    client: entityClient,
    variables: QUERY_VARS,
    fetchPolicy: "cache-and-network",
    skip: !workspaceId,
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

  const pages: WorkspacePage[] = useMemo(() => {
    if (!workspaceId) return [];
    const items = data?.entities?.items ?? [];
    return (items as Array<{ id: string; properties: Record<string, unknown>; createdAt: string | null }>)
      .map(entityToPage)
      .filter((p) => p.workspaceId === workspaceId);
  }, [data, workspaceId]);

  const createPage = useCallback(
    async (input: {
      parentId: string | null;
      pageType: PageType;
      title?: string;
    }): Promise<WorkspacePage | null> => {
      if (!workspaceId || !userId) return null;
      const meta = PAGE_TYPE_META[input.pageType];
      try {
        const { data: res } = await createMutation({
          variables: {
            input: {
              entityType: ENTITY_TYPE,
              properties: {
                workspaceId,
                parentId: input.parentId ?? null,
                title: input.title ?? `Nueva ${meta.label.toLowerCase()}`,
                icon: meta.emoji,
                pageType: input.pageType,
                content: "",
                mediaUrl: null,
                order: Date.now(),
                userId,
              },
            },
          },
        });
        return res?.createEntity ? entityToPage(res.createEntity) : null;
      } catch { return null; }
    },
    [workspaceId, userId, createMutation]
  );

  const updatePage = useCallback(
    async (id: string, props: Partial<WorkspacePage>) => {
      try { await updateMutation({ variables: { id, input: { properties: props } } }); }
      catch {/* silent */}
    },
    [updateMutation]
  );

  const deletePage = useCallback(
    async (id: string) => {
      try { await deleteMutation({ variables: { id } }); }
      catch {/* silent */}
    },
    [deleteMutation]
  );

  return { pages, loading, createPage, updatePage, deletePage, refetch };
}

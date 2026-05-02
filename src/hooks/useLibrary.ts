"use client";

/**
 * useLibrary — Hooks for the Biblioteca (knowledge node browser).
 *
 * Connects to the AI Service (port 8001) via Apollo Client.
 * All queries and mutations operate on KnowledgeNodes stored in Neo4j.
 */

import { useCallback, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  DELETE_KNOWLEDGE_NODE,
  GET_KNOWLEDGE_FILTERS,
  GET_KNOWLEDGE_NODE,
  GET_KNOWLEDGE_NODES,
  GET_KNOWLEDGE_STATS,
  GET_LIBRARY_BOOKS,
  UPDATE_KNOWLEDGE_NODE,
} from "@/graphql/ai/operations";
import type {
  KnowledgeFilters,
  KnowledgeNode,
  KnowledgeNodeDetail,
  KnowledgeNodeList,
  KnowledgeStats,
  LibraryBookAPI,
} from "@/graphql/types";
import type { LibraryBook } from "@/types/library";

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface LibraryFilters {
  search?: string;
  nodeType?: string;
  sourceRef?: string;
  autoCategory?: string;
  autoDomain?: string;
  autoTag?: string;
  skip?: number;
  limit?: number;
}

// ─── useLibraryBooks ──────────────────────────────────────────────────────────

function toLibraryBook(b: LibraryBookAPI): LibraryBook {
  return {
    id: b.bookId,
    title: b.title,
    author: b.author,
    year: b.year,
    category: b.category as LibraryBook["category"],
    coverGradient: b.coverGradient,
    pages: b.pages,
    readMinutes: b.readMinutes,
    summary: b.summary,
    overview: b.overview,
    tags: b.tags,
    insights: b.insights,
    chapters: b.chapters,
    analysis: b.analysis,
    critiques: b.critiques,
    exercises: b.exercises,
    aiContext: b.aiContext,
  };
}

export function useLibraryBooks(filters: { category?: string; search?: string } = {}) {
  const { category, search } = filters;

  const { data, loading, error, refetch } = useQuery<{ libraryBooks: LibraryBookAPI[] }>(
    GET_LIBRARY_BOOKS,
    {
      client: aiClient,
      variables: {
        category: category || null,
        search: search || null,
        limit: 200,
      },
      fetchPolicy: "cache-and-network",
    }
  );

  const books: LibraryBook[] = (data?.libraryBooks ?? []).map(toLibraryBook);

  return { books, loading, error: error?.message ?? null, refetch };
}

// ─── useKnowledgeNodes ────────────────────────────────────────────────────────

export function useKnowledgeNodes(filters: LibraryFilters = {}) {
  const {
    search, nodeType, sourceRef,
    autoCategory, autoDomain, autoTag,
    skip = 0, limit = 60,
  } = filters;
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    knowledgeNodes: KnowledgeNodeList;
  }>(GET_KNOWLEDGE_NODES, {
    client: aiClient,
    variables: {
      search: search || null,
      nodeType: nodeType || null,
      sourceRef: sourceRef || null,
      userId,
      autoCategory: autoCategory || null,
      autoDomain: autoDomain || null,
      autoTag: autoTag || null,
      skip,
      limit,
    },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });

  const nodes: KnowledgeNode[] = data?.knowledgeNodes?.items ?? [];
  const total: number = data?.knowledgeNodes?.total ?? 0;

  return {
    nodes,
    total,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useKnowledgeFilters ──────────────────────────────────────────────────────

/**
 * Aggregated chip-row filters for /brain. Returns categories, domains,
 * difficulties and top tags with counts, computed across the user's nodes.
 */
export function useKnowledgeFilters(opts: { nodeType?: string } = {}) {
  const { nodeType } = opts;
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery<{
    knowledgeFilters: KnowledgeFilters;
  }>(GET_KNOWLEDGE_FILTERS, {
    client: aiClient,
    variables: { userId, nodeType: nodeType || null },
    fetchPolicy: "cache-and-network",
    pollInterval: 5 * 60 * 1000, // refresh every 5 min as classifier ticks
  });

  const empty: KnowledgeFilters = {
    categories: [],
    domains: [],
    difficulties: [],
    topTags: [],
    classified: 0,
    unclassified: 0,
  };

  return {
    filters: data?.knowledgeFilters ?? empty,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useKnowledgeNodeDetail ───────────────────────────────────────────────────

export function useKnowledgeNodeDetail(id: string | null) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error } = useQuery<{
    knowledgeNode: KnowledgeNodeDetail;
  }>(GET_KNOWLEDGE_NODE, {
    client: aiClient,
    variables: { id, userId },
    skip: !id,
    fetchPolicy: "cache-and-network",
  });

  return {
    node: data?.knowledgeNode ?? null,
    loading,
    error: error?.message ?? null,
  };
}

// ─── useKnowledgeStats ────────────────────────────────────────────────────────

export function useKnowledgeStats() {
  const { data, loading, error, refetch } = useQuery<{
    knowledgeStats: KnowledgeStats;
  }>(GET_KNOWLEDGE_STATS, {
    client: aiClient,
    fetchPolicy: "cache-and-network",
  });

  return {
    stats: data?.knowledgeStats ?? null,
    loading,
    error: error?.message ?? null,
    refetch,
  };
}

// ─── useDeleteKnowledgeNode ───────────────────────────────────────────────────

export function useDeleteKnowledgeNode() {
  const [deleteMutation, { loading }] = useMutation(DELETE_KNOWLEDGE_NODE, {
    client: aiClient,
    refetchQueries: [GET_KNOWLEDGE_NODES, GET_KNOWLEDGE_STATS],
  });

  const deleteNode = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { data } = await deleteMutation({ variables: { id } });
        return data?.deleteKnowledgeNode?.success ?? false;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  return { deleteNode, loading };
}

// ─── useUpdateKnowledgeNode ───────────────────────────────────────────────────

export function useUpdateKnowledgeNode() {
  const [error, setError] = useState<string | null>(null);

  const [updateMutation, { loading }] = useMutation(UPDATE_KNOWLEDGE_NODE, {
    client: aiClient,
    refetchQueries: [GET_KNOWLEDGE_NODES],
  });

  const updateNode = useCallback(
    async (
      id: string,
      input: { name?: string; content?: string }
    ): Promise<KnowledgeNode | null> => {
      setError(null);
      try {
        const { data } = await updateMutation({ variables: { id, input } });
        return data?.updateKnowledgeNode ?? null;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
        return null;
      }
    },
    [updateMutation]
  );

  return { updateNode, loading, error };
}

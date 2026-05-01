"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLazyQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { useIsGuest, useUserStore } from "@/stores/userStore";
import { aiClient } from "@/lib/apollo";
import { GLOBAL_SEARCH } from "@/graphql/ai/operations";
import type { SearchResultItem } from "@/graphql/types";

const RECENT_KEY = "latzu:recent_items";
const MAX_RECENT = 8;

export interface RecentItem {
  id: string;
  title: string;
  url: string;
  resultType: string;
  visitedAt: string;
}

function loadRecent(): RecentItem[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(items: RecentItem[]): void {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable (SSR or storage full)
  }
}

export function useGlobalSearch() {
  const { data: session } = useSession();
  const isGuest = useIsGuest();
  const guestId = useUserStore((s) => s.guestId);
  const userId = isGuest ? (guestId ?? "") : (session?.user?.id ?? "");

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [runSearch, { loading }] = useLazyQuery(GLOBAL_SEARCH, {
    client: aiClient,
    fetchPolicy: "network-only",
    onCompleted: (data) => setResults(data?.globalSearch ?? []),
  });

  useEffect(() => {
    setRecentItems(loadRecent());
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      if (userId) {
        runSearch({ variables: { userId, query: query.trim(), limit: 12 } });
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userId, runSearch]);

  const addRecent = useCallback((item: SearchResultItem) => {
    setRecentItems((prev) => {
      const filtered = prev.filter((r) => r.id !== item.id).slice(0, MAX_RECENT - 1);
      const next: RecentItem[] = [
        { id: item.id, title: item.title, url: item.url, resultType: item.resultType, visitedAt: new Date().toISOString() },
        ...filtered,
      ];
      saveRecent(next);
      return next;
    });
  }, []);

  const clearQuery = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return { query, setQuery, results, loading, recentItems, addRecent, clearQuery };
}

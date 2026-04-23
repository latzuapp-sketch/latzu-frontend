"use client";

import { useCallback } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  GET_DECKS, GET_DECK_CARDS, GET_DUE_CARDS, GET_DUE_COUNT,
  GET_ALL_NOTES, CREATE_DECK, DELETE_DECK, CREATE_FLASHCARD,
  DELETE_FLASHCARD, REVIEW_CARD, GENERATE_FLASHCARDS_FROM_NODE,
  UPDATE_NOTE,
} from "@/graphql/ai/operations";
import type { Deck, Flashcard } from "@/types/flashcards";
import type { ReviewQuality } from "@/lib/sm2";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDeck(r: Record<string, unknown>): Deck {
  return {
    id: String(r.id ?? ""),
    userId: String(r.userId ?? ""),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    color: String(r.color ?? "teal"),
    createdAt: String(r.createdAt ?? ""),
    cardCount: Number(r.cardCount ?? 0),
    dueCount: Number(r.dueCount ?? 0),
    newCount: Number(r.newCount ?? 0),
  };
}

function toCard(r: Record<string, unknown>): Flashcard {
  return {
    id: String(r.id ?? ""),
    deckId: String(r.deckId ?? ""),
    front: String(r.front ?? ""),
    back: String(r.back ?? ""),
    easeFactor: Number(r.easeFactor ?? 2.5),
    reps: Number(r.reps ?? 0),
    interval: Number(r.interval ?? 0),
    dueDate: String(r.dueDate ?? ""),
    createdAt: String(r.createdAt ?? ""),
    lastReviewedAt: r.lastReviewedAt ? String(r.lastReviewedAt) : null,
    sourceNodeId: r.sourceNodeId ? String(r.sourceNodeId) : null,
    color: String(r.color ?? "default"),
    pinned: Boolean(r.pinned ?? false),
    archived: Boolean(r.archived ?? false),
    isChecklist: Boolean(r.isChecklist ?? false),
    labels: String(r.labels ?? "[]"),
    updatedAt: r.updatedAt ? String(r.updatedAt) : null,
    deckName: r.deckName ? String(r.deckName) : null,
  };
}

// ─── useDecks ─────────────────────────────────────────────────────────────────

export function useDecks() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_DECKS, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [_createDeck] = useMutation(CREATE_DECK, { client: aiClient });
  const [_deleteDeck] = useMutation(DELETE_DECK, { client: aiClient });

  const decks: Deck[] = (data?.decks ?? []).map(toDeck);

  const createDeck = useCallback(
    async (name: string, description = "", color = "teal") => {
      if (!userId) return null;
      const res = await _createDeck({
        variables: { userId, name, description, color },
        refetchQueries: [{ query: GET_DECKS, variables: { userId } }],
      });
      return res.data?.createDeck ? toDeck(res.data.createDeck) : null;
    },
    [_createDeck, userId]
  );

  const deleteDeck = useCallback(
    async (deckId: string) => {
      if (!userId) return;
      await _deleteDeck({
        variables: { deckId, userId },
        refetchQueries: [{ query: GET_DECKS, variables: { userId } }],
      });
    },
    [_deleteDeck, userId]
  );

  return { decks, loading, refetch, createDeck, deleteDeck };
}

// ─── useDeckCards ─────────────────────────────────────────────────────────────

export function useDeckCards(deckId: string | null) {
  const { data, loading, refetch } = useQuery(GET_DECK_CARDS, {
    client: aiClient,
    variables: { deckId },
    skip: !deckId,
    fetchPolicy: "cache-and-network",
  });

  const [_createCard] = useMutation(CREATE_FLASHCARD, { client: aiClient });
  const [_deleteCard] = useMutation(DELETE_FLASHCARD, { client: aiClient });
  const [_generate] = useMutation(GENERATE_FLASHCARDS_FROM_NODE, { client: aiClient });

  const cards: Flashcard[] = (data?.deckCards ?? []).map(toCard);

  const createCard = useCallback(
    async (front: string, back: string, sourceNodeId?: string) => {
      if (!deckId) return null;
      const res = await _createCard({
        variables: { deckId, front, back, sourceNodeId: sourceNodeId ?? null },
        refetchQueries: [{ query: GET_DECK_CARDS, variables: { deckId } }],
      });
      return res.data?.createFlashcard ? toCard(res.data.createFlashcard) : null;
    },
    [_createCard, deckId]
  );

  const deleteCard = useCallback(
    async (cardId: string) => {
      await _deleteCard({
        variables: { cardId },
        refetchQueries: [{ query: GET_DECK_CARDS, variables: { deckId } }],
      });
    },
    [_deleteCard, deckId]
  );

  const generateFromNode = useCallback(
    async (nodeId: string, count = 5) => {
      if (!deckId) return [];
      const res = await _generate({
        variables: { nodeId, deckId, count },
        refetchQueries: [{ query: GET_DECK_CARDS, variables: { deckId } }],
      });
      return (res.data?.generateFlashcardsFromNode ?? []).map(toCard);
    },
    [_generate, deckId]
  );

  return { cards, loading, refetch, createCard, deleteCard, generateFromNode };
}

// ─── useDueCards ──────────────────────────────────────────────────────────────

export function useDueCards(deckId?: string | null, limit = 20) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_DUE_CARDS, {
    client: aiClient,
    variables: { userId, deckId: deckId ?? null, limit },
    skip: !userId,
    fetchPolicy: "network-only",
  });

  const [_review] = useMutation(REVIEW_CARD, { client: aiClient });

  const dueCards: Flashcard[] = (data?.dueCards ?? []).map(toCard);

  const reviewCard = useCallback(
    async (cardId: string, quality: ReviewQuality): Promise<Flashcard | null> => {
      const res = await _review({ variables: { cardId, quality } });
      return res.data?.reviewCard ? toCard(res.data.reviewCard) : null;
    },
    [_review]
  );

  return { dueCards, loading, refetch, reviewCard };
}

// ─── useAllNotes ──────────────────────────────────────────────────────────────

export interface NoteFilters {
  search?: string;
  includeArchived?: boolean;
  label?: string;
}

export function useAllNotes(filters: NoteFilters = {}) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data, loading, refetch } = useQuery(GET_ALL_NOTES, {
    client: aiClient,
    variables: {
      userId,
      search: filters.search || null,
      includeArchived: filters.includeArchived ?? false,
      label: filters.label || null,
    },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  });

  const [_updateNote] = useMutation(UPDATE_NOTE, { client: aiClient });

  const notes: Flashcard[] = (data?.allNotes ?? []).map(toCard);

  const updateNote = useCallback(
    async (cardId: string, updates: {
      color?: string; pinned?: boolean; archived?: boolean;
      isChecklist?: boolean; front?: string; back?: string; labels?: string;
    }) => {
      const res = await _updateNote({
        variables: { cardId, ...updates },
        update(cache, { data: result }) {
          if (!result?.updateNote) return;
          cache.modify({
            id: cache.identify({ __typename: "FlashcardGQL", id: cardId }),
            fields: Object.fromEntries(
              Object.keys(updates).map((k) => [k, () => (result.updateNote as Record<string, unknown>)[k]])
            ),
          });
        },
      });
      await refetch();
      return res.data?.updateNote ? toCard(res.data.updateNote as Record<string, unknown>) : null;
    },
    [_updateNote, refetch]
  );

  return { notes, loading, refetch, updateNote };
}

// ─── useDueCount ──────────────────────────────────────────────────────────────

export function useDueCount() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const { data } = useQuery(GET_DUE_COUNT, {
    client: aiClient,
    variables: { userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
    pollInterval: 60_000,
  });

  return (data?.dueCardCount?.total as number) ?? 0;
}

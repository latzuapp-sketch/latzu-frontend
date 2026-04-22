"use client";

/**
 * useKnowledge — Knowledge graph hook powered by Apollo Client.
 *
 * Wraps all AI Service operations related to knowledge ingestion:
 *   - extractText:    text passage → KnowledgeNode graph in Neo4j
 *   - processYoutube: YouTube URL → transcript → KnowledgeNode graph in Neo4j
 *   - chatSessions:   list of sessions (proxy for "what's in the knowledge base")
 *
 * Note: There is currently no `knowledgeNodes` query on the AI Service backend.
 * The Knowledge page shows extraction results and chat sessions as a proxy for
 * what has been ingested. See docs/ARCHITECTURE.md — "Known Gaps" section.
 */

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient } from "@/lib/apollo";
import {
  EXTRACT_TEXT,
  PROCESS_YOUTUBE,
  GET_CHAT_SESSIONS,
} from "@/graphql/ai/operations";
import type { ExtractionResult, YouTubeResult, ChatSession } from "@/graphql/types";

// ─── Text extraction ──────────────────────────────────────────────────────────

export interface ExtractTextOptions {
  text: string;
  sourceRef?: string;
  hint?: "narrative" | "informative" | "universal" | null;
}

export function useExtractText() {
  const [lastResult, setLastResult] = useState<ExtractionResult | null>(null);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const [extractMutation, { loading, error, reset }] = useMutation(EXTRACT_TEXT, {
    client: aiClient,
    onCompleted: (data) => {
      setLastResult(data.extractText as ExtractionResult);
    },
  });

  const extract = async (options: ExtractTextOptions) => {
    setLastResult(null);
    const { data } = await extractMutation({
      variables: {
        input: {
          text: options.text,
          sourceRef: options.sourceRef ?? "",
          hint: options.hint ?? null,
          userId,
          visibility: "private",
        },
      },
    });
    return data?.extractText as ExtractionResult | undefined;
  };

  return {
    extract,
    loading,
    error: error ? (error.message ?? "Extraction failed") : null,
    lastResult,
    reset,
  };
}

// ─── YouTube processing ───────────────────────────────────────────────────────

export function useProcessYoutube() {
  const [lastResult, setLastResult] = useState<YouTubeResult | null>(null);
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const [processMutation, { loading, error, reset }] = useMutation(
    PROCESS_YOUTUBE,
    {
      client: aiClient,
      onCompleted: (data) => {
        setLastResult(data.processYoutube as YouTubeResult);
      },
    }
  );

  const process = async (url: string) => {
    setLastResult(null);
    const { data } = await processMutation({
      variables: { url, userId, visibility: "private" },
    });
    return data?.processYoutube as YouTubeResult | undefined;
  };

  return {
    process,
    loading,
    error: error ? (error.message ?? "YouTube processing failed") : null,
    lastResult,
    reset,
  };
}

// ─── Chat sessions (knowledge base proxy) ────────────────────────────────────

export function useChatSessions() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  const { data, loading, error, refetch } = useQuery(GET_CHAT_SESSIONS, {
    client: aiClient,
    variables: { userId },
    fetchPolicy: "cache-and-network",
  });

  const sessions: ChatSession[] = data?.chatSessions ?? [];

  return { sessions, loading, error, refetch };
}

// ─── Combined hook for the Knowledge page ────────────────────────────────────

/**
 * Convenience hook that composes all knowledge operations for use in
 * the Knowledge page. Maintains a local history of extraction results
 * so the page can display what was ingested in the current session.
 */
export function useKnowledge() {
  const [extractionHistory, setExtractionHistory] = useState<
    Array<ExtractionResult & { timestamp: Date; inputPreview: string }>
  >([]);

  const sessions = useChatSessions();
  const textExtractor = useExtractText();
  const youtubeProcessor = useProcessYoutube();

  const extractText = async (options: ExtractTextOptions) => {
    const result = await textExtractor.extract(options);
    if (result) {
      setExtractionHistory((prev) => [
        {
          ...result,
          timestamp: new Date(),
          inputPreview: options.text.slice(0, 100) + (options.text.length > 100 ? "…" : ""),
        },
        ...prev,
      ]);
    }
    return result;
  };

  const processYoutube = async (url: string) => {
    const result = await youtubeProcessor.process(url);
    if (result) {
      setExtractionHistory((prev) => [
        {
          contentType: result.contentType,
          nodesCreated: result.nodesCreated,
          relationshipsCreated: result.relationshipsCreated,
          summary: result.summary,
          sourceRef: `youtube:${result.videoId}`,
          timestamp: new Date(),
          inputPreview: url,
        },
        ...prev,
      ]);
    }
    return result;
  };

  return {
    // Session data (proxy for knowledge base contents)
    sessions: sessions.sessions,
    sessionsLoading: sessions.loading,

    // Text extraction
    extractText,
    extracting: textExtractor.loading,
    extractError: textExtractor.error,

    // YouTube processing
    processYoutube,
    processingYoutube: youtubeProcessor.loading,
    youtubeError: youtubeProcessor.error,
    youtubeResult: youtubeProcessor.lastResult,

    // History of operations performed in this session
    extractionHistory,
  };
}

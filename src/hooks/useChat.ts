"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery, useLazyQuery } from "@apollo/client";
import { useSession } from "next-auth/react";
import { aiClient, entityClient } from "@/lib/apollo";
import {
  CHAT_STREAM,
  GET_CHAT_SESSIONS,
  DELETE_CHAT_SESSION,
  GET_CHAT_HISTORY,
  SEND_MESSAGE,
} from "@/graphql/ai/operations";
import { useChatStore } from "@/stores/chatStore";
import { useUserStore } from "@/stores/userStore";
import { trackChatMessage } from "@/lib/events";
import type { ChatMessage } from "@/types/chat";
import type { AgentAction, ChatStreamEvent, SendMessageResult, ChatSession, RagSource } from "@/graphql/types";

// Tools that modify planning data and should trigger a refetch
const TASK_TOOLS = new Set(["create_task", "create_multiple_tasks", "update_task"]);
// Tools that modify the knowledge graph
const KNOWLEDGE_TOOLS = new Set(["create_knowledge_node"]);

// ~750 chars/s — fast enough to feel alive, slow enough to read
const STREAM_CHARS_PER_TICK = 12;
const STREAM_INTERVAL_MS = 16;

const lastSessionKey = (userId: string) => `latzu_last_session_${userId}`;

interface UseChatOptions {
  sessionId?: string;
  autoFetchSuggestions?: boolean;
}

export function useChat(options: UseChatOptions = {}) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    options.sessionId ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();
  const { profileType, preferences } = useUserStore();

  // Refs for streaming interval management
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingMsgIdRef = useRef<string | null>(null);
  // Prevent auto-loading the last session more than once per mount
  const autoLoadedRef = useRef(false);
  // Map toolName → message id of the pending action card so we can update it on tool_complete
  const pendingActionIds = useRef<Map<string, string>>(new Map());
  // Track which tools triggered data changes (resolved when subscription finishes)
  const toolsUsedRef = useRef<Set<string>>(new Set());

  const {
    messages,
    inputValue,
    isStreaming,
    suggestions,
    addMessage,
    updateMessage,
    clearMessages,
    setInputValue,
    setStreaming,
    dismissSuggestion,
    reset,
  } = useChatStore();

  const userId = (session?.user as { id?: string })?.id ?? null;

  // ─── Apollo: session list (user-scoped) ─────────────────────────────────
  const {
    data: sessionsData,
    loading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery(GET_CHAT_SESSIONS, {
    client: aiClient,
    variables: { userId },
    fetchPolicy: "cache-and-network",
  });

  const sessions: ChatSession[] = sessionsData?.chatSessions ?? [];

  // ─── Apollo: lazy history load ───────────────────────────────────────────
  const [fetchHistory] = useLazyQuery(GET_CHAT_HISTORY, {
    client: aiClient,
    fetchPolicy: "network-only",
  });

  // ─── Apollo: send message (fallback for environments without WebSocket) ──
  const [sendMessageMutation, { loading: isSending }] = useMutation(
    SEND_MESSAGE,
    { client: aiClient }
  );

  // ─── Apollo: delete session ──────────────────────────────────────────────
  const [deleteSessionMutation] = useMutation(DELETE_CHAT_SESSION, {
    client: aiClient,
    onCompleted: () => refetchSessions(),
  });

  // ─── Cleanup interval on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (streamRef.current) clearInterval(streamRef.current);
    };
  }, []);

  // ─── Persist current session ID to localStorage ─────────────────────────
  useEffect(() => {
    if (!userId) return;
    if (currentSessionId) {
      localStorage.setItem(lastSessionKey(userId), currentSessionId);
    }
  }, [currentSessionId, userId]);

  // ─── Simulate streaming of a full reply ─────────────────────────────────
  const startStreaming = useCallback(
    (msgId: string, fullText: string, onDone: () => void) => {
      if (streamRef.current) clearInterval(streamRef.current);
      streamingMsgIdRef.current = msgId;
      let pos = 0;

      streamRef.current = setInterval(() => {
        pos += STREAM_CHARS_PER_TICK;
        const done = pos >= fullText.length;

        updateMessage(msgId, {
          content: done ? fullText : fullText.slice(0, pos),
          isStreaming: !done,
        });

        if (done) {
          clearInterval(streamRef.current!);
          streamRef.current = null;
          streamingMsgIdRef.current = null;
          onDone();
        }
      }, STREAM_INTERVAL_MS);
    },
    [updateMessage]
  );

  // ─── Stop generation (user pressed stop button) ──────────────────────────
  const stopGeneration = useCallback(() => {
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
    if (streamingMsgIdRef.current) {
      updateMessage(streamingMsgIdRef.current, { isStreaming: false });
      streamingMsgIdRef.current = null;
    }
    setStreaming(false);
  }, [updateMessage, setStreaming]);

  // ─── Build user profile for personalisation ──────────────────────────────
  const buildUserProfile = useCallback(() => {
    if (!userId) return null;
    return {
      userId,
      name: session?.user?.name ?? "",
      profileType: profileType ?? "estudiante",
      experience: (session?.user as { experience?: string })?.experience ?? "",
      goals: (session?.user as { goals?: string[] })?.goals ?? [],
      interests: preferences?.focusAreas ?? [],
    };
  }, [userId, session, profileType, preferences]);

  // ─── Send a message via subscription ────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, useRag = true) => {
      if (!content.trim() || isSending || isStreaming) return;
      setError(null);

      addMessage({
        id: crypto.randomUUID(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      });
      setInputValue("");
      setStreaming(true);

      const assistantId = crypto.randomUUID();
      addMessage({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
      });

      pendingActionIds.current.clear();
      toolsUsedRef.current.clear();

      const userProfile = buildUserProfile();

      const input = {
        message: content.trim(),
        sessionId: currentSessionId,
        useRag,
        ...(userProfile && { userProfile }),
      };

      // Try subscription (WebSocket) first; fall back to mutation on error
      try {
        await new Promise<void>((resolve, reject) => {
          const sub = aiClient
            .subscribe<{ chatStream: ChatStreamEvent }>({
              query: CHAT_STREAM,
              variables: { input },
            })
            .subscribe({
              next({ data }) {
                if (!data) return;
                const event = data.chatStream;

                if (event.eventType === "tool_start" && event.toolName) {
                  // Show a pending action card immediately
                  const cardId = crypto.randomUUID();
                  pendingActionIds.current.set(event.toolName, cardId);
                  addMessage({
                    id: cardId,
                    role: "agent_action",
                    content: event.toolName,
                    timestamp: new Date(),
                    metadata: {
                      action: {
                        toolName: event.toolName,
                        args: event.args ?? {},
                        result: {},
                        status: "success",
                      } as AgentAction,
                      isPending: true,
                    },
                  });

                } else if (event.eventType === "tool_complete" && event.toolName) {
                  // Update the pending card with the real result
                  const cardId = pendingActionIds.current.get(event.toolName);
                  if (cardId) {
                    updateMessage(cardId, {
                      metadata: {
                        action: {
                          toolName: event.toolName,
                          args: event.args ?? {},
                          result: event.result ?? {},
                          status: event.status ?? "success",
                        } as AgentAction,
                        isPending: false,
                      },
                    });
                    pendingActionIds.current.delete(event.toolName);
                  }
                  toolsUsedRef.current.add(event.toolName);

                } else if (event.eventType === "reply" && event.reply) {
                  // Stream the final reply text
                  if (event.sessionId && event.sessionId !== currentSessionId) {
                    setCurrentSessionId(event.sessionId);
                  }
                  startStreaming(assistantId, event.reply, () => {
                    updateMessage(assistantId, {
                      metadata: { sources: (event.sources ?? []) as RagSource[] },
                    });
                    setStreaming(false);

                    // Refetch related data
                    const tools = toolsUsedRef.current;
                    if ([...tools].some((t) => TASK_TOOLS.has(t))) {
                      entityClient.refetchQueries({ include: ["GetEntities"] });
                    }
                    if ([...tools].some((t) => KNOWLEDGE_TOOLS.has(t))) {
                      aiClient.refetchQueries({ include: ["GetKnowledgeNodes", "GetKnowledgeStats"] });
                    }

                    refetchSessions();
                    if (event.sessionId) trackChatMessage(content, event.sessionId);
                  });

                } else if (event.eventType === "done") {
                  resolve();
                }
              },
              error(err) {
                reject(err);
              },
              complete() {
                resolve();
              },
            });

          // Expose unsubscribe so stopGeneration can cancel mid-stream
          (streamRef as unknown as { _sub?: { unsubscribe(): void } })._sub = sub;
        });
      } catch (subscriptionErr) {
        // Subscription failed (e.g. WebSocket unavailable) — fall back to mutation
        console.warn("chatStream subscription failed, falling back to mutation:", subscriptionErr);
        try {
          const { data } = await sendMessageMutation({ variables: { input } });
          const result: SendMessageResult = data.sendMessage;

          if (result.sessionId && result.sessionId !== currentSessionId) {
            setCurrentSessionId(result.sessionId);
          }

          if (result.actions && result.actions.length > 0) {
            for (const action of result.actions) {
              addMessage({
                id: crypto.randomUUID(),
                role: "agent_action",
                content: action.toolName,
                timestamp: new Date(),
                metadata: { action: action as AgentAction, isPending: false },
              });
              await new Promise<void>((r) => setTimeout(r, 120));
            }

            if (result.actions.some((a) => TASK_TOOLS.has(a.toolName))) {
              entityClient.refetchQueries({ include: ["GetEntities"] });
            }
            if (result.actions.some((a) => KNOWLEDGE_TOOLS.has(a.toolName))) {
              aiClient.refetchQueries({ include: ["GetKnowledgeNodes", "GetKnowledgeStats"] });
            }
          }

          startStreaming(assistantId, result.reply, () => {
            updateMessage(assistantId, {
              metadata: { sources: result.sources as RagSource[] },
            });
            setStreaming(false);
            refetchSessions();
            trackChatMessage(content, result.sessionId);
          });
        } catch (mutationErr) {
          const msg = mutationErr instanceof Error ? mutationErr.message : "Error al enviar el mensaje";
          setError(msg);
          updateMessage(assistantId, {
            content: "Lo siento, hubo un error al procesar tu mensaje. Inténtalo de nuevo.",
            isStreaming: false,
          });
          setStreaming(false);
        }
      }
    },
    [
      isSending,
      isStreaming,
      currentSessionId,
      sendMessageMutation,
      addMessage,
      updateMessage,
      setInputValue,
      setStreaming,
      startStreaming,
      refetchSessions,
      buildUserProfile,
    ]
  );

  // ─── New session ─────────────────────────────────────────────────────────
  const startNewSession = useCallback(() => {
    stopGeneration();
    setCurrentSessionId(null);
    reset();
    setError(null);
    autoLoadedRef.current = true; // prevent auto-reload after explicit new session
    if (userId) localStorage.removeItem(lastSessionKey(userId));
  }, [reset, stopGeneration, userId]);

  // ─── Load an existing session ────────────────────────────────────────────
  const loadSession = useCallback(
    async (sessionId: string) => {
      if (sessionId === currentSessionId) return;
      stopGeneration();
      setCurrentSessionId(sessionId);
      clearMessages();
      setError(null);

      try {
        const { data } = await fetchHistory({ variables: { sessionId } });
        const msgs: Array<{ role: string; content: string; timestamp: string }> =
          data?.chatHistory?.messages ?? [];
        msgs.forEach((m) =>
          addMessage({
            id: crypto.randomUUID(),
            role: m.role as ChatMessage["role"],
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          })
        );
      } catch (err) {
        console.error("Failed to load session history", err);
      }
    },
    [currentSessionId, clearMessages, fetchHistory, addMessage, stopGeneration]
  );

  // ─── Auto-resume last session on first load ──────────────────────────────
  useEffect(() => {
    if (sessionsLoading || sessions.length === 0 || autoLoadedRef.current || currentSessionId) return;
    autoLoadedRef.current = true;

    const savedId = userId ? localStorage.getItem(lastSessionKey(userId)) : null;
    const targetId =
      savedId && sessions.some((s) => s.sessionId === savedId)
        ? savedId
        : sessions[0].sessionId;

    loadSession(targetId);
  }, [sessionsLoading, sessions, userId, currentSessionId, loadSession]);

  // ─── Delete a session ────────────────────────────────────────────────────
  const deleteSession = useCallback(
    async (sessionId: string) => {
      await deleteSessionMutation({ variables: { sessionId } });
      if (sessionId === currentSessionId) startNewSession();
    },
    [deleteSessionMutation, currentSessionId, startNewSession]
  );

  // ─── Suggestion helpers ──────────────────────────────────────────────────
  const handleSuggestionClick = useCallback(
    (suggestion: { id: string; action?: { prompt?: string } }) => {
      if (suggestion.action?.prompt) sendMessage(suggestion.action.prompt);
      dismissSuggestion(suggestion.id);
    },
    [sendMessage, dismissSuggestion]
  );

  const clearChat = useCallback(() => {
    stopGeneration();
    reset();
    setError(null);
  }, [reset, stopGeneration]);

  return {
    messages,
    sessions,
    currentSessionId,
    inputValue,
    isLoading: isSending,
    isStreaming,
    sessionsLoading,
    suggestions,
    error,
    sendMessage,
    setInputValue,
    startNewSession,
    loadSession,
    deleteSession,
    clearChat,
    handleSuggestionClick,
    dismissSuggestion,
    stopGeneration,
  };
}

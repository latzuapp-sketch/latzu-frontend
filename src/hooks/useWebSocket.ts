"use client";

import { useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { websocket } from "@/lib/websocket";
import { useEventStore } from "@/stores/eventStore";
import { useUserStore } from "@/stores/userStore";
import { useChatStore } from "@/stores/chatStore";
import type { InteractionType } from "@/types/events";
import type { ProactiveSuggestion } from "@/types/chat";

interface FocusSignalPush {
  id: string;
  message: string;
  type: "reminder" | "insight" | "warning" | "milestone" | "suggestion";
  deliverAt: string;
  context?: string;
  relatedNodeIds?: string[];
  actionPayload?: string;
}

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onSuggestion?: (suggestion: ProactiveSuggestion) => void;
  onKnowledgeUpdate?: (data: unknown) => void;
  onAchievement?: (data: { title: string; description: string }) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { data: session, status } = useSession();
  const tenantId = useUserStore((state) => state.tenantId);
  const isConnected = useEventStore((state) => state.isConnected);
  const setSuggestions = useChatStore((state) => state.setSuggestions);

  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Auto-connect when authenticated
  useEffect(() => {
    if (options.autoConnect !== false && status === "authenticated" && session?.user?.id) {
      websocket.connect(session.user.id, tenantId).catch((error) => {
        console.error("WebSocket connection failed:", error);
      });
    }

    return () => {
      // Cleanup subscriptions
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [status, session?.user?.id, tenantId, options.autoConnect]);

  // Subscribe to events
  useEffect(() => {
    if (!isConnected) return;

    // Proactive suggestions
    const unsubSuggestion = websocket.on<ProactiveSuggestion>(
      "proactive_suggestion",
      (suggestion) => {
        if (options.onSuggestion) {
          options.onSuggestion(suggestion);
        } else {
          // Default: add to chat suggestions
          const currentSuggestions = useChatStore.getState().suggestions;
          setSuggestions([suggestion, ...currentSuggestions.slice(0, 4)]);
        }
      }
    );
    unsubscribersRef.current.push(unsubSuggestion);

    // Focus signals (pushed by notification poller)
    const addNotification = useEventStore.getState().addNotification;
    const unsubSignal = websocket.on<FocusSignalPush>("focus_signal", (signal) => {
      addNotification({
        id: signal.id,
        type: "reminder",
        title: signal.type.charAt(0).toUpperCase() + signal.type.slice(1),
        message: signal.message,
        timestamp: new Date(),
        read: false,
      });
    });
    unsubscribersRef.current.push(unsubSignal);

    // Knowledge updates
    if (options.onKnowledgeUpdate) {
      const unsubKnowledge = websocket.on("knowledge_update", options.onKnowledgeUpdate);
      unsubscribersRef.current.push(unsubKnowledge);
    }

    // Achievements
    if (options.onAchievement) {
      const unsubAchievement = websocket.on<{ title: string; description: string }>(
        "achievement",
        options.onAchievement
      );
      unsubscribersRef.current.push(unsubAchievement);
    }

    return () => {
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [isConnected, options, setSuggestions]);

  // Emit interaction event
  const trackInteraction = useCallback(
    (
      interactionType: InteractionType,
      content: string,
      metadata?: Record<string, unknown>
    ) => {
      if (!session?.user?.id) return;

      websocket.emitInteraction({
        eventType: "user_interaction",
        source: "user",
        interactionType,
        content,
        tenantId,
        userId: session.user.id,
        metadata,
      });
    },
    [session?.user?.id, tenantId]
  );

  // Track page view
  const trackPageView = useCallback(
    (pagePath: string) => {
      trackInteraction("navigation", pagePath, {
        timestamp: new Date().toISOString(),
      });
    },
    [trackInteraction]
  );

  // Track chat message
  const trackChatMessage = useCallback(
    (message: string, sessionId: string) => {
      trackInteraction("chat_message", message, { sessionId });
    },
    [trackInteraction]
  );

  // Track concept exploration
  const trackConceptExploration = useCallback(
    (conceptId: string, conceptName: string) => {
      trackInteraction("concept_exploration", conceptName, { conceptId });
    },
    [trackInteraction]
  );

  // Track feedback
  const trackFeedback = useCallback(
    (targetId: string, isPositive: boolean, comment?: string) => {
      trackInteraction("feedback_given", comment || (isPositive ? "positive" : "negative"), {
        targetId,
        isPositive,
      });
    },
    [trackInteraction]
  );

  return {
    isConnected,
    connect: websocket.connect.bind(websocket),
    disconnect: websocket.disconnect.bind(websocket),
    trackInteraction,
    trackPageView,
    trackChatMessage,
    trackConceptExploration,
    trackFeedback,
  };
}

// Hook for page view tracking
export function usePageTracking(pagePath: string) {
  const { trackPageView, isConnected } = useWebSocket({ autoConnect: true });

  useEffect(() => {
    if (isConnected) {
      trackPageView(pagePath);
    }
  }, [isConnected, pagePath, trackPageView]);
}


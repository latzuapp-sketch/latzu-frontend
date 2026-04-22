// WebSocket client for real-time events
import { io, Socket } from "socket.io-client";
import { useEventStore } from "@/stores/eventStore";
import type { UserInteractionEvent, ServerPushEvent } from "@/types/events";

const WS_URL = "https://latzu-api-610441107033.us-central1.run.app";

type EventHandler<T = unknown> = (data: T) => void;

class LatzuWebSocket {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private tenantId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();

  connect(userId: string, tenantId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.userId = userId;
      this.tenantId = tenantId;

      this.socket = io(WS_URL, {
        auth: { userId, tenantId },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[WS] Connected");
        this.reconnectAttempts = 0;
        useEventStore.getState().setConnected(true);
        this.flushEventQueue();
        resolve();
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[WS] Disconnected:", reason);
        useEventStore.getState().setConnected(false);
      });

      this.socket.on("connect_error", (error) => {
        console.error("[WS] Connection error:", error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(new Error("Failed to connect after max attempts"));
        }
      });

      // Server-initiated events
      this.socket.on("proactive_suggestion", (data) => {
        this.handleServerEvent({ type: "proactive_suggestion", data, timestamp: new Date() });
      });

      this.socket.on("knowledge_update", (data) => {
        this.handleServerEvent({ type: "knowledge_update", data, timestamp: new Date() });
      });

      this.socket.on("lesson_unlocked", (data) => {
        this.handleServerEvent({ type: "lesson_unlocked", data, timestamp: new Date() });
      });

      this.socket.on("achievement", (data) => {
        this.handleServerEvent({ type: "achievement", data, timestamp: new Date() });
      });

      this.socket.on("notification", (data) => {
        this.handleServerEvent({ type: "notification", data, timestamp: new Date() });
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      useEventStore.getState().setConnected(false);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Emit user interaction event
  emitInteraction(event: Omit<UserInteractionEvent, "eventId" | "timestamp" | "schemaVersion">): void {
    const fullEvent: UserInteractionEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      timestamp: new Date(),
      schemaVersion: "1.0",
      tenantId: this.tenantId || event.tenantId,
      userId: this.userId || event.userId,
    };

    if (this.socket?.connected) {
      this.socket.emit("user_interaction", fullEvent);
      useEventStore.getState().markEventSent(fullEvent.eventId);
    } else {
      // Queue for later
      useEventStore.getState().queueEvent(fullEvent);
    }
  }

  // Subscribe to specific event types
  on<T = unknown>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  // Handle server push events
  private handleServerEvent(event: ServerPushEvent): void {
    console.log("[WS] Server event:", event.type, event.data);

    // Notify subscribers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event.data));
    }

    // Add to notifications if applicable
    if (event.type === "notification" || event.type === "achievement") {
      const eventData = event.data as { title?: string; message?: string; action?: { label: string; href: string } };
      useEventStore.getState().addNotification({
        id: crypto.randomUUID(),
        type: event.type === "achievement" ? "achievement" : "system",
        title: eventData.title || "Notification",
        message: eventData.message || "",
        timestamp: event.timestamp,
        read: false,
        action: eventData.action,
      });
    }
  }

  // Flush queued events when reconnected
  private async flushEventQueue(): Promise<void> {
    const store = useEventStore.getState();
    const pendingEvents = store.eventQueue.filter((item) => item.status === "pending");

    for (const item of pendingEvents) {
      if (this.socket?.connected) {
        this.socket.emit("user_interaction", item.event);
        store.markEventSent(item.id);
      }
    }

    store.clearQueue();
  }
}

// Singleton instance
export const websocket = new LatzuWebSocket();

// React hook for WebSocket
export function useWebSocketConnection() {
  const isConnected = useEventStore((state) => state.isConnected);

  return {
    isConnected,
    connect: websocket.connect.bind(websocket),
    disconnect: websocket.disconnect.bind(websocket),
    emit: websocket.emitInteraction.bind(websocket),
    on: websocket.on.bind(websocket),
  };
}

export default websocket;




"use client";

import { useSearchParams } from "next/navigation";
import { ChatContainer } from "@/components/chat/ChatContainer";

/**
 * /brain/chat — full-page chat. Optional `?session=<id>` resumes a session;
 * otherwise the ChatContainer creates a fresh one on the first message.
 */
export default function BrainChatPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session") ?? undefined;

  return (
    <div className="h-screen overflow-hidden bg-background">
      <ChatContainer key={sessionId ?? "new"} sessionId={sessionId} className="h-full" />
    </div>
  );
}

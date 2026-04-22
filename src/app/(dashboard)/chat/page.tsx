"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";
import { Card } from "@/components/ui/card";

export default function ChatPage() {
  return (
    <div className="h-[calc(100dvh-7rem)] md:h-[calc(100dvh-8rem)]">
      <Card className="h-full glass overflow-hidden">
        <ChatContainer className="h-full" />
      </Card>
    </div>
  );
}




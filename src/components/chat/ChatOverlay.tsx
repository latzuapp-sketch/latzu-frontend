"use client";

/**
 * ChatOverlay — invocable chat side-panel.
 *
 * Opens with Cmd+J / Ctrl+J from anywhere in the dashboard, renders the same
 * ChatContainer in a right-side Sheet so the user doesn't lose page context.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatContainer } from "@/components/chat/ChatContainer";

export function ChatOverlay() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  if (!userId) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="p-0 w-full sm:max-w-md md:max-w-lg lg:max-w-xl flex flex-col gap-0 [&>button]:hidden"
      >
        <ChatContainer className="border-0 rounded-none h-full" />
      </SheetContent>
    </Sheet>
  );
}

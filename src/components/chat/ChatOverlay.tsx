"use client";

/**
 * ChatOverlay — invocable chat side-panel.
 *
 * Opens with Cmd+J / Ctrl+J from anywhere in the dashboard. On desktop it slides
 * in from the right and pushes the page content (mirroring the sidebar pattern);
 * on mobile it falls back to a Sheet so it can take the full screen.
 */

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

export const CHAT_OVERLAY_WIDTH = 480;

interface ChatOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMobile: boolean;
}

export function ChatOverlay({ open, onOpenChange, isMobile }: ChatOverlayProps) {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!userId) return null;

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="p-0 w-full flex flex-col gap-0 [&>button]:hidden"
        >
          <ChatContainer className="border-0 rounded-none h-full" />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="chat-overlay"
          initial={{ x: CHAT_OVERLAY_WIDTH }}
          animate={{ x: 0 }}
          exit={{ x: CHAT_OVERLAY_WIDTH }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{ width: CHAT_OVERLAY_WIDTH }}
          className="fixed right-0 top-0 z-40 h-screen bg-background border-l border-border flex flex-col"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute top-3 right-3 z-10 h-8 w-8"
            aria-label="Cerrar chat"
          >
            <X className="w-4 h-4" />
          </Button>
          <ChatContainer className="border-0 rounded-none h-full" />
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

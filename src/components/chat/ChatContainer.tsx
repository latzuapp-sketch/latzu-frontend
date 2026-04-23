"use client";

import { useEffect, useRef, useState, useCallback, memo } from "react";
import { useSession } from "next-auth/react";
import { useIsGuest } from "@/stores/userStore";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MessageBubble } from "./MessageBubble";
import { useChat } from "@/hooks/useChat";
import { useUserStore } from "@/stores/userStore";
import { getTemplate } from "@/config/templates";
import {
  Send, Square, Sparkles, Plus, ChevronDown,
  PanelLeftClose, PanelLeftOpen, Trash2, MessageSquare,
  Loader2, Paperclip, Link2, X, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/graphql/types";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ChatContainerProps {
  sessionId?: string;
  className?: string;
}

// ─── SessionItem ──────────────────────────────────────────────────────────────

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionItem = memo(function SessionItem({
  session,
  isActive,
  onSelect,
  onDelete,
}: SessionItemProps) {
  const [hovered, setHovered] = useState(false);

  const timeAgo = (iso: string | null): string => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ahora";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  return (
    <div
      className={cn(
        "group relative flex items-start gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
        isActive
          ? "bg-primary/10 text-foreground"
          : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
      )}
      onClick={() => onSelect(session.sessionId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MessageSquare className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium text-xs leading-tight">{session.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {timeAgo(session.updatedAt)} · {session.messageCount} msg
        </p>
      </div>
      {hovered && (
        <button
          className="flex-shrink-0 p-0.5 rounded hover:text-destructive transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(session.sessionId);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

// ─── Attachment types ─────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  type: "image" | "pdf" | "link";
  name: string;
  preview?: string;   // blob URL for images
  data: string;       // base64 data-URI or URL
  mimeType?: string;
}

async function fileToAttachment(file: File): Promise<Attachment | null> {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  if (!isImage && !isPdf) return null;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      resolve({
        id: crypto.randomUUID(),
        type: isImage ? "image" : "pdf",
        name: file.name,
        preview: isImage ? dataUri : undefined,
        data: dataUri,
        mimeType: file.type,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

// ─── ChatContainer ────────────────────────────────────────────────────────────

export function ChatContainer({ sessionId, className }: ChatContainerProps) {
  const { data: authSession } = useSession();
  const isGuest = useIsGuest();
  const profileType = useUserStore((state) => state.profileType);

  const userName = isGuest ? "Invitado" : authSession?.user?.name;
  const userImage = isGuest ? undefined : authSession?.user?.image;

  const {
    messages,
    sessions,
    currentSessionId,
    isStreaming,
    sessionsLoading,
    inputValue,
    error,
    sendMessage,
    setInputValue,
    startNewSession,
    loadSession,
    deleteSession,
    stopGeneration,
  } = useChat({ sessionId });

  const template = getTemplate(profileType ?? undefined);

  // Detect if the last message is an agent_action (used for status label)
  const lastMessageRole = messages[messages.length - 1]?.role;
  const isExecutingTools = isStreaming && lastMessageRole === "agent_action";

  // ─── Attachments ────────────────────────────────────────────────────────
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkInputOpen, setLinkInputOpen] = useState(false);
  const [linkDraft, setLinkDraft] = useState("");

  // ─── Layout state ────────────────────────────────────────────────────────
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── Scroll state ────────────────────────────────────────────────────────
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Track whether user is near the bottom
  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }, []);

  // Auto-scroll when new content arrives (only if already at bottom)
  useEffect(() => {
    if (atBottom) scrollToBottom();
  }, [messages, atBottom, scrollToBottom]);

  // ─── Input auto-resize ───────────────────────────────────────────────────
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [inputValue]);

  // Re-focus input after streaming completes
  useEffect(() => {
    if (!isStreaming) inputRef.current?.focus();
  }, [isStreaming]);

  // Focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ─── Attachment handlers ────────────────────────────────────────────────
  const addLinkAttachment = () => {
    const url = linkDraft.trim();
    if (!url) return;
    const isYt = url.includes("youtube.com") || url.includes("youtu.be");
    setAttachments((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "link", name: isYt ? "YouTube" : new URL(url.startsWith("http") ? url : `https://${url}`).hostname, data: url.startsWith("http") ? url : `https://${url}` },
    ]);
    setLinkDraft("");
    setLinkInputOpen(false);
  };

  const removeAttachment = (id: string) => setAttachments((prev) => prev.filter((a) => a.id !== id));

  // ─── Submit handler ──────────────────────────────────────────────────────
  const doSend = () => {
    if (!inputValue.trim() && !attachments.length) return;
    sendMessage(inputValue, true, attachments.map((a) => ({ type: a.type, data: a.data, mimeType: a.mimeType, name: a.name })));
    setAttachments([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSend();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  };

  // ─── Personality label ───────────────────────────────────────────────────
  const personalityLabel =
    template.chatPersonality === "tutor"
      ? "Tutor IA"
      : template.chatPersonality === "mentor"
      ? "Mentor IA"
      : template.chatPersonality === "advisor"
      ? "Asesor IA"
      : "Asistente IA";

  return (
    <div className={cn("flex h-full overflow-hidden rounded-xl border border-border/50 bg-background", className)}>
      {/* ── Sidebar: Sheet en mobile, panel inline en desktop ──────────── */}

      {/* Mobile: Sheet drawer */}
      <Sheet open={isMobile && sidebarOpen} onOpenChange={(open) => !open && setSidebarOpen(false)}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chats</span>
            <Button size="icon" variant="ghost" className="w-7 h-7" onClick={() => { startNewSession(); setSidebarOpen(false); }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {sessionsLoading && <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>}
            {!sessionsLoading && sessions.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-6">Sin conversaciones</p>}
            {sessions.map((s) => (
              <SessionItem key={s.sessionId} session={s} isActive={s.sessionId === currentSessionId}
                onSelect={(id) => { loadSession(id); setSidebarOpen(false); }}
                onDelete={deleteSession} />
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop: inline panel */}
      <AnimatePresence initial={false}>
        {!isMobile && sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex-shrink-0 border-r border-border/50 flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chats</span>
              <Button size="icon" variant="ghost" className="w-7 h-7" onClick={startNewSession} title="Nuevo chat">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
              {sessionsLoading && <div className="flex items-center justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>}
              {!sessionsLoading && sessions.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-6">Sin conversaciones</p>}
              {sessions.map((s) => (
                <SessionItem key={s.sessionId} session={s} isActive={s.sessionId === currentSessionId}
                  onSelect={loadSession} onDelete={deleteSession} />
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat area ──────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex-shrink-0"
            onClick={() => setSidebarOpen((v) => !v)}
            title={sidebarOpen ? "Cerrar panel" : "Abrir panel"}
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>

          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm leading-tight">{personalityLabel}</h2>
            <p className="text-[11px] text-muted-foreground">
              {isExecutingTools ? "Ejecutando acciones..." : isStreaming ? "Escribiendo..." : "En línea"}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 flex-shrink-0"
            onClick={startNewSession}
            title="Nuevo chat"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 relative"
        >
          {/* Welcome screen */}
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-semibold mb-1">
                ¡Hola! Soy tu {template.chatPersonality === "tutor" ? "tutor" :
                  template.chatPersonality === "mentor" ? "mentor" :
                  template.chatPersonality === "advisor" ? "asesor" : "asistente"}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {template.welcomeMessage}
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-2 justify-center w-full max-w-sm">
                {["¿Qué puedo aprender hoy?", "Crea un plan de estudio para Python", "Organiza mis tareas de esta semana"].map(
                  (prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="text-xs px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors text-muted-foreground hover:text-foreground text-left sm:text-center"
                    >
                      {prompt}
                    </button>
                  )
                )}
              </div>
            </motion.div>
          )}

          {/* Message list */}
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                userImage={userImage ?? undefined}
                userName={userName ?? undefined}
              />
            ))}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-xs text-destructive py-2"
            >
              {error}
            </motion.p>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Scroll-to-bottom FAB */}
        <AnimatePresence>
          {!atBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-20 right-6 z-10"
            >
              <Button
                size="icon"
                variant="secondary"
                className="w-8 h-8 rounded-full shadow-md"
                onClick={() => {
                  setAtBottom(true);
                  scrollToBottom();
                }}
              >
                <ChevronDown className="w-4 h-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="flex-shrink-0 border-t border-border/50 p-3 space-y-2">

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div key={att.id} className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg bg-muted/40 border border-border/40 text-xs max-w-[180px]">
                  {att.type === "image" && att.preview
                    ? <img src={att.preview} alt={att.name} className="w-5 h-5 rounded object-cover flex-shrink-0" />
                    : att.type === "pdf"
                    ? <FileText className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    : <Link2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                  <span className="truncate text-muted-foreground">{att.name}</span>
                  <button type="button" onClick={() => removeAttachment(att.id)} className="flex-shrink-0 text-muted-foreground/50 hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Link input */}
          {linkInputOpen && (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLinkAttachment(); } if (e.key === "Escape") setLinkInputOpen(false); }}
                placeholder="https://... o youtube.com/watch?v=..."
                className="flex-1 rounded-lg border border-border/50 bg-muted/30 px-3 py-1.5 text-sm outline-none focus:border-primary/40"
              />
              <Button type="button" size="sm" onClick={addLinkAttachment} disabled={!linkDraft.trim()} className="h-8 text-xs">Adjuntar</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setLinkInputOpen(false)} className="h-8 text-xs">Cancelar</Button>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Attach buttons */}
            <div className="flex items-center gap-1 flex-shrink-0 pb-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files ?? []);
                  const results = await Promise.all(files.map(fileToAttachment));
                  setAttachments((prev) => [...prev, ...results.filter(Boolean) as Attachment[]]);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                title="Adjuntar imagen o PDF"
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                title="Adjuntar enlace o YouTube"
                onClick={() => setLinkInputOpen((v) => !v)}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  linkInputOpen ? "text-primary bg-primary/10" : "text-muted-foreground/50 hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={1}
              className={cn(
                "flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2",
                "text-base md:text-sm",
                "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                "min-h-[44px] max-h-[160px] leading-relaxed transition-[height]"
              )}
            />
            {isStreaming ? (
              <Button type="button" size="icon" variant="secondary" className="w-9 h-9 flex-shrink-0 rounded-xl" onClick={stopGeneration} title="Detener">
                <Square className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" className="w-9 h-9 flex-shrink-0 rounded-xl" disabled={!inputValue.trim() && !attachments.length} title="Enviar">
                <Send className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="hidden md:block text-[10px] text-muted-foreground text-center">
            Enter para enviar · Shift+Enter para nueva línea · Adjunta imágenes, PDFs o enlaces
          </p>
        </form>
      </div>
    </div>
  );
}

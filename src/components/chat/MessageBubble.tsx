"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import katexLib from "katex";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ChatMessage } from "@/types/chat";
import type { AgentAction, RagSource } from "@/graphql/types";
import { AgentActionCard } from "./AgentActionCard";
import {
  Brain,
  User,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Database,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { trackFeedback } from "@/lib/events";

interface MessageBubbleProps {
  message: ChatMessage;
  userImage?: string;
  userName?: string;
  isLast?: boolean;
  onSuggestionClick?: (text: string) => void;
}

function MessageBubbleComponent({ message, userImage, userName, isLast, onSuggestionClick }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"positive" | "negative" | null>(null);
  const [showSources, setShowSources] = useState(false);

  // Agent action messages get their own compact card rendering
  if (message.role === "agent_action") {
    const action = message.metadata?.action as AgentAction | undefined;
    if (!action) return null;
    const isPending = message.metadata?.isPending as boolean | undefined;
    return <AgentActionCard action={action} isPending={isPending} />;
  }

  const isUser = message.role === "user";
  const streaming = message.isStreaming ?? false;
  const sources = (message.metadata?.sources ?? []) as RagSource[];
  const quickReplies = (message.metadata?.quickReplies ?? []) as string[];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: "positive" | "negative") => {
    setFeedback(type);
    trackFeedback(
      type === "positive" ? "explicit_positive" : "explicit_negative",
      message.id
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "flex gap-3 max-w-3xl",
        isUser ? "ml-auto flex-row-reverse" : "mr-auto"
      )}
    >
      {/* Avatar */}
      <Avatar className="w-8 h-8 flex-shrink-0 mt-0.5">
        {isUser ? (
          <>
            <AvatarImage src={userImage} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {userName?.[0]?.toUpperCase() ?? <User className="w-4 h-4" />}
            </AvatarFallback>
          </>
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Bubble + extras */}
      <div className={cn("flex flex-col gap-1 min-w-0", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm max-w-lg"
              : "bg-secondary/80 rounded-bl-sm w-full"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
          ) : streaming && !message.content ? (
            /* Typing dots while waiting for first character */
            <TypingDots />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                components={{
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-bold mb-2 mt-3 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold mb-1 mt-2 first:mt-0">{children}</h3>
                  ),
                  code: ({ className, children }) => {
                    const mathStr = String(children).replace(/\n$/, "");
                    if (className?.includes("math-inline")) {
                      try {
                        return <span dangerouslySetInnerHTML={{ __html: katexLib.renderToString(mathStr, { throwOnError: false }) }} />;
                      } catch { return <code>{children}</code>; }
                    }
                    if (className?.includes("math-display")) {
                      try {
                        return <span className="block my-2 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: katexLib.renderToString(mathStr, { displayMode: true, throwOnError: false }) }} />;
                      } catch { return <code>{children}</code>; }
                    }
                    return className ? (
                      <code className="block p-3 rounded-lg bg-muted text-xs font-mono overflow-x-auto">{children}</code>
                    ) : (
                      <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">{children}</code>
                    );
                  },
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-primary/50 pl-3 italic text-muted-foreground my-2">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline hover:no-underline"
                    >
                      {children}
                    </a>
                  ),
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-2">
                      <table className="text-xs border-collapse w-full">{children}</table>
                    </div>
                  ),
                  th: ({ children }) => (
                    <th className="border border-border px-2 py-1 bg-muted font-semibold text-left">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-2 py-1">{children}</td>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
              {/* Blinking cursor while streaming */}
              {streaming && (
                <span className="inline-block w-0.5 h-3.5 bg-current ml-0.5 align-middle animate-pulse" />
              )}
            </div>
          )}
        </div>

        {/* RAG sources */}
        {!isUser && !streaming && sources.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Database className="w-3 h-3" />
              {sources.length} fuente{sources.length !== 1 && "s"} del grafo
              {showSources ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            {showSources && (
              <div className="flex flex-wrap gap-1 mt-1">
                {sources.map((s, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="text-[10px] gap-1 font-normal"
                    title={s.content ?? ""}
                  >
                    <span className="text-muted-foreground">{s.type}</span>
                    <span>{s.name}</span>
                    {s.score !== undefined && (
                      <span className="text-muted-foreground">
                        {Math.round(s.score * 100)}%
                      </span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isUser && !streaming && message.content && (
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={handleCopy}>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-7 h-7", feedback === "positive" && "text-emerald-500")}
              onClick={() => handleFeedback("positive")}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("w-7 h-7", feedback === "negative" && "text-destructive")}
              onClick={() => handleFeedback("negative")}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Quick reply chips — only on last AI message when done streaming */}
        {!isUser && !streaming && isLast && quickReplies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {quickReplies.map((qr) => (
              <button
                key={qr}
                onClick={() => onSuggestionClick?.(qr)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary/50 hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
              >
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);

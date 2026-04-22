"use client";

/**
 * BlockEditor — Notion-style block editor.
 *
 * Each block has two modes:
 *   VIEW  → renders formatted markdown content (headings, bold, code, etc.)
 *   EDIT  → shows a raw text input/textarea (click to enter, blur/Esc to exit)
 *
 * Block types: paragraph, heading_1/2/3, bulleted_list, numbered_list,
 *              todo (checkbox), quote, callout, code, divider.
 *
 * Content stored as JSON (Block[]) in the node's `content` field.
 * Legacy plain text and basic Markdown is auto-converted on first load.
 */

import {
  useState, useRef, useCallback, useEffect, useMemo,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import {
  AlignLeft, Heading1, Heading2, Heading3,
  List, ListOrdered, CheckSquare, Square,
  Minus, Quote, Code, Info,
  GripVertical, Plus, Check, Sparkles, Loader2, Copy,
} from "lucide-react";
import { AskAI } from "./AskAI";

// ─── Types ─────────────────────────────────────────────────────────────────────

export type BlockType =
  | "paragraph"
  | "heading_1" | "heading_2" | "heading_3"
  | "bulleted_list" | "numbered_list" | "todo"
  | "quote" | "code" | "callout" | "divider";

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  icon?: string;
}

// ─── Block config ───────────────────────────────────────────────────────────────

interface BlockMeta {
  label: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  group: "Básico" | "Listas" | "Avanzado";
  keywords: string[];
}

const BLOCK_META: Record<BlockType, BlockMeta> = {
  paragraph:     { label: "Texto",           description: "Párrafo normal",           Icon: AlignLeft,    group: "Básico",   keywords: ["texto", "párrafo", "text", "p"] },
  heading_1:     { label: "Título 1",        description: "Encabezado grande H1",     Icon: Heading1,     group: "Básico",   keywords: ["título", "h1", "heading"] },
  heading_2:     { label: "Título 2",        description: "Encabezado mediano H2",    Icon: Heading2,     group: "Básico",   keywords: ["título", "h2", "heading"] },
  heading_3:     { label: "Título 3",        description: "Encabezado pequeño H3",    Icon: Heading3,     group: "Básico",   keywords: ["título", "h3", "heading"] },
  bulleted_list: { label: "Lista",           description: "Lista con viñetas",        Icon: List,         group: "Listas",   keywords: ["lista", "viñeta", "bullet"] },
  numbered_list: { label: "Lista numerada",  description: "Lista numerada",           Icon: ListOrdered,  group: "Listas",   keywords: ["lista", "numerada", "numbered"] },
  todo:          { label: "Tarea",           description: "Casilla de verificación",  Icon: CheckSquare,  group: "Listas",   keywords: ["tarea", "todo", "check", "task"] },
  quote:         { label: "Cita",            description: "Bloque de cita",           Icon: Quote,        group: "Avanzado", keywords: ["cita", "quote"] },
  callout:       { label: "Destacado",       description: "Nota en caja",             Icon: Info,         group: "Avanzado", keywords: ["nota", "callout", "destacado"] },
  code:          { label: "Código",          description: "Bloque de código",         Icon: Code,         group: "Avanzado", keywords: ["código", "code", "snippet"] },
  divider:       { label: "Divisor",         description: "Línea separadora",         Icon: Minus,        group: "Avanzado", keywords: ["divisor", "línea", "hr"] },
};

const GROUPS: BlockMeta["group"][] = ["Básico", "Listas", "Avanzado"];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function genId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseBlocks(raw: string | null | undefined): Block[] {
  if (!raw?.trim()) return [{ id: genId(), type: "paragraph", content: "" }];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr) && arr.length > 0 && arr[0]?.id && arr[0]?.type) {
      return arr as Block[];
    }
  } catch { /* not JSON */ }

  // Legacy markdown → map common patterns to block types
  return raw.split("\n").map((line): Block => {
    if (/^# (.+)/.test(line))           return { id: genId(), type: "heading_1",     content: line.slice(2) };
    if (/^## (.+)/.test(line))          return { id: genId(), type: "heading_2",     content: line.slice(3) };
    if (/^### (.+)/.test(line))         return { id: genId(), type: "heading_3",     content: line.slice(4) };
    if (/^- \[x\] (.+)/.test(line))    return { id: genId(), type: "todo",           content: line.slice(6),  checked: true };
    if (/^- \[ \] (.+)/.test(line))    return { id: genId(), type: "todo",           content: line.slice(6),  checked: false };
    if (/^- (.+)/.test(line))           return { id: genId(), type: "bulleted_list", content: line.slice(2) };
    if (/^\d+\. (.+)/.test(line))      return { id: genId(), type: "numbered_list", content: line.replace(/^\d+\. /, "") };
    if (/^> (.+)/.test(line))           return { id: genId(), type: "quote",         content: line.slice(2) };
    if (line.trim() === "---")          return { id: genId(), type: "divider",       content: "" };
    if (/^```[\s\S]*```$/.test(line))   return { id: genId(), type: "code",          content: line.replace(/^```\w*\n?/, "").replace(/```$/, "") };
    return { id: genId(), type: "paragraph", content: line };
  });
}

export function serializeBlocks(blocks: Block[]): string {
  return JSON.stringify(blocks);
}

// ─── Inline markdown renderer ───────────────────────────────────────────────────
// Used inside block views to render **bold**, _italic_, `code`, links, etc.

function InlineText({ children, className }: { children: string; className?: string }) {
  if (!children) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      // Prevent wrapping in <p> by unwrapping the disallowed element
      disallowedElements={["p"]}
      unwrapDisallowed
      components={{
        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
        em:     ({ children }) => <em className="italic text-foreground/80">{children}</em>,
        code:   ({ children }) => (
          <code className="px-1.5 py-0.5 rounded bg-muted border border-border/60 font-mono text-xs text-primary/90">
            {children}
          </code>
        ),
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {children}
          </a>
        ),
        del: ({ children }) => <del className="text-muted-foreground/60">{children}</del>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

// ─── Block view ──────────────────────────────────────────────────────────────────
// Rendered (read-only) representation of a block.

function BlockView({
  block,
  listNumber,
  onClick,
  onToggleTodo,
}: {
  block: Block;
  listNumber: number;
  onClick: (e: React.MouseEvent) => void;
  onToggleTodo: (id: string) => void;
}) {
  const empty = !block.content.trim();

  if (block.type === "divider") {
    return <hr className="border-border/40 my-1 cursor-pointer hover:border-primary/40 transition-colors" onClick={onClick} />;
  }

  // ── Todo ──
  if (block.type === "todo") {
    return (
      <div className="flex items-start gap-2 py-0.5 cursor-text min-h-[1.75rem]" onClick={onClick}>
        <button
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
          onClick={(e) => { e.stopPropagation(); onToggleTodo(block.id); }}
        >
          {block.checked
            ? <CheckSquare className="w-4 h-4 text-primary" />
            : <Square className="w-4 h-4 text-muted-foreground/50 hover:text-primary/60" />
          }
        </button>
        <span className={cn(
          "flex-1 text-base leading-snug pt-px",
          block.checked && "line-through text-muted-foreground/50",
          empty && "text-muted-foreground/30 italic text-sm not-italic"
        )}>
          {empty ? "Tarea…" : <InlineText>{block.content}</InlineText>}
        </span>
      </div>
    );
  }

  // ── Code ──
  if (block.type === "code") {
    const [copied, setCopied] = useState(false);
    const copy = () => {
      navigator.clipboard.writeText(block.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };
    return (
      <div
        className="relative group rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900/80 cursor-text"
        onClick={onClick}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/60 border-b border-zinc-700/50">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">código</span>
          <button
            onClick={(e) => { e.stopPropagation(); copy(); }}
            className="p-1 rounded hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        {empty
          ? <p className="px-4 py-3 text-sm font-mono text-zinc-500 italic">// código…</p>
          : <pre className="px-4 py-3 overflow-x-auto scrollbar-thin"><code className="text-sm font-mono text-green-300 leading-relaxed">{block.content}</code></pre>
        }
      </div>
    );
  }

  // ── Callout ──
  if (block.type === "callout") {
    return (
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/20 cursor-text min-h-[2.5rem]"
        onClick={onClick}
      >
        <span className="text-lg leading-snug flex-shrink-0">{block.icon ?? "💡"}</span>
        <span className={cn("flex-1 text-base leading-relaxed", empty && "text-muted-foreground/40 italic text-sm not-italic")}>
          {empty ? "Nota destacada…" : <InlineText>{block.content}</InlineText>}
        </span>
      </div>
    );
  }

  // ── Quote ──
  if (block.type === "quote") {
    return (
      <div className="flex gap-3 cursor-text min-h-[1.75rem]" onClick={onClick}>
        <div className="w-1 rounded-sm bg-primary/50 self-stretch flex-shrink-0" />
        <span className={cn(
          "flex-1 italic text-foreground/70 text-base leading-relaxed py-0.5",
          empty && "text-muted-foreground/30 not-italic text-sm"
        )}>
          {empty ? "Cita…" : <InlineText>{block.content}</InlineText>}
        </span>
      </div>
    );
  }

  // ── Headings ──
  const headingClass: Partial<Record<BlockType, string>> = {
    heading_1: "text-3xl font-heading font-bold leading-tight mt-6 first:mt-0",
    heading_2: "text-2xl font-heading font-semibold leading-snug mt-5 first:mt-0",
    heading_3: "text-xl font-semibold leading-snug mt-4 first:mt-0",
  };
  if (headingClass[block.type]) {
    return (
      <div
        className={cn("cursor-text min-h-[1.5em] py-0.5 rounded hover:bg-muted/10 transition-colors px-1 -mx-1", headingClass[block.type])}
        onClick={onClick}
      >
        {empty
          ? <span className="text-muted-foreground/30 italic font-normal text-lg">{BLOCK_META[block.type].label}…</span>
          : <InlineText className={headingClass[block.type]}>{block.content}</InlineText>
        }
      </div>
    );
  }

  // ── Lists ──
  const isBullet   = block.type === "bulleted_list";
  const isNumbered = block.type === "numbered_list";

  if (isBullet || isNumbered) {
    return (
      <div className="flex items-start gap-2 cursor-text min-h-[1.75rem] py-0.5" onClick={onClick}>
        <span className="flex-shrink-0 text-primary/60 select-none mt-0.5 min-w-[1.25rem] text-center leading-snug">
          {isBullet ? "•" : `${listNumber}.`}
        </span>
        <span className={cn("flex-1 text-base leading-snug", empty && "text-muted-foreground/30 italic text-sm not-italic")}>
          {empty ? "Elemento de lista" : <InlineText>{block.content}</InlineText>}
        </span>
      </div>
    );
  }

  // ── Paragraph (default) ──
  return (
    <div
      className="cursor-text min-h-[1.75rem] py-0.5 rounded hover:bg-muted/5 transition-colors text-base leading-relaxed text-foreground/90 px-0.5"
      onClick={onClick}
    >
      {empty
        ? <span className="text-muted-foreground/25 italic text-sm not-italic">Escribe algo, o escribe / para comandos…</span>
        : <InlineText>{block.content}</InlineText>
      }
    </div>
  );
}

// ─── Slash menu ─────────────────────────────────────────────────────────────────

interface SlashMenuProps {
  search: string;
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

function SlashMenu({ search, onSelect, onClose }: SlashMenuProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const activeRef = useRef<HTMLButtonElement>(null);

  const orderedFiltered = useMemo<[BlockType, BlockMeta][]>(() => {
    const all = Object.entries(BLOCK_META) as [BlockType, BlockMeta][];
    const q = search.toLowerCase();
    const matches = q
      ? all.filter(([, m]) => m.label.toLowerCase().includes(q) || m.keywords.some(k => k.includes(q)))
      : all;
    const out: [BlockType, BlockMeta][] = [];
    GROUPS.forEach(g => matches.filter(([, m]) => m.group === g).forEach(e => out.push(e)));
    return out;
  }, [search]);

  useEffect(() => { setActiveIdx(0); }, [search]);
  useEffect(() => { activeRef.current?.scrollIntoView({ block: "nearest" }); }, [activeIdx]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const len = orderedFiltered.length;
      if (!len) return;
      if (e.key === "ArrowDown") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => (i + 1) % len); }
      else if (e.key === "ArrowUp") { e.preventDefault(); e.stopPropagation(); setActiveIdx(i => (i - 1 + len) % len); }
      else if (e.key === "Enter")   { e.preventDefault(); e.stopPropagation(); onSelect(orderedFiltered[activeIdx][0]); }
      else if (e.key === "Escape")  { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true });
  }, [orderedFiltered, activeIdx, onSelect, onClose]);

  if (orderedFiltered.length === 0) {
    return (
      <div className="absolute top-full left-0 mt-1 z-50 w-60 rounded-xl border border-border bg-popover shadow-xl p-3">
        <p className="text-sm text-muted-foreground text-center italic">Sin resultados</p>
      </div>
    );
  }

  let flatIdx = 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.1 }}
      className="absolute top-full left-0 mt-1 z-50 w-72 rounded-xl border border-border bg-popover shadow-xl overflow-hidden"
    >
      <div className="max-h-72 overflow-y-auto p-1.5 scrollbar-thin">
        {GROUPS.map(group => {
          const items = orderedFiltered.filter(([, m]) => m.group === group);
          if (!items.length) return null;
          return (
            <div key={group}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-2 py-1.5 mt-1 first:mt-0">
                {group}
              </p>
              {items.map(([type, meta]) => {
                const ci = flatIdx++;
                const isActive = ci === activeIdx;
                const { Icon } = meta;
                return (
                  <button
                    key={type}
                    ref={isActive ? activeRef : undefined}
                    onMouseDown={(e) => { e.preventDefault(); onSelect(type); }}
                    onMouseEnter={() => setActiveIdx(ci)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2 py-1.5 rounded-lg text-left transition-colors",
                      isActive ? "bg-primary/10" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                      isActive
                        ? "bg-primary/15 border-primary/30 text-primary"
                        : "bg-muted/40 border-border/50 text-muted-foreground"
                    )}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-medium leading-none", isActive && "text-primary")}>
                        {meta.label}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-0.5 leading-snug truncate">
                        {meta.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="px-3 py-1.5 border-t border-border/40 bg-muted/20">
        <p className="text-[10px] text-muted-foreground/40">
          ↑↓ navegar · Enter seleccionar · Esc cerrar
        </p>
      </div>
    </motion.div>
  );
}

// ─── Block item ──────────────────────────────────────────────────────────────────

interface BlockItemProps {
  block: Block;
  index: number;
  listNumber: number;
  isEditing: boolean;
  inputRef: (el: HTMLInputElement | HTMLTextAreaElement | null) => void;
  onUpdate: (id: string, changes: Partial<Block>) => void;
  onEnter: (id: string, newType: BlockType) => void;
  onBackspaceEmpty: (id: string) => void;
  onFocusPrev: (id: string) => void;
  onFocusNext: (id: string) => void;
  onAddBlockAfter: (id: string) => void;
  onStartEditing: (id: string) => void;
  onStopEditing: () => void;
  onToggleTodo: (id: string) => void;
  isDragging: boolean;
  isDropTarget: boolean;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}

function BlockItem({
  block, index, listNumber, isEditing,
  inputRef, onUpdate, onEnter, onBackspaceEmpty,
  onFocusPrev, onFocusNext, onAddBlockAfter,
  onStartEditing, onStopEditing, onToggleTodo,
  isDragging, isDropTarget, onDragStart, onDragOver, onDrop, onDragEnd,
}: BlockItemProps) {
  const [hovered, setHovered] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashSearch, setSlashSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize for textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    if (isEditing) autoResize();
  }, [isEditing, block.content, autoResize]);

  const handleChange = (newValue: string) => {
    onUpdate(block.id, { content: newValue });
    if (newValue.startsWith("/")) {
      setSlashOpen(true);
      setSlashSearch(newValue.slice(1));
    } else {
      if (slashOpen) setSlashOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (slashOpen) return;

    const target = e.currentTarget;
    const { value } = target;
    const selStart = target.selectionStart ?? 0;
    const selEnd   = target.selectionEnd ?? 0;
    const atStart  = selStart === 0 && selEnd === 0;
    const atEnd    = selStart === value.length;

    if (e.key === "Escape") {
      e.preventDefault();
      onStopEditing();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const isList = ["bulleted_list", "numbered_list", "todo"].includes(block.type);
      if (isList && !value) {
        onUpdate(block.id, { type: "paragraph", content: "" });
        return;
      }
      const newType: BlockType = block.type.startsWith("heading_") ? "paragraph" : block.type;
      onEnter(block.id, newType);
    } else if (e.key === "Backspace" && !value) {
      e.preventDefault();
      onBackspaceEmpty(block.id);
    } else if (e.key === "ArrowUp" && atStart && block.type !== "code") {
      e.preventDefault();
      onFocusPrev(block.id);
    } else if (e.key === "ArrowDown" && atEnd && block.type !== "code") {
      e.preventDefault();
      onFocusNext(block.id);
    }
  };

  const selectSlashType = useCallback((type: BlockType) => {
    setSlashOpen(false);
    setSlashSearch("");
    onUpdate(block.id, { type, content: "" });
  }, [block.id, onUpdate]);

  // ── Shared wrapper ──
  const wrapperClass = cn(
    "group relative",
    isDragging && "opacity-40",
    isDropTarget && "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary before:rounded"
  );

  const dragProps = {
    draggable: true,
    onDragStart: () => onDragStart(block.id),
    onDragOver:  (e: React.DragEvent) => onDragOver(e, block.id),
    onDrop, onDragEnd,
  };

  // ── Left gutter (drag handle + add button) ──
  const gutter = (
    <div className="absolute -left-12 top-0 flex items-center gap-0.5 h-full opacity-0 group-hover:opacity-100 transition-opacity">
      <button
        onClick={() => onAddBlockAfter(block.id)}
        title="Añadir bloque"
        className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground/50 hover:text-foreground transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
      <div
        title="Arrastrar"
        className="p-0.5 rounded hover:bg-muted/60 text-muted-foreground/30 hover:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </div>
    </div>
  );

  // ── Divider ──
  if (block.type === "divider") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing
          ? <hr className="border-primary/50 my-2" />
          : <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        }
      </div>
    );
  }

  // ── Edit mode: input / textarea ──
  const editInputClass = cn(
    "w-full bg-transparent outline-none resize-none overflow-hidden border-none placeholder:text-muted-foreground/30",
    {
      paragraph:     "text-base leading-relaxed text-foreground/90",
      heading_1:     "text-3xl font-heading font-bold leading-tight",
      heading_2:     "text-2xl font-heading font-semibold leading-snug",
      heading_3:     "text-xl font-semibold leading-snug",
      bulleted_list: "text-base leading-snug",
      numbered_list: "text-base leading-snug",
      todo:          "text-base leading-snug",
      quote:         "text-base italic text-foreground/70 leading-relaxed",
      callout:       "text-base leading-relaxed",
      code:          "text-sm font-mono text-green-300 leading-relaxed",
      divider:       "",
    }[block.type]
  );

  const placeholder = {
    paragraph:     "Escribe algo, o escribe / para comandos…",
    heading_1:     "Título 1",
    heading_2:     "Título 2",
    heading_3:     "Título 3",
    bulleted_list: "Elemento de lista",
    numbered_list: "Elemento numerado",
    todo:          "Tarea",
    quote:         "Cita…",
    callout:       "Nota destacada…",
    code:          "// código…",
    divider:       "",
  }[block.type];

  const isMultiline = ["paragraph", "quote", "callout", "code"].includes(block.type);

  const editInput = isMultiline ? (
    <textarea
      ref={el => {
        inputRef(el);
        (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }}
      value={block.content}
      rows={1}
      placeholder={placeholder}
      onChange={e => { handleChange(e.target.value); autoResize(); }}
      onKeyDown={handleKeyDown}
      onBlur={onStopEditing}
      className={cn(editInputClass, "py-0.5")}
    />
  ) : (
    <input
      ref={el => inputRef(el)}
      value={block.content}
      placeholder={placeholder}
      onChange={e => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={onStopEditing}
      className={cn(editInputClass, "py-0.5")}
    />
  );

  // ── Outer shells for block types ──

  // Todo
  if (block.type === "todo") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing ? (
          <div className="flex items-start gap-2 py-0.5">
            <button className="mt-1 flex-shrink-0" onClick={() => onToggleTodo(block.id)}>
              {block.checked
                ? <CheckSquare className="w-4 h-4 text-primary" />
                : <Square className="w-4 h-4 text-muted-foreground/50" />
              }
            </button>
            <div className="relative flex-1">
              {editInput}
              <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
            </div>
          </div>
        ) : (
          <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        )}
      </div>
    );
  }

  // Quote
  if (block.type === "quote") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing ? (
          <div className="flex gap-3 rounded-lg bg-muted/20 pr-3 py-1">
            <div className="w-1 rounded-sm bg-primary/50 self-stretch flex-shrink-0" />
            <div className="relative flex-1">
              {editInput}
              <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
            </div>
          </div>
        ) : (
          <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        )}
      </div>
    );
  }

  // Callout
  if (block.type === "callout") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing ? (
          <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/8 border border-amber-500/20">
            <span className="text-lg flex-shrink-0">{block.icon ?? "💡"}</span>
            <div className="relative flex-1">
              {editInput}
              <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
            </div>
          </div>
        ) : (
          <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        )}
      </div>
    );
  }

  // Code
  if (block.type === "code") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing ? (
          <div className="rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900/80">
            <div className="px-4 py-1.5 bg-zinc-800/60 border-b border-zinc-700/50 text-xs font-mono text-zinc-400 uppercase tracking-wider">
              código
            </div>
            <div className="relative px-4 py-3">
              {editInput}
              <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
            </div>
          </div>
        ) : (
          <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        )}
      </div>
    );
  }

  // Bullet / Numbered list
  if (block.type === "bulleted_list" || block.type === "numbered_list") {
    return (
      <div className={wrapperClass} {...dragProps}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      >
        {gutter}
        {isEditing ? (
          <div className="flex items-start gap-2 py-0.5">
            <span className="flex-shrink-0 text-primary/60 select-none mt-0.5 min-w-[1.25rem] text-center text-base leading-snug">
              {block.type === "bulleted_list" ? "•" : `${listNumber}.`}
            </span>
            <div className="relative flex-1">
              {editInput}
              <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
            </div>
          </div>
        ) : (
          <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
        )}
      </div>
    );
  }

  // Paragraph & headings (default)
  return (
    <div className={wrapperClass} {...dragProps}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
    >
      {gutter}
      {isEditing ? (
        <div className="relative">
          {editInput}
          <AnimatePresence>{slashOpen && <SlashMenu search={slashSearch} onSelect={selectSlashType} onClose={() => setSlashOpen(false)} />}</AnimatePresence>
        </div>
      ) : (
        <BlockView block={block} listNumber={listNumber} onClick={() => onStartEditing(block.id)} onToggleTodo={onToggleTodo} />
      )}
    </div>
  );
}

// ─── BlockEditor ───────────────────────────────────────────────────────────────

export interface BlockEditorProps {
  nodeId: string;
  content: string | null | undefined;
  onSave: (serialized: string) => Promise<void>;
}

export function BlockEditor({ nodeId, content, onSave }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(content));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAskAI, setShowAskAI] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Drag state
  const [draggingId,   setDraggingId]   = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Sync from outside (e.g. AI apply)
  const lastContentRef = useRef<string | null>(content ?? null);
  useEffect(() => {
    if (content !== lastContentRef.current) {
      setBlocks(parseBlocks(content));
      lastContentRef.current = content ?? null;
    }
  }, [content]);

  // Refs map
  const inputRefs = useRef<Map<string, HTMLInputElement | HTMLTextAreaElement>>(new Map());
  const setInputRef = useCallback((id: string) =>
    (el: HTMLInputElement | HTMLTextAreaElement | null) => {
      if (el) inputRefs.current.set(id, el);
      else    inputRefs.current.delete(id);
    }, []);

  const focusBlock = useCallback((id: string, atEnd = true) => {
    requestAnimationFrame(() => {
      const el = inputRefs.current.get(id);
      if (!el) return;
      el.focus();
      try {
        const pos = atEnd ? el.value.length : 0;
        el.setSelectionRange(pos, pos);
      } catch { /* divider etc */ }
    });
  }, []);

  // Blur delay — prevents flicker when clicking from one block to another
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startEditing = useCallback((id: string) => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setEditingId(id);
    focusBlock(id);
  }, [focusBlock]);

  const stopEditing = useCallback(() => {
    blurTimer.current = setTimeout(() => setEditingId(null), 80);
  }, []);

  // ── Debounced save ──
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleSave = useCallback((newBlocks: Block[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      const s = serializeBlocks(newBlocks);
      lastContentRef.current = s;
      await onSave(s);
      setSaving(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1500);
    }, 800);
  }, [onSave]);

  // ── Block mutations ──

  const updateBlock = useCallback((id: string, changes: Partial<Block>) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...changes } : b);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const createBlockAfter = useCallback((afterId: string, type: BlockType = "paragraph", initContent = "") => {
    const nb: Block = { id: genId(), type, content: initContent };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const next = idx === -1
        ? [...prev, nb]
        : [...prev.slice(0, idx + 1), nb, ...prev.slice(idx + 1)];
      scheduleSave(next);
      return next;
    });
    // Switch editing to new block
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setEditingId(nb.id);
    requestAnimationFrame(() => {
      const el = inputRefs.current.get(nb.id);
      el?.focus();
    });
  }, [scheduleSave]);

  const handleEnter = useCallback((id: string, newType: BlockType) => {
    createBlockAfter(id, newType);
  }, [createBlockAfter]);

  const handleBackspaceEmpty = useCallback((id: string) => {
    setBlocks(prev => {
      if (prev.length === 1) return prev;
      const idx = prev.findIndex(b => b.id === id);
      const next = prev.filter(b => b.id !== id);
      scheduleSave(next);
      const focusIdx = Math.max(0, idx - 1);
      const fid = next[focusIdx]?.id;
      if (fid) {
        if (blurTimer.current) clearTimeout(blurTimer.current);
        setEditingId(fid);
        requestAnimationFrame(() => focusBlock(fid));
      }
      return next;
    });
  }, [scheduleSave, focusBlock]);

  const handleFocusPrev = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx > 0) {
        const pid = prev[idx - 1].id;
        if (blurTimer.current) clearTimeout(blurTimer.current);
        setEditingId(pid);
        requestAnimationFrame(() => focusBlock(pid));
      }
      return prev;
    });
  }, [focusBlock]);

  const handleFocusNext = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < prev.length - 1) {
        const nid = prev[idx + 1].id;
        if (blurTimer.current) clearTimeout(blurTimer.current);
        setEditingId(nid);
        requestAnimationFrame(() => focusBlock(nid, false));
      }
      return prev;
    });
  }, [focusBlock]);

  const handleToggleTodo = useCallback((id: string) => {
    setBlocks(prev => {
      const next = prev.map(b => b.id === id ? { ...b, checked: !b.checked } : b);
      scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  // ── Drag ──
  const handleDragStart = useCallback((id: string) => setDraggingId(id), []);
  const handleDragOver  = useCallback((e: React.DragEvent, id: string) => { e.preventDefault(); setDropTargetId(id); }, []);
  const handleDrop      = useCallback(() => {
    if (!draggingId || !dropTargetId || draggingId === dropTargetId) {
      setDraggingId(null); setDropTargetId(null); return;
    }
    setBlocks(prev => {
      const from = prev.findIndex(b => b.id === draggingId);
      const to   = prev.findIndex(b => b.id === dropTargetId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      scheduleSave(next);
      return next;
    });
    setDraggingId(null); setDropTargetId(null);
  }, [draggingId, dropTargetId, scheduleSave]);
  const handleDragEnd = useCallback(() => { setDraggingId(null); setDropTargetId(null); }, []);

  // ── List numbers ──
  const listNumbers = useMemo(() => {
    const map: Record<string, number> = {};
    let c = 0;
    blocks.forEach(b => {
      if (b.type === "numbered_list") { c++; map[b.id] = c; }
      else c = 0;
    });
    return map;
  }, [blocks]);

  // ── AI apply ──
  const handleAIApply = useCallback(async (newContent: string) => {
    const newBlocks = parseBlocks(newContent);
    setBlocks(newBlocks);
    scheduleSave(newBlocks);
    setShowAskAI(false);
  }, [scheduleSave]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-widest">
          Contenido
        </h2>
        <div className="flex-1" />
        {saving && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground/40" />}
        {savedFlash && !saving && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
            <Check className="w-3 h-3" /> Guardado
          </span>
        )}
        <button
          onClick={() => setShowAskAI(v => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors",
            showAskAI
              ? "border-violet-500/50 text-violet-400 bg-violet-500/10"
              : "border-violet-500/30 text-violet-400 bg-violet-500/5 hover:bg-violet-500/10"
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Preguntar a la IA
        </button>
      </div>

      {/* Ask AI */}
      <AnimatePresence>
        {showAskAI && (
          <div className="mb-4">
            <AskAI
              nodeId={nodeId}
              currentContent={serializeBlocks(blocks)}
              onApply={handleAIApply}
              onClose={() => setShowAskAI(false)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Blocks */}
      <div className="relative pl-14 -ml-14 space-y-0.5">
        {blocks.map((block, index) => (
          <BlockItem
            key={block.id}
            block={block}
            index={index}
            listNumber={listNumbers[block.id] ?? 1}
            isEditing={editingId === block.id}
            inputRef={setInputRef(block.id)}
            onUpdate={updateBlock}
            onEnter={handleEnter}
            onBackspaceEmpty={handleBackspaceEmpty}
            onFocusPrev={handleFocusPrev}
            onFocusNext={handleFocusNext}
            onAddBlockAfter={(id) => createBlockAfter(id)}
            onStartEditing={startEditing}
            onStopEditing={stopEditing}
            onToggleTodo={handleToggleTodo}
            isDragging={draggingId === block.id}
            isDropTarget={dropTargetId === block.id && draggingId !== block.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
        ))}

        <button
          onClick={() => createBlockAfter(blocks[blocks.length - 1]?.id ?? "", "paragraph")}
          className="flex items-center gap-2 py-2 text-sm text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Añadir bloque
        </button>
      </div>
    </div>
  );
}

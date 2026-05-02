"use client";

/**
 * AdaptiveItemCard — renders a KnowledgeNode using the visual best suited
 * to its type/source. Same data, very different surfaces.
 *
 * Variants:
 *   - synthesis  — agent-generated summaries (distinguished badge + violet)
 *   - book       — curated book or saved book chapter (cover-like)
 *   - video      — YouTube source (rose accent, play affordance)
 *   - article    — web link source (sky accent, domain badge)
 *   - file       — uploaded file (amber accent, format badge)
 *   - note       — user-written note (warm color, free text)
 *   - concept    — concept/entity/person (clean text-heavy)
 *   - generic    — fallback
 */

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Sparkles, BookOpen, Play, Globe, FileText, StickyNote,
  Lightbulb, User, Calendar, Maximize2, Link2,
} from "lucide-react";
import type { KnowledgeNode } from "@/graphql/types";
import { cn } from "@/lib/utils";

// ─── Variant detection ────────────────────────────────────────────────────────

export type Variant = "synthesis" | "book" | "video" | "article" | "file" | "note" | "concept" | "person" | "event" | "generic";

export function detectVariant(node: KnowledgeNode): Variant {
  const src = node.sourceRef ?? "";
  if (src.startsWith("synthesis")) return "synthesis";
  if (src.startsWith("youtube:")) return "video";
  if (src.startsWith("file:")) return "file";
  if (src.startsWith("curated:") || node.type === "book") return "book";
  if (/^https?:\/\//.test(src)) return "article";
  if (node.type === "note") return "note";
  if (node.type === "person") return "person";
  if (node.type === "event") return "event";
  if (node.type === "concept" || node.type === "entity") return "concept";
  return "generic";
}

const VARIANT_META: Record<Variant, {
  Icon: React.ElementType;
  label: string;
  color: string;
  bg: string;
  border: string;
  accentBar?: string;
}> = {
  synthesis: { Icon: Sparkles,    label: "Síntesis",   color: "text-violet-300",  bg: "bg-violet-500/10",  border: "border-violet-500/30",  accentBar: "bg-gradient-to-r from-violet-500 to-fuchsia-500" },
  book:      { Icon: BookOpen,    label: "Libro",      color: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  video:     { Icon: Play,        label: "Video",      color: "text-rose-300",    bg: "bg-rose-500/10",    border: "border-rose-500/25" },
  article:   { Icon: Globe,       label: "Web",        color: "text-sky-300",     bg: "bg-sky-500/10",     border: "border-sky-500/25" },
  file:      { Icon: FileText,    label: "Archivo",    color: "text-amber-300",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  note:      { Icon: StickyNote,  label: "Nota",       color: "text-yellow-300",  bg: "bg-yellow-500/10",  border: "border-yellow-500/25" },
  concept:   { Icon: Lightbulb,   label: "Concepto",   color: "text-indigo-300",  bg: "bg-indigo-500/10",  border: "border-indigo-500/25" },
  person:    { Icon: User,        label: "Persona",    color: "text-pink-300",    bg: "bg-pink-500/10",    border: "border-pink-500/25" },
  event:     { Icon: Calendar,    label: "Evento",     color: "text-orange-300",  bg: "bg-orange-500/10",  border: "border-orange-500/25" },
  generic:   { Icon: Lightbulb,   label: "Idea",       color: "text-muted-foreground", bg: "bg-muted/40", border: "border-border/40" },
};

function formatSourceLabel(node: KnowledgeNode, variant: Variant): string | null {
  const src = node.sourceRef;
  if (!src) return null;
  if (variant === "video") return src.replace(/^youtube:/, "youtube.com/").slice(0, 40);
  if (variant === "file") return src.replace(/^file:/, "");
  if (variant === "article") {
    try {
      return new URL(src).hostname.replace(/^www\./, "");
    } catch {
      return src.slice(0, 40);
    }
  }
  if (variant === "synthesis") return "Generada por tu agente";
  if (variant === "book") return src.replace(/^curated:/, "").replace(/-/g, " ");
  return null;
}

// ─── Specialized renderers ───────────────────────────────────────────────────

interface CardProps {
  node: KnowledgeNode;
  isSelected?: boolean;
  onClick: () => void;
}

/** Synthesis card — distinguished, with gradient bar at the top */
function SynthesisCard({ node, isSelected, onClick }: CardProps) {
  const meta = VARIANT_META.synthesis;
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border overflow-hidden bg-card/50 hover:bg-card/80 transition-all relative",
        isSelected ? "border-violet-500/60 shadow-md shadow-violet-500/10" : "border-violet-500/30"
      )}
    >
      <div className={cn("h-0.5 w-full", meta.accentBar)} />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", meta.bg, meta.border, "border")}>
            <Sparkles className={cn("w-4 h-4", meta.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-[9px] font-bold uppercase tracking-wider", meta.color)}>
                {meta.label}
              </span>
              <span className="text-[9px] text-muted-foreground">· generada por tu agente</span>
            </div>
            <p className="text-sm font-semibold leading-snug">{node.name}</p>
            {node.content && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-3">
                {node.content}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/** Video card — thumbnail-style with play affordance */
function VideoCard({ node, isSelected, onClick }: CardProps) {
  const meta = VARIANT_META.video;
  const sourceLabel = formatSourceLabel(node, "video");
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border bg-card/50 hover:bg-card/80 transition-all overflow-hidden",
        isSelected ? "border-rose-500/60" : "border-border/40"
      )}
    >
      {/* "thumbnail" surface */}
      <div className={cn("aspect-[16/8] relative flex items-center justify-center", "bg-gradient-to-br from-rose-950/40 to-rose-900/20")}>
        <div className="w-10 h-10 rounded-full bg-rose-500/30 backdrop-blur flex items-center justify-center group-hover:bg-rose-500/50 transition-colors">
          <Play className="w-4 h-4 text-rose-100 ml-0.5" />
        </div>
        <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
          {meta.label}
        </span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{node.name}</p>
        {sourceLabel && (
          <p className="text-[10px] text-rose-400/70 mt-1.5 truncate flex items-center gap-1">
            <Link2 className="w-2.5 h-2.5" />
            {sourceLabel}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/** Book card — spine-like with title and source */
function BookCard({ node, isSelected, onClick }: CardProps) {
  const meta = VARIANT_META.book;
  const sourceLabel = formatSourceLabel(node, "book");
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border bg-card/50 hover:bg-card/80 transition-all overflow-hidden flex",
        isSelected ? "border-emerald-500/60" : "border-border/40"
      )}
    >
      {/* Spine */}
      <div className="w-10 bg-gradient-to-b from-emerald-700/40 to-emerald-900/40 flex items-center justify-center shrink-0 border-r border-emerald-500/20">
        <BookOpen className="w-4 h-4 text-emerald-300/70 rotate-90" />
      </div>
      <div className="p-3 flex-1 min-w-0">
        <span className={cn("text-[9px] font-bold uppercase tracking-wider", meta.color)}>{meta.label}</span>
        <p className="text-sm font-semibold leading-snug line-clamp-2 mt-1">{node.name}</p>
        {sourceLabel && (
          <p className="text-[10px] text-muted-foreground mt-1 truncate capitalize">{sourceLabel}</p>
        )}
      </div>
    </motion.button>
  );
}

/** Web article card — preview-strip with domain */
function ArticleCard({ node, isSelected, onClick }: CardProps) {
  const meta = VARIANT_META.article;
  const domain = formatSourceLabel(node, "article");
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border bg-card/50 hover:bg-card/80 transition-all overflow-hidden",
        isSelected ? "border-sky-500/60" : "border-border/40"
      )}
    >
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 bg-sky-500/5">
        <Globe className={cn("w-3 h-3", meta.color)} />
        {domain && <span className="text-[10px] font-mono text-sky-400/80 truncate flex-1">{domain}</span>}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{node.name}</p>
        {node.content && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
            {node.content}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/** File card — file-style with format badge */
function FileCardVariant({ node, isSelected, onClick }: CardProps) {
  const meta = VARIANT_META.file;
  const filename = formatSourceLabel(node, "file") ?? "";
  const ext = filename.split(".").pop()?.toUpperCase().slice(0, 4) ?? "DOC";
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border bg-card/50 hover:bg-card/80 transition-all p-3 flex items-start gap-3",
        isSelected ? "border-amber-500/60" : "border-border/40"
      )}
    >
      <div className="w-10 h-12 rounded border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0 relative">
        <FileText className={cn("w-4 h-4", meta.color)} />
        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-amber-100 bg-amber-600 px-1 rounded">
          {ext}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{node.name}</p>
        {filename && (
          <p className="text-[10px] text-muted-foreground mt-1 truncate">{filename}</p>
        )}
      </div>
    </motion.button>
  );
}

/** Note card — sticky-note style, warm color */
function NoteCardVariant({ node, isSelected, onClick }: CardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border p-3 transition-all bg-yellow-500/5 hover:bg-yellow-500/10",
        isSelected ? "border-yellow-500/60" : "border-yellow-500/20"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <StickyNote className="w-3 h-3 text-yellow-300" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-yellow-300">Nota</span>
      </div>
      <p className="text-sm font-medium leading-snug line-clamp-3">{node.name}</p>
      {node.content && (
        <p className="text-xs text-muted-foreground/80 leading-relaxed mt-2 line-clamp-3">
          {node.content}
        </p>
      )}
    </motion.button>
  );
}

/** Generic card — used for concept/person/event/fallback */
function GenericCard({ node, variant, isSelected, onClick }: CardProps & { variant: Variant }) {
  const meta = VARIANT_META[variant];
  const Icon = meta.Icon;
  const router = useRouter();
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer relative",
        isSelected
          ? "border-primary/60 bg-primary/5"
          : "border-border/40 bg-card/50 hover:bg-card/80"
      )}
    >
      <button
        onClick={(e) => { e.stopPropagation(); router.push(`/library/${node.id}`); }}
        title="Abrir como página"
        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/40 hover:text-primary opacity-0 group-hover:opacity-100 transition-all"
      >
        <Maximize2 className="w-3 h-3" />
      </button>
      <div className="flex items-center gap-1.5 mb-1.5">
        <div className={cn("w-5 h-5 rounded flex items-center justify-center", meta.bg, meta.border, "border")}>
          <Icon className={cn("w-2.5 h-2.5", meta.color)} />
        </div>
        <span className={cn("text-[9px] font-bold uppercase tracking-wider", meta.color)}>{meta.label}</span>
      </div>
      <p className="text-sm font-semibold leading-snug line-clamp-2">{node.name}</p>
      {node.content && (
        <p className="text-xs text-muted-foreground leading-relaxed mt-1.5 line-clamp-2">
          {node.content}
        </p>
      )}
    </motion.div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

export function AdaptiveItemCard({ node, isSelected, onClick }: CardProps) {
  const variant = detectVariant(node);
  switch (variant) {
    case "synthesis": return <SynthesisCard node={node} isSelected={isSelected} onClick={onClick} />;
    case "video":     return <VideoCard node={node} isSelected={isSelected} onClick={onClick} />;
    case "book":      return <BookCard node={node} isSelected={isSelected} onClick={onClick} />;
    case "article":   return <ArticleCard node={node} isSelected={isSelected} onClick={onClick} />;
    case "file":      return <FileCardVariant node={node} isSelected={isSelected} onClick={onClick} />;
    case "note":      return <NoteCardVariant node={node} isSelected={isSelected} onClick={onClick} />;
    default:          return <GenericCard node={node} variant={variant} isSelected={isSelected} onClick={onClick} />;
  }
}

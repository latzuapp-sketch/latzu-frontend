"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { KnowledgeNode } from "@/graphql/types";
import { getNodeTypeConfig } from "./NodeTypeConfig";
import { Link2, Maximize2 } from "lucide-react";

interface NodeCardProps {
  node: KnowledgeNode;
  isSelected?: boolean;
  onClick: () => void;
  index?: number;
}

function formatSource(sourceRef: string | null): string | null {
  if (!sourceRef) return null;
  if (sourceRef.startsWith("youtube:")) return `YouTube · ${sourceRef.slice(8)}`;
  return sourceRef;
}

export function NodeCard({ node, isSelected, onClick, index = 0 }: NodeCardProps) {
  const cfg = getNodeTypeConfig(node.type);
  const { Icon } = cfg;
  const source = formatSource(node.sourceRef);
  const router = useRouter();

  const openAsPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/library/${node.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -1 }}
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-xl border p-4 transition-all cursor-pointer relative",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
          : "border-border/50 bg-card/60 hover:border-border hover:bg-card/90"
      )}
    >
      {/* Open as page button (shown on hover) */}
      <button
        onClick={openAsPage}
        title="Abrir como página"
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-muted/60 opacity-0 group-hover:opacity-100 transition-all z-10"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>

      {/* Type badge + icon */}
      <div className="flex items-start justify-between gap-2 mb-2.5 pr-7">
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border",
            cfg.bg,
            cfg.text,
            cfg.border
          )}
        >
          <Icon className="w-3 h-3" />
          {cfg.label}
        </div>
        {isSelected && (
          <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
        )}
      </div>

      {/* Name */}
      <p className="font-semibold text-sm leading-snug mb-1.5 line-clamp-2">
        {node.name}
      </p>

      {/* Content preview */}
      {node.content && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
          {node.content}
        </p>
      )}

      {/* Source */}
      {source && (
        <div className="flex items-center gap-1 mt-2.5 text-xs text-muted-foreground/60">
          <Link2 className="w-3 h-3 shrink-0" />
          <span className="truncate">{source}</span>
        </div>
      )}
    </motion.div>
  );
}

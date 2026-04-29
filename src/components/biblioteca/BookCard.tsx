"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LibraryBook } from "@/types/library";
import { BOOK_CATEGORY_CONFIG } from "@/data/curated-books";
import { BookOpen, Clock, FileText } from "lucide-react";

interface BookCardProps {
  book: LibraryBook;
  isSelected?: boolean;
  onClick: () => void;
  index?: number;
}

export function BookCard({ book, isSelected, onClick, index = 0 }: BookCardProps) {
  const cat = BOOK_CATEGORY_CONFIG[book.category];

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.5) }}
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl border overflow-hidden transition-all group",
        isSelected
          ? "border-primary shadow-sm shadow-primary/10"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Cover gradient strip */}
      <div className={cn("h-2 w-full bg-gradient-to-r", book.coverGradient)} />

      <div className="p-4 bg-card/60 group-hover:bg-card/90 transition-colors">
        {/* Category badge */}
        <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border mb-2.5", cat.bg, cat.color, cat.border)}>
          {cat.label}
        </div>

        {/* Title + author */}
        <p className={cn("font-semibold text-sm leading-snug mb-0.5 line-clamp-2 transition-colors", isSelected && "text-primary")}>
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground mb-2.5">{book.author} · {book.year}</p>

        {/* Summary */}
        <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mb-3">
          {book.summary}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
          <span className="flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {book.pages} págs
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {book.readMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {book.insights.length} insights
          </span>
        </div>
      </div>
    </motion.button>
  );
}

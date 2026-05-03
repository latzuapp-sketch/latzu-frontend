"use client";

/**
 * BrainPageShell — common chrome for /brain leaf pages.
 *
 * Provides:
 *   • Page title + subtitle
 *   • Optional item count chip
 *   • Optional toolbar slot to the right of the title (per-type creator)
 *   • A scrollable body
 *
 * Each leaf page decides its own grid/list AND its own creation pattern
 * — a notes page might inline a textarea, a files page a drop zone, a
 * decks page a single-line input. The shell is intentionally minimal.
 */

import type { ReactNode } from "react";

interface ShellProps {
  title: string;
  subtitle?: string;
  count?: number;
  /** Optional element rendered to the right of the title (e.g. per-type creator button). */
  toolbar?: ReactNode;
  children: ReactNode;
}

export function BrainPageShell({ title, subtitle, count, toolbar, children }: ShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4 border-b border-border/30 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-heading font-bold capitalize truncate">{title}</h1>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {count !== undefined && (
              <span className="text-[10px] text-muted-foreground">
                {count} {count === 1 ? "item" : "items"}
              </span>
            )}
            {toolbar}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {children}
      </div>
    </div>
  );
}

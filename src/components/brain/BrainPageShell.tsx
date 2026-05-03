"use client";

/**
 * BrainPageShell — common chrome for /brain leaf pages.
 *
 * Provides:
 *   • Page title + subtitle
 *   • Optional item count chip
 *   • The prominent BrainCreateToolbar
 *   • A scrollable body
 *
 * Each leaf page (e.g. /brain/notes) decides its own grid/list layout and
 * passes it as children. The viewer modal is owned by the leaf, since each
 * type opens different items.
 */

import type { ReactNode } from "react";
import { BrainCreateToolbar } from "@/components/brain/BrainCreateToolbar";

interface ShellProps {
  title: string;
  subtitle?: string;
  count?: number;
  /** Optional element rendered to the right of the title (e.g. status filter pills). */
  toolbar?: ReactNode;
  /** Called whenever the create toolbar successfully creates an item. */
  onCreated?: () => void;
  children: ReactNode;
}

export function BrainPageShell({ title, subtitle, count, toolbar, onCreated, children }: ShellProps) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-3 border-b border-border/30 shrink-0 space-y-3">
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

        <BrainCreateToolbar onCreated={onCreated} />
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {children}
      </div>
    </div>
  );
}

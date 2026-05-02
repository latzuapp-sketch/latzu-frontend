"use client";

/**
 * WorkspaceViewer — preview a workspace inside /brain.
 *
 * Lists the pages it contains (read-only at this depth) and offers a CTA to
 * jump to /workspace/[id] for the full block-editor.
 */

import Link from "next/link";
import { ArrowRight, FileText, Loader2, Plus } from "lucide-react";
import { useWorkspacePages } from "@/hooks/useWorkspacePages";
import type { WorkspaceDoc } from "@/types/workspace";
import { cn } from "@/lib/utils";

interface WorkspaceViewerProps {
  workspace: WorkspaceDoc;
}

export function WorkspaceViewer({ workspace }: WorkspaceViewerProps) {
  const { pages, loading } = useWorkspacePages(workspace.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl border border-border/40 bg-card/40 flex items-center justify-center text-3xl shrink-0">
          {workspace.icon || "📁"}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-heading font-bold leading-snug">{workspace.title}</h2>
          {workspace.description && (
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {workspace.description}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/50 mt-2">
            Creado {new Date(workspace.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      </header>

      {/* Pages list */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
            Páginas
          </p>
          <Link
            href={`/workspace/${workspace.id}`}
            className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1"
          >
            Editor completo <ArrowRight className="w-2.5 h-2.5" />
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && pages.length === 0 && (
          <Link
            href={`/workspace/${workspace.id}`}
            className={cn(
              "flex items-center gap-2 rounded-xl border border-dashed border-border/40 p-4 hover:border-primary/40 hover:bg-card/40 transition-colors group",
              "text-sm text-muted-foreground hover:text-foreground"
            )}
          >
            <Plus className="w-4 h-4 text-muted-foreground/60 group-hover:text-primary" />
            Crear la primera página
          </Link>
        )}

        {!loading && pages.length > 0 && (
          <ul className="space-y-1">
            {pages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/workspace/${workspace.id}?page=${page.id}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors group"
                >
                  <span className="text-base shrink-0">{page.icon || "📄"}</span>
                  <span className="flex-1 text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {page.title || "Sin título"}
                  </span>
                  <FileText className="w-3 h-3 text-muted-foreground/40" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

"use client";

/**
 * UniversalViewer — opens any item type in the center pane of /brain.
 *
 * Dispatches to a type-specific viewer:
 *   - "node"      → KnowledgeNodeViewer (wraps existing NodeDetail with full edit)
 *   - "note"      → NoteViewer            (title + body editor, color, labels)
 *   - "task"      → TaskViewer            (status toggle, due, priority, edit)
 *   - "workspace" → WorkspaceViewer       (lists pages + opens external editor)
 *
 * Notion-style: the viewer takes over the middle pane. The grid is hidden
 * while a viewer is open. Top breadcrumb returns to the grid.
 */

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { NodeDetail } from "@/components/biblioteca/NodeDetail";
import { BookDetail } from "@/components/biblioteca/BookDetail";
import { NoteViewer } from "@/components/brain/viewers/NoteViewer";
import { TaskViewer } from "@/components/brain/viewers/TaskViewer";
import { WorkspaceViewer } from "@/components/brain/viewers/WorkspaceViewer";

import type { KnowledgeNode } from "@/graphql/types";
import type { Flashcard } from "@/types/flashcards";
import type { PlanningTask } from "@/types/planning";
import type { WorkspaceDoc } from "@/types/workspace";
import type { LibraryBook } from "@/types/library";

// ─── Tagged union of viewable items ──────────────────────────────────────────

export type ViewerItem =
  | { kind: "node"; node: KnowledgeNode }
  | { kind: "note"; note: Flashcard }
  | { kind: "task"; task: PlanningTask }
  | { kind: "workspace"; workspace: WorkspaceDoc }
  | { kind: "book"; book: LibraryBook };

interface UniversalViewerProps {
  item: ViewerItem;
  onClose: () => void;
}

// ─── Header ──────────────────────────────────────────────────────────────────

function ViewerHeader({
  kindLabel,
  onClose,
  externalHref,
}: {
  kindLabel: string;
  onClose: () => void;
  externalHref?: string;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-border/30 shrink-0 bg-background/60 backdrop-blur-sm sticky top-0 z-10">
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Volver
      </button>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          {kindLabel}
        </span>
        {externalHref && (
          <Link
            href={externalHref}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80"
          >
            Abrir editor completo <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </div>
  );
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function UniversalViewer({ item, onClose }: UniversalViewerProps) {
  const router = useRouter();

  if (item.kind === "node") {
    return (
      <motion.div
        key={`viewer-node-${item.node.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto"
      >
        <ViewerHeader kindLabel="Conocimiento" onClose={onClose} />
        <div className="px-6 py-5 max-w-3xl mx-auto">
          <NodeDetail
            nodeId={item.node.id}
            onClose={onClose}
            onNavigate={(id) => router.push(`/library/${id}`)}
          />
        </div>
      </motion.div>
    );
  }

  if (item.kind === "note") {
    return (
      <motion.div
        key={`viewer-note-${item.note.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto"
      >
        <ViewerHeader kindLabel="Nota" onClose={onClose} externalHref={`/notes/${item.note.id}`} />
        <div className="px-6 py-5 max-w-3xl mx-auto">
          <NoteViewer note={item.note} />
        </div>
      </motion.div>
    );
  }

  if (item.kind === "task") {
    return (
      <motion.div
        key={`viewer-task-${item.task.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto"
      >
        <ViewerHeader kindLabel="Tarea" onClose={onClose} externalHref="/planning" />
        <div className="px-6 py-5 max-w-3xl mx-auto">
          <TaskViewer task={item.task} />
        </div>
      </motion.div>
    );
  }

  if (item.kind === "book") {
    return (
      <motion.div
        key={`viewer-book-${item.book.id}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full overflow-y-auto"
      >
        <ViewerHeader kindLabel="Libro" onClose={onClose} />
        <BookDetail book={item.book} onClose={onClose} />
      </motion.div>
    );
  }

  // workspace
  return (
    <motion.div
      key={`viewer-ws-${item.workspace.id}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full overflow-y-auto"
    >
      <ViewerHeader
        kindLabel="Space"
        onClose={onClose}
        externalHref={`/workspace/${item.workspace.id}`}
      />
      <div className="px-6 py-5 max-w-3xl mx-auto">
        <WorkspaceViewer workspace={item.workspace} />
      </div>
    </motion.div>
  );
}

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronRight,
  Plus,
  Trash2,
  FileText,
  StickyNote,
  FileType2,
  Mic2,
  Video,
  Loader2,
  MoreHorizontal,
  ChevronLeft,
} from "lucide-react";
import type { WorkspacePage, TreeNode, PageType } from "@/types/workspace";
import { buildTree, PAGE_TYPE_META } from "@/types/workspace";
import { useRouter } from "next/navigation";

// ─── Page type icons ──────────────────────────────────────────────────────────

const PAGE_ICONS: Record<PageType, typeof FileText> = {
  page:    FileText,
  note:    StickyNote,
  pdf:     FileType2,
  podcast: Mic2,
  video:   Video,
};

// ─── New page picker ──────────────────────────────────────────────────────────

function NewPagePicker({
  onSelect,
  onClose,
}: {
  onSelect: (type: PageType) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 left-4 mt-1 w-44 rounded-xl border border-border/60 bg-card shadow-xl overflow-hidden"
    >
      {(Object.entries(PAGE_TYPE_META) as [PageType, { label: string; emoji: string }][]).map(([type, meta]) => {
        const Icon = PAGE_ICONS[type];
        return (
          <button
            key={type}
            onClick={() => { onSelect(type); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-muted/40 transition-colors text-left"
          >
            <span className="text-base">{meta.emoji}</span>
            <span className="flex-1">{meta.label}</span>
            <Icon className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        );
      })}
    </div>
  );
}

// ─── Tree node ────────────────────────────────────────────────────────────────

interface PageNodeProps {
  node: TreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateChild: (parentId: string, type: PageType) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

function PageNode({
  node, depth, selectedId, onSelect, onCreateChild, onRename, onDelete,
  expanded, onToggle,
}: PageNodeProps) {
  const [hovered, setHovered] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(node.title);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;
  const hasChildren = node.children.length > 0;
  const Icon = PAGE_ICONS[node.pageType];

  useEffect(() => { setDraft(node.title); }, [node.title]);
  useEffect(() => { if (renaming) inputRef.current?.focus(); }, [renaming]);

  const commitRename = () => {
    setRenaming(false);
    if (draft.trim() && draft.trim() !== node.title) onRename(node.id, draft.trim());
  };

  return (
    <div>
      <div
        className={cn(
          "group relative flex items-center gap-1 rounded-md transition-colors cursor-pointer select-none",
          "min-h-[30px] pr-1",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/30"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
        onClick={() => { if (!renaming) onSelect(node.id); }}
      >
        {/* Expand toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          className={cn(
            "w-4 h-4 flex items-center justify-center flex-shrink-0 rounded transition-colors",
            hasChildren ? "hover:bg-muted/60" : "opacity-0 pointer-events-none"
          )}
        >
          <ChevronRight
            className={cn("w-3 h-3 transition-transform text-muted-foreground/60", isExpanded && "rotate-90")}
          />
        </button>

        {/* Icon */}
        <span className="text-sm flex-shrink-0 w-5 text-center">{node.icon}</span>

        {/* Title */}
        {renaming ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); commitRename(); }
              if (e.key === "Escape") { setDraft(node.title); setRenaming(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-muted/40 rounded px-1 py-0.5 text-sm outline-none border border-primary/40 min-w-0"
          />
        ) : (
          <span
            className={cn(
              "flex-1 text-sm truncate",
              isSelected ? "text-primary font-medium" : "text-foreground/80"
            )}
            onDoubleClick={(e) => { e.stopPropagation(); setRenaming(true); }}
          >
            {node.title}
          </span>
        )}

        {/* Hover actions */}
        {hovered && !renaming && (
          <div className="flex items-center gap-0.5 ml-auto flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            {/* Add subpage */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground transition-colors"
                title="Añadir subpágina"
              >
                <Plus className="w-3 h-3" />
              </button>
              {showAddMenu && (
                <NewPagePicker
                  onSelect={(type) => { onCreateChild(node.id, type); setShowAddMenu(false); }}
                  onClose={() => setShowAddMenu(false)}
                />
              )}
            </div>

            {/* More / delete */}
            <button
              onClick={() => {
                if (confirmDelete) { onDelete(node.id); }
                else setConfirmDelete(true);
              }}
              className={cn(
                "w-5 h-5 flex items-center justify-center rounded transition-colors",
                confirmDelete
                  ? "bg-destructive/20 text-destructive hover:bg-destructive/40"
                  : "hover:bg-muted/60 text-muted-foreground/60 hover:text-foreground"
              )}
              title={confirmDelete ? "Confirmar eliminación" : "Eliminar"}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded && node.children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
          >
            {node.children.map((child) => (
              <PageNode
                key={child.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                onCreateChild={onCreateChild}
                onRename={onRename}
                onDelete={onDelete}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface WorkspaceSidebarProps {
  workspaceId: string;
  workspaceTitle: string;
  workspaceIcon: string;
  pages: WorkspacePage[];
  selectedPageId: string | null;
  onSelectPage: (id: string) => void;
  onCreatePage: (parentId: string | null, type: PageType) => void;
  onDeletePage: (id: string) => void;
  onRenamePage: (id: string, title: string) => void;
  onRenameWorkspace: (title: string) => void;
  loading?: boolean;
}

export function WorkspaceSidebar({
  workspaceId,
  workspaceTitle,
  workspaceIcon,
  pages,
  selectedPageId,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onRenamePage,
  onRenameWorkspace,
  loading,
}: WorkspaceSidebarProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showRootPicker, setShowRootPicker] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(workspaceTitle);
  const rootPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setTitleDraft(workspaceTitle); }, [workspaceTitle]);

  const tree = buildTree(pages);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const commitTitle = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft.trim() !== workspaceTitle) {
      onRenameWorkspace(titleDraft.trim());
    }
  };

  return (
    <div className="w-56 flex-shrink-0 flex flex-col border-r border-border/50 bg-sidebar/50 overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-4 pb-2 border-b border-border/30">
        <button
          onClick={() => router.push("/workspace")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-foreground transition-colors mb-3"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Áreas
        </button>

        {/* Workspace title */}
        <div className="flex items-center gap-2">
          <span className="text-xl">{workspaceIcon}</span>
          {editingTitle ? (
            <input
              value={titleDraft}
              autoFocus
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitTitle(); }
                if (e.key === "Escape") { setTitleDraft(workspaceTitle); setEditingTitle(false); }
              }}
              className="flex-1 bg-transparent text-sm font-semibold outline-none border-b border-primary/40 min-w-0"
            />
          ) : (
            <span
              className="flex-1 text-sm font-semibold text-foreground/90 truncate cursor-text hover:text-foreground"
              onDoubleClick={() => setEditingTitle(true)}
              title="Doble clic para renombrar"
            >
              {workspaceTitle}
            </span>
          )}
        </div>
      </div>

      {/* Page tree */}
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {loading && pages.length === 0 && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && pages.length === 0 && (
          <p className="text-xs text-muted-foreground/40 text-center py-6 italic px-2">
            Sin páginas aún
          </p>
        )}

        {tree.map((node) => (
          <PageNode
            key={node.id}
            node={node}
            depth={0}
            selectedId={selectedPageId}
            onSelect={onSelectPage}
            onCreateChild={(parentId, type) => {
              onCreatePage(parentId, type);
              setExpanded((prev) => new Set([...prev, parentId]));
            }}
            onRename={onRenamePage}
            onDelete={onDeletePage}
            expanded={expanded}
            onToggle={toggleExpand}
          />
        ))}
      </div>

      {/* Footer: new page */}
      <div className="px-2 py-3 border-t border-border/30 relative">
        <button
          onClick={() => setShowRootPicker(!showRootPicker)}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva página
        </button>
        {showRootPicker && (
          <div className="absolute bottom-full left-2 mb-1" ref={rootPickerRef}>
            <NewPagePicker
              onSelect={(type) => { onCreatePage(null, type); setShowRootPicker(false); }}
              onClose={() => setShowRootPicker(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

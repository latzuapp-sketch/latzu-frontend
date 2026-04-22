// Workspace module types

export type PageType = "page" | "note" | "pdf" | "podcast" | "video";

export interface WorkspaceDoc {
  id: string;
  title: string;
  description: string;
  icon: string;     // emoji
  userId: string;
  createdAt: string;
}

export interface WorkspacePage {
  id: string;
  workspaceId: string;
  parentId: string | null;   // null = top-level in workspace
  title: string;
  icon: string;              // emoji
  pageType: PageType;
  content: string;           // serialized Block[] JSON
  mediaUrl: string | null;   // pdf / podcast / video pages
  order: number;             // float — Date.now() on create
  userId: string;
  createdAt: string;
}

export interface TreeNode extends WorkspacePage {
  children: TreeNode[];
}

export function buildTree(
  pages: WorkspacePage[],
  parentId: string | null = null,
  depth = 0,
  visited = new Set<string>()
): TreeNode[] {
  if (depth > 10) return [];
  return pages
    .filter((p) => p.parentId === parentId && !visited.has(p.id))
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
    .map((p) => {
      visited.add(p.id);
      return { ...p, children: buildTree(pages, p.id, depth + 1, visited) };
    });
}

export const PAGE_TYPE_META: Record<PageType, { label: string; emoji: string }> = {
  page:    { label: "Página",   emoji: "📄" },
  note:    { label: "Nota",     emoji: "📝" },
  pdf:     { label: "PDF",      emoji: "📑" },
  podcast: { label: "Podcast",  emoji: "🎙" },
  video:   { label: "Vídeo",    emoji: "🎬" },
};

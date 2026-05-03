"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace, useWorkspaces } from "@/hooks/useWorkspace";
import { useWorkspacePages } from "@/hooks/useWorkspacePages";
import { useTrackInteraction } from "@/hooks/useOrganizerAgent";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { PageContent } from "@/components/workspace/PageContent";
import type { WorkspacePage, PageType } from "@/types/workspace";

export default function WorkspaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPageId = searchParams.get("page");

  const { workspace, loading: wsLoading } = useWorkspace(id);
  const { updateWorkspace } = useWorkspaces();
  const { track } = useTrackInteraction();

  // Emit workspace.visited once per workspace mount.
  useEffect(() => {
    if (!id) return;
    track("workspace.visited", { targetId: id, targetType: "workspace", workspaceId: id });
  }, [id, track]);
  const {
    pages,
    loading: pagesLoading,
    createPage,
    updatePage,
    deletePage,
  } = useWorkspacePages(id);

  // Resolve the current page (from URL param or first root page)
  const currentPage = useMemo(() => {
    if (!pages.length) return null;
    if (currentPageId) {
      const found = pages.find((p) => p.id === currentPageId);
      if (found) return found;
    }
    // Fall back to first root page by order
    const rootPages = pages
      .filter((p) => p.parentId === null)
      .sort((a, b) => a.order - b.order);
    return rootPages[0] ?? null;
  }, [pages, currentPageId]);

  // Auto-navigate to the first page if none selected
  useEffect(() => {
    if (!pagesLoading && currentPage && currentPage.id !== currentPageId) {
      router.replace(`/workspace/${id}?page=${currentPage.id}`, { scroll: false });
    }
  }, [currentPage, currentPageId, id, pagesLoading, router]);

  const navigateToPage = useCallback(
    (pageId: string) => {
      router.push(`/workspace/${id}?page=${pageId}`, { scroll: false });
    },
    [id, router]
  );

  const handleCreatePage = useCallback(
    async (parentId: string | null, type: PageType = "page") => {
      const page = await createPage({ parentId, pageType: type });
      if (page) navigateToPage(page.id);
    },
    [createPage, navigateToPage]
  );

  const handleDeletePage = useCallback(
    async (pageId: string) => {
      await deletePage(pageId);
      // If deleting the current page, navigate to another
      if (currentPageId === pageId) {
        const remaining = pages.filter((p) => p.id !== pageId);
        const next = remaining.find((p) => p.parentId === null) ?? remaining[0];
        if (next) {
          router.push(`/workspace/${id}?page=${next.id}`, { scroll: false });
        } else {
          router.push(`/workspace/${id}`, { scroll: false });
        }
      }
    },
    [deletePage, currentPageId, pages, id, router]
  );

  const handleSavePage = useCallback(
    async (pageId: string, updates: Partial<WorkspacePage>) => {
      await updatePage(pageId, updates);
    },
    [updatePage]
  );

  const handleRenamePage = useCallback(
    (pageId: string, title: string) => updatePage(pageId, { title }),
    [updatePage]
  );

  const handleRenameWorkspace = useCallback(
    (title: string) => updateWorkspace(id, { title }),
    [id, updateWorkspace]
  );

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (wsLoading && !workspace) {
    return (
      <div className="-m-6 flex items-center justify-center" style={{ height: "calc(100dvh - 64px)" }}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!workspace && !wsLoading) {
    return (
      <div className="-m-6 flex flex-col items-center justify-center gap-4" style={{ height: "calc(100dvh - 64px)" }}>
        <p className="text-muted-foreground">Área de trabajo no encontrada.</p>
        <Button variant="ghost" size="sm" onClick={() => router.push("/workspace")}>
          Volver a Workspace
        </Button>
      </div>
    );
  }

  return (
    <div
      className="-m-6 flex overflow-hidden"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {/* Sidebar */}
      <WorkspaceSidebar
        workspaceId={id}
        workspaceTitle={workspace?.title ?? ""}
        workspaceIcon={workspace?.icon ?? "📁"}
        pages={pages}
        selectedPageId={currentPage?.id ?? null}
        onSelectPage={navigateToPage}
        onCreatePage={handleCreatePage}
        onDeletePage={handleDeletePage}
        onRenamePage={handleRenamePage}
        onRenameWorkspace={handleRenameWorkspace}
        loading={pagesLoading}
      />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {pagesLoading && !currentPage && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!pagesLoading && !currentPage && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
            <div className="text-5xl">{workspace?.icon ?? "📁"}</div>
            <div className="space-y-1">
              <p className="font-semibold text-lg">{workspace?.title}</p>
              {workspace?.description && (
                <p className="text-sm text-muted-foreground/70">{workspace.description}</p>
              )}
            </div>
            <p className="text-sm text-muted-foreground/50">
              Sin páginas todavía. Crea la primera desde la barra lateral.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCreatePage(null, "page")}
              className="gap-1.5"
            >
              Crear primera página
            </Button>
          </div>
        )}

        {currentPage && (
          <PageContent
            page={currentPage}
            onSave={handleSavePage}
          />
        )}
      </div>
    </div>
  );
}
